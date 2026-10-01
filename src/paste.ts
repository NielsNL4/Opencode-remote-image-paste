export interface ClipboardPaste {
  readText(): PromiseLike<string>;
  readImage(): Promise<Uint8Array | undefined>;
  pasteText(): Promise<void>;
  pasteImage(image: Uint8Array): Promise<void>;
}

export async function pasteClipboard(actions: ClipboardPaste): Promise<void> {
  // The VS Code clipboard API reads local text over Remote-SSH without
  // starting a PowerShell process. Image-only clipboard contents need one.
  if (await actions.readText()) {
    await actions.pasteText();
    return;
  }

  const image = await actions.readImage();
  if (image) {
    await actions.pasteImage(image);
    return;
  }

  await actions.pasteText();
}
