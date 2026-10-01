import assert from 'node:assert/strict';
import { test } from 'node:test';
import type * as vscode from 'vscode';
import { remoteImageUri } from '../remote-image';

function folder(authority: string, path: string): vscode.WorkspaceFolder {
  const uri = {
    scheme: 'vscode-remote',
    authority,
    path,
    with(change: { path: string; query: string; fragment: string }) {
      return { ...uri, ...change };
    },
  };
  return { uri } as unknown as vscode.WorkspaceFolder;
}

test('multiple projects on one SSH host save outside either project on that host', () => {
  const image = remoteImageUri([
    folder('ssh-remote+my-server', '/home/user/project-a'),
    folder('ssh-remote+my-server', '/home/user/project-b'),
  ]);
  assert.equal(image.authority, 'ssh-remote+my-server');
  assert.match(image.path, /^\/tmp\/opencode-image-paste-[0-9a-f-]+\.png$/);
});

test('rejects windows without a remote folder and conflicting SSH hosts', () => {
  assert.throws(() => remoteImageUri(undefined), /Remote-SSH/);
  assert.throws(() => remoteImageUri([
    folder('ssh-remote+one', '/home/user/a'),
    folder('ssh-remote+two', '/home/user/b'),
  ]), /Remote-SSH/);
});
