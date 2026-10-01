// OpenCode's TUI recognizes a pasted *standalone* local image path as an
// attachment. Terminal.sendText(path, false) merely types it; the bracketed
// paste markers are needed to trigger its onPaste handler without submitting.
export function imagePasteSequence(absoluteRemotePath: string): string {
  if (!/^\/tmp\/opencode-image-paste-[0-9a-f-]+\.png$/.test(absoluteRemotePath)) {
    throw new Error('Ongeldig pad voor de tijdelijke afbeelding.');
  }
  return `\x1b[200~${absoluteRemotePath}\x1b[201~`;
}
