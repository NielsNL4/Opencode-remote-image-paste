# OpenCode Remote Image Paste

Paste an image from the **Windows** clipboard into the **existing** OpenCode TUI in a VS Code Remote-SSH integrated terminal. The extension keeps your current terminal, OpenCode session and project directory.

## Install locally

```bash
npm install
npm test
npm run package
```

Copy the generated `.vsix` from Linux to your Windows PC (for example with `scp` from a local PowerShell prompt). In a **local** VS Code window, use **Extensions → … → Install from VSIX…** and choose that file. Reopen your Remote-SSH project window afterward. Check **Developer: Show Running Extensions** if necessary: this extension must run under *Local*, not *SSH*. Open a project folder on the Linux host with Remote-SSH and start OpenCode in its integrated terminal. To upgrade, install the newer VSIX the same way and reload the Remote-SSH window.

VS Code's terminal only dispatches custom terminal shortcuts to extensions when the command skips the shell. Add this entry to your **User Settings (JSON)** (append it if you already have a `terminal.integrated.commandsToSkipShell` list):

```jsonc
"terminal.integrated.commandsToSkipShell": [
  "opencodeRemoteImagePaste.paste"
]
```

Keep `terminal.integrated.sendKeybindingsToShell` disabled (the default); enabling it may override this setting.

## Use

1. Copy an image or take a screenshot to the Windows clipboard.
2. Focus the integrated terminal where OpenCode is already running and press `Ctrl+V`.
3. OpenCode should display `[Image 1]` in the current prompt; write your question and press Enter yourself. Subsequent images can be attached the same way.

Text in the clipboard immediately uses VS Code's normal terminal paste; PowerShell is only started when no text is present. If an application puts both plain text and an image on the clipboard, the plain text wins. A model with image input support is required for OpenCode to analyze the attachment.

## How it works

The extension runs locally on Windows (`extensionKind: ui`) and checks for text through VS Code's clipboard API first. For image-only clipboard contents it reads image data with PowerShell, writes a PNG (up to 10 MB) through VS Code's Remote-SSH file system provider to `/tmp/opencode-image-paste-<uuid>.png` on Linux, then sends a bracketed paste of that **remote path** to the terminal that was active when you pressed `Ctrl+V`. OpenCode's TUI interprets that pasted image path as an attachment. The clipboard contents are not changed, and no new terminal or OpenCode session is started.

Images are kept for up to 24 hours while the extension stays running and are removed on its periodic cleanup. Linux typically also cleans `/tmp` on reboot. The VS Code window needs a remote project folder open; multiple project folders on the same SSH host are supported.

## Verification on Windows + Remote-SSH

- Open one VS Code window on each of two different remote project folders, and launch OpenCode in each terminal.
- Paste a screenshot in one existing session. Confirm that `[Image 1]` appears, submit a question about the screenshot and check the response.
- Paste a second screenshot in the other project and verify that its own session receives it. Try with two terminals in a single window too.
- Paste plain and multiline text to check that regular terminal paste still works. Test when no image is present.

The build and automated tests can run on Linux, but checking the Windows clipboard and the OpenCode attachment requires a real VS Code Windows client connected with Remote-SSH.
