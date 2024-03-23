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
    chapterName === 'chapter02'
      ? "\nimport {extractExamples} from 'ohm-js/extras'';"
      : '';
  return `import assert from 'node:assert';
import * as ohm from 'ohm-js';${extraImports}

// Your code goes here.
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
  process.chdir(destDir);

  const readme = `# 🧱 WebAssembly from the Ground Up

Welcome! We've initialized a new project template for you. You can copy the
code from the book into the files in the chapters/ directory.

Here are some useful commands:

- ${'`'}npm test${'`'} to run all tests for all chapters.
- ${'`'}node --test chapters/<filename>${'`'} to run tests for a specific chapter.
  E.g., ${'`'}node --test chapters/chapter01.js${'`'} for Chapter 1.
`;
  fs.writeFileSync('README.md', readme);

  fs.mkdirSync('chapters');

  for (const name of fs.readdirSync('.')) {
    if (!name.match(/chapter.\d$/)) continue;

    fs.rmSync(name, { recursive: true, force: true });
    fs.writeFileSync(path.join('chapters', `${name}.js`), getSource(name));
  }
  execFileSync('npm', ['install'], { stdio: 'inherit' });

  console.log(
    `\nYou're all set! You can do ${'`'}cd ${destDir}${'`'} to get started.`,
  );
})();
