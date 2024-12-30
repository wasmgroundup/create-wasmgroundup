#!/usr/bin/env node

import degit from "degit";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const usage = "Usage: create-wasmgroundup dest_dir";

function bail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

const destDir = process.argv[2];
if (!destDir) bail(`no destination directory specified\n\n${usage}`);

(async function main() {
  const emitter = degit("https://github.com/wasmgroundup/reader-template", {
    cache: false,
  });

  emitter.on("info", (info) => {
    console.log(info.message);
  });

  try {
    await emitter.clone(destDir);
  } catch (err) {
    if (err.code == "DEST_NOT_EMPTY") {
      bail("destination directory not empty");
    }
    throw err;
  }
  process.chdir(destDir);
  console.log('Running "npm install" in the destination directory...');
  spawnSync("npm", ["install", "--silent"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  console.log(readFileSync("README.md", "utf8").trimEnd());
  console.log(
    `\nYou're all set! You can do ${"`"}cd ${destDir}${"`"} to get started.`,
  );
})();
