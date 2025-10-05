#!/usr/bin/env node

import { cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { argv, chdir, exit } from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataProjectRoot = join(__dirname, "..");

chdir(dataProjectRoot);

const [, script, source, destination] = argv;

export async function ncp(src, dest) {
  try {
    await cp(src, dest, { recursive: true, force: true });
    console.log(`Successfully copied ${src} to ${dest}`);
  } catch (error) {
    console.error(`Error copying: ${error.message}`);

    exit(1);
  }
}

function usage() {
  console.error(`${script} [source] [dest]`);
}

if (!source || !destination) {
  usage();

  exit(1);
}

await ncp(source, destination);
