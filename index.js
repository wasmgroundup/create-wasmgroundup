#!/usr/bin/env node

import { execFileSync } from 'child_process';
import degit from 'degit';
import fs from 'fs';
import path from 'path';

const usage = 'Usage: create-wasmgroundup dest_dir';

function bail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

const destDir = process.argv[2];
if (!destDir) bail(`no destination directory specified\n\n${usage}`);

function getSource(chapterName) {
  const extraImports =
    chapterName === 'chapter01' ? '' : ', ohm, extractExamples';
  return `import { setup } from '../book.js';

const { test, assert${extraImports} } = setup('${chapterName}');

// Your code goes here.

test.run();
`;
}

(async function main() {
  const emitter = degit('https://github.com/wasmgroundup/code#main', {
    cache: false,
  });

  emitter.on('info', (info) => {
    console.log(info.message);
  });

  try {
    await emitter.clone(destDir);
  } catch (err) {
    if (err.code == 'DEST_NOT_EMPTY') {
      bail('destination directory not empty');
    }
    throw err;
  }

  fs.mkdirSync(path.join(destDir, 'chapters'));

  for (const name of fs.readdirSync(destDir)) {
    if (!name.match(/chapter.\d$/)) continue;

    fs.rmSync(path.join(destDir, name), { recursive: true, force: true });
    fs.writeFileSync(
      path.join(destDir, 'chapters', `${name}.js`),
      getSource(name),
    );
  }
  process.chdir(destDir);
  execFileSync('npm', ['install'], { stdio: 'inherit' });
})();
