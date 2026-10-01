import * as vscode from 'vscode';
import { readWindowsClipboardImage } from './clipboard';
import { pasteClipboard } from './paste';
import { RemoteImages } from './remote-image';
import { imagePasteSequence } from './terminal-paste';

const contextKey = 'opencodeRemoteImagePaste.available';

export function activate(context: vscode.ExtensionContext): void {
  const available = process.platform === 'win32' && vscode.env.remoteName === 'ssh-remote';
  void vscode.commands.executeCommand('setContext', contextKey, available);

  const images = new RemoteImages(vscode.workspace.fs);
  context.subscriptions.push(images);

  let pasting = false;
  context.subscriptions.push(vscode.commands.registerCommand('opencodeRemoteImagePaste.paste', async () => {
    if (pasting) return;
    const terminal = vscode.window.activeTerminal;
    if (!terminal) {
      void vscode.window.showWarningMessage('Selecteer eerst de terminal waarin OpenCode draait.');
      return;
    }
    if (!available) {
      void vscode.window.showWarningMessage('OpenCode Image Paste vereist VS Code op Windows met Remote-SSH.');
      return;
    }

    pasting = true;
    try {
      await pasteClipboard({
        readText: () => vscode.env.clipboard.readText(),
        readImage: readWindowsClipboardImage,
        pasteText: async () => {
          // Delegate text, including multiline text, to VS Code's ordinary paste.
          if (vscode.window.activeTerminal !== terminal) terminal.show(false);
          await vscode.commands.executeCommand('workbench.action.terminal.paste');
        },
        pasteImage: async (image) => {
          const filePath = await images.write(vscode.workspace.workspaceFolders, image);
          // Never look up activeTerminal again: other terminals may become active
          // while clipboard extraction or remote writing is in progress.
          terminal.sendText(imagePasteSequence(filePath), false);
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(`OpenCode Image Paste: ${message}`);
    } finally {
      pasting = false;
    }
  }));
}

export function deactivate(): void {
  void vscode.commands.executeCommand('setContext', contextKey, false);
}
