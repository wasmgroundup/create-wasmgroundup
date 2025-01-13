#!/usr/bin/env node

import degit from "degit";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import prompts from "prompts";

const usage = "Usage: create-wasmgroundup <dest_dir>";

const userAgent = process.env.npm_config_user_agent ?? "";
const pkgMan = /pnpm/.test(userAgent)
  ? "pnpm"
  : /yarn/.test(userAgent)
  ? "yarn"
  : /bun/.test(userAgent)
  ? "bun"
  : "npm";

function bail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

async function cloneTemplate(destDir) {
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
}

(async function main() {
  let targetDir = process.argv[2];
  const defaultProjectName = !targetDir ? "wasmgroundup" : targetDir;
  let result = {};
  try {
    result = await prompts([
      {
        name: "projectName",
        type: targetDir ? null : "text",
        message: "Project name",
        initial: defaultProjectName,
        onState: (state) =>
          (targetDir = String(state.value).trim() || defaultProjectName),
      },
    ]);
  } catch (cancelled) {
    console.log(cancelled.message);
    process.exit(1);
  }
  await cloneTemplate(targetDir);

  process.chdir(targetDir);
  console.log(`Running '${pkgMan} install' in the destination directory...`);
  spawnSync(pkgMan, ["install", "--silent"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  console.log(readFileSync("README.md", "utf8").trimEnd());
  console.log(
    `\nYou're all set! You can do ${"`"}cd ${targetDir}${"`"} to get started.`,
  );
  process.exit(0);
})();
