import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pasteClipboard } from '../paste';

test('text uses normal terminal paste without launching image detection', async () => {
  const steps: string[] = [];
  await pasteClipboard({
    readText: async () => { steps.push('readText'); return 'paste this'; },
    readImage: async () => { throw new Error('Image detection must not run for text'); },
    pasteText: async () => { steps.push('pasteText'); },
    pasteImage: async () => { throw new Error('Text must not be sent as an image'); },
  });
  assert.deepEqual(steps, ['readText', 'pasteText']);
});

test('image-only clipboard still attaches image instead of text', async () => {
  const image = new Uint8Array([137, 80, 78, 71]);
  const steps: string[] = [];
  await pasteClipboard({
    readText: async () => { steps.push('readText'); return ''; },
    readImage: async () => { steps.push('readImage'); return image; },
    pasteText: async () => { throw new Error('Screenshot must not use text paste'); },
    pasteImage: async (actual) => { assert.strictEqual(actual, image); steps.push('pasteImage'); },
  });
  assert.deepEqual(steps, ['readText', 'readImage', 'pasteImage']);
});

test('empty clipboard falls through to normal paste', async () => {
  const steps: string[] = [];
  await pasteClipboard({
    readText: async () => '',
    readImage: async () => undefined,
    pasteText: async () => { steps.push('pasteText'); },
    pasteImage: async () => { throw new Error('No image present'); },
  });
  assert.deepEqual(steps, ['pasteText']);
});
