#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_ROOT = path.join(ROOT, "plugins", "vdufloth", "skills");
const PLUGIN_ID = "vdufloth@vdufloth-agent-plugins";
const CLAUDE_PLUGIN_ID = "vdufloth@vdufloth-claude-plugins";

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${filePath}: ${error.message}`);
  }
}

function skillNames(skillsRoot) {
  try {
    return fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => fs.existsSync(path.join(skillsRoot, name, "SKILL.md")))
      .sort();
  } catch (error) {
    fail(`${skillsRoot}: ${error.message}`);
  }
}

const expected = skillNames(SKILLS_ROOT);

function assertInstalled(installRoot, client) {
  const actual = skillNames(path.join(installRoot, "skills"));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${client} installed skills [${actual.join(", ")}], expected [${expected.join(", ")}]`);
  }
}

function assertSkillsList(filePath) {
  const output = fs.readFileSync(filePath, "utf8")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "");
  const count = output.match(/Found\s+(\d+)\s+skills?/i);
  if (!count || Number(count[1]) !== expected.length) {
    fail(`skills CLI reported ${count?.[1] ?? "no"} skills, expected ${expected.length}`);
  }
  for (const name of expected) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`(?:^|\\n)[│ ]*${escaped}\\s*(?:\\n|$)`).test(output)) {
      fail(`skills CLI did not list ${name}`);
    }
  }
}

function assertCodex(availablePath, installPath) {
  const result = readJson(availablePath);
  if (result.available?.length !== 1 || result.available[0].pluginId !== PLUGIN_ID) {
    fail(`Codex did not discover exactly ${PLUGIN_ID}`);
  }
  const install = readJson(installPath);
  if (typeof install.installedPath !== "string") fail("Codex did not report an installed path");
  assertInstalled(install.installedPath, "Codex");
}

function assertClaude(pluginListPath) {
  const plugins = readJson(pluginListPath);
  const plugin = plugins.find((entry) => entry.id === CLAUDE_PLUGIN_ID);
  if (!plugin || typeof plugin.installPath !== "string") {
    fail(`Claude did not install ${CLAUDE_PLUGIN_ID}`);
  }
  assertInstalled(plugin.installPath, "Claude");
}

const [mode, ...args] = process.argv.slice(2);
if (mode === "skills-list" && args.length === 1) assertSkillsList(args[0]);
else if (mode === "codex" && args.length === 2) assertCodex(args[0], args[1]);
else if (mode === "claude" && args.length === 1) assertClaude(args[0]);
else {
  console.error("Usage: node scripts/assert-discovery.mjs skills-list <output> | codex <available-json> <install-json> | claude <plugin-list-json>");
  process.exit(2);
}

console.log(`Discovery checks passed (${expected.length} skills).`);
