import { randomUUID } from 'node:crypto';
import type * as vscode from 'vscode';

// Keep attachments out of the repository and independent of the terminal cwd.
// The remote file system provider routes this URI over VS Code's existing SSH
// connection; no separate SSH login, server or OpenCode session is created.
export function remoteImageUri(folders: readonly vscode.WorkspaceFolder[] | undefined): vscode.Uri {
  const remotes = folders?.filter((folder) =>
    folder.uri.scheme === 'vscode-remote' && folder.uri.authority.startsWith('ssh-remote+')) ?? [];
  const authorities = new Set(remotes.map((folder) => folder.uri.authority));
  if (authorities.size !== 1) {
    throw new Error('Open een projectmap via Remote-SSH om een afbeelding naar die server te sturen.');
  }

  const root = remotes[0].uri;
  return root.with({
    path: `/tmp/opencode-image-paste-${randomUUID()}.png`,
    query: '',
    fragment: '',
  });
}

export class RemoteImages implements vscode.Disposable {
  private readonly files = new Map<string, { uri: vscode.Uri; created: number }>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(private readonly fs: vscode.FileSystem) {
    this.cleanupTimer = setInterval(() => void this.cleanup(), 60 * 60 * 1000);
  }

  async write(folders: readonly vscode.WorkspaceFolder[] | undefined, image: Uint8Array): Promise<string> {
    const uri = remoteImageUri(folders);
    await this.fs.writeFile(uri, image);
    this.files.set(uri.toString(), { uri, created: Date.now() });
    return uri.path;
  }

  private async cleanup(): Promise<void> {
    for (const [key, file] of this.files) {
      if (Date.now() - file.created < 24 * 60 * 60 * 1000) continue;
      try {
        await this.fs.delete(file.uri);
        this.files.delete(key);
      } catch {
        // A disconnected SSH host can be retried at the next interval.
      }
    }
  }

  dispose(): void {
    clearInterval(this.cleanupTimer);
  }
}
