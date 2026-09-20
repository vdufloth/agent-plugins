#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = "plugins/vdufloth/plugin.json";
const CHANGELOG = "CHANGELOG.md";

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function git(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) fail(result.stderr.trim() || `git ${args.join(" ")} failed`);
  return result.stdout;
}

function parseVersion(value, label) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
  if (!match) fail(`${label} version is not semantic: ${value}`);
  return match.slice(1).map(Number);
}

function newer(current, previous) {
  for (let index = 0; index < current.length; index += 1) {
    if (current[index] !== previous[index]) return current[index] > previous[index];
  }
  return false;
}

const [base] = process.argv.slice(2);
if (!base || process.argv.length !== 3) {
  console.error("Usage: node scripts/check-release.mjs <base-git-revision>");
  process.exit(2);
}
if (/^0+$/.test(base)) {
  console.log("Release bookkeeping skipped: the push has no base revision.");
  process.exit(0);
}

git(["cat-file", "-e", `${base}^{commit}`]);
const changes = git(["diff", "--name-status", base, "--", "plugins/vdufloth/skills", CHANGELOG, MANIFEST])
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [status, ...files] = line.split("\t");
    return { status, files };
  });
const skillChanges = changes.filter(({ files }) => files.some((file) => file.startsWith("plugins/vdufloth/skills/")));
if (skillChanges.length === 0) {
  console.log("Release bookkeeping passed (no skill changes).");
  process.exit(0);
}

let previousManifest;
try {
  previousManifest = JSON.parse(git(["show", `${base}:${MANIFEST}`]));
} catch (error) {
  fail(`could not read the base manifest: ${error.message}`);
}
const currentManifest = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFEST), "utf8"));
const previous = parseVersion(previousManifest.version, "base manifest");
const current = parseVersion(currentManifest.version, "current manifest");
if (!newer(current, previous)) {
  fail(`skill changes require a version newer than ${previousManifest.version}`);
}

const addedSkill = skillChanges.some(({ status, files }) =>
  status.startsWith("A") && files.some((file) => /\/skills\/[^/]+\/SKILL\.md$/.test(file))
);
if (addedSkill && current[0] === previous[0] && current[1] <= previous[1]) {
  fail(`adding a skill requires at least a minor version bump from ${previousManifest.version}`);
}

const changelogChanged = changes.some(({ files }) => files.includes(CHANGELOG));
if (!changelogChanged) fail("skill changes require a CHANGELOG.md update");
const changelog = fs.readFileSync(path.join(ROOT, CHANGELOG), "utf8");
if (!changelog.includes(`## ${currentManifest.version} - `)) {
  fail(`CHANGELOG.md needs a ${currentManifest.version} release heading`);
}

console.log(`Release bookkeeping passed (${previousManifest.version} -> ${currentManifest.version}).`);
