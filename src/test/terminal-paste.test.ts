import assert from 'node:assert/strict';
import { test } from 'node:test';
import { imagePasteSequence } from '../terminal-paste';

test('inserts exactly one absolute remote path as a bracketed paste without Enter', () => {
  const path = '/tmp/opencode-image-paste-797d7ca5-a476-4696-9eb6-886e0956591e.png';
  assert.equal(imagePasteSequence(path), `\x1b[200~${path}\x1b[201~`);
});

test('rejects control characters or paths outside our temporary images', () => {
  assert.throws(() => imagePasteSequence('/tmp/other.png\r'), /Ongeldig pad/);
  assert.throws(() => imagePasteSequence('/home/user/project/image.png'), /Ongeldig pad/);
});
