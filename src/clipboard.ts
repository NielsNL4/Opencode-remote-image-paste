import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Run in the LOCAL Windows UI extension host. VS Code's clipboard API only
// exposes text, and a remote extension would see the Linux clipboard instead.
const readPngScript = [
  'Add-Type -AssemblyName System.Windows.Forms',
  'Add-Type -AssemblyName System.Drawing',
  '$image = [System.Windows.Forms.Clipboard]::GetImage()',
  'if ($null -eq $image) { exit 2 }',
  '$stream = New-Object System.IO.MemoryStream',
  'try {',
  '  $image.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)',
  '  [Console]::Out.Write([Convert]::ToBase64String($stream.ToArray()))',
  '} finally { $stream.Dispose(); $image.Dispose() }',
].join('\n');

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function readWindowsClipboardImage(): Promise<Buffer | undefined> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-STA', '-Command', readPngScript],
      {
        windowsHide: true,
        timeout: 15000,
        maxBuffer: Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 1024,
        encoding: 'utf8',
      }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException & { code?: number }).code === 2) return undefined;
    throw new Error('Kan het Windows-klembord niet lezen met PowerShell.', { cause: error });
  }

  if (!stdout) return undefined;
  const bytes = Buffer.from(stdout, 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error('De afbeelding is leeg of groter dan 10 MB.');
  }
  // A malformed clipboard response must never be saved as a .png attachment.
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error('Het klembord bevat geen geldige PNG-afbeelding.');
  }
  return bytes;
}
