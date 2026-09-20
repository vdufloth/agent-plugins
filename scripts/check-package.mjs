#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN_ROOT = path.join(ROOT, "plugins", "vdufloth");
const SKILLS_ROOT = path.join(PLUGIN_ROOT, "skills");
const PORTABLE_PATH = path.join(PLUGIN_ROOT, "plugin.json");
const CLAUDE_PLUGIN_PATH = path.join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
const CLAUDE_MARKETPLACE_PATH = path.join(ROOT, ".claude-plugin", "marketplace.json");
const CODEX_MARKETPLACE_PATH = path.join(ROOT, ".agents", "plugins", "marketplace.json");
const README_PATH = path.join(ROOT, "README.md");
const errors = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${path.relative(ROOT, filePath)}: ${error.message}`);
    return {};
  }
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function replaceOnlyVersion(filePath, nextVersion) {
  const original = fs.readFileSync(filePath, "utf8");
  const matches = [...original.matchAll(/("version"\s*:\s*)"(?:\\.|[^"\\])*"/g)];
  if (matches.length !== 1) throw new Error(`${filePath}: expected exactly one version field`);
  const updated = original.replace(matches[0][0], `${matches[0][1]}${JSON.stringify(nextVersion)}`);
  if (updated !== original) fs.writeFileSync(filePath, updated);
}

function syncDerivedVersions() {
  const portable = JSON.parse(fs.readFileSync(PORTABLE_PATH, "utf8"));
  assert(typeof portable.version === "string", "portable manifest version must be a string");
  if (errors.length) return;
  replaceOnlyVersion(CLAUDE_PLUGIN_PATH, portable.version);
  replaceOnlyVersion(CLAUDE_MARKETPLACE_PATH, portable.version);
}

function parseFrontmatter(skillPath) {
  const text = fs.readFileSync(skillPath, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { text, fields: {} };
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z][a-z0-9-]*):\s*(.*?)\s*$/);
    if (field) fields[field[1]] = field[2];
  }
  return { text, fields };
}

function immediateSkillNames() {
  return fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function checkSkills(skillNames) {
  for (const name of skillNames) {
    const skillPath = path.join(SKILLS_ROOT, name, "SKILL.md");
    assert(fs.existsSync(skillPath), `skills/${name} must contain SKILL.md`);
    if (!fs.existsSync(skillPath)) continue;
    const { fields } = parseFrontmatter(skillPath);
    assert(fields.name === name, `skills/${name}: frontmatter name must be ${name}`);
    assert(Boolean(fields.description), `skills/${name}: description is required`);
    checkOpenAiSidecar(name, fields);
  }
}

function checkOpenAiSidecar(name, fields) {
  const sidecar = path.join(SKILLS_ROOT, name, "agents", "openai.yaml");
  assert(fs.existsSync(sidecar), `skills/${name}: agents/openai.yaml is required`);
  if (!fs.existsSync(sidecar)) return;
  const yaml = fs.readFileSync(sidecar, "utf8");
  assert(/display_name:\s*\S/.test(yaml), `skills/${name}: OpenAI display_name is required`);
  assert(/short_description:\s*\S/.test(yaml), `skills/${name}: OpenAI short_description is required`);
  const expected = name === "devils-advocate" ? "false" : "true";
  assert(yaml.includes(`allow_implicit_invocation: ${expected}`), `skills/${name}: implicit policy must be ${expected}`);
  if (name === "devils-advocate") {
    assert(fields["disable-model-invocation"] === "true", "devils-advocate must remain explicit-only in Claude");
  }
}

function findFiles(directory, basename, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) findFiles(candidate, basename, found);
    if (entry.isFile() && entry.name === basename) found.push(candidate);
  }
  return found;
}

function checkCanonicalSkillCopies(skillNames) {
  const actual = findFiles(ROOT, "SKILL.md").map((file) => path.relative(ROOT, file)).sort();
  const expected = skillNames.map((name) => `plugins/vdufloth/skills/${name}/SKILL.md`).sort();
  assert(JSON.stringify(actual) === JSON.stringify(expected), `SKILL.md files must exist only in the canonical tree; found: ${actual.join(", ")}`);
}

function checkReadmeCatalog(skillNames) {
  const readme = fs.readFileSync(README_PATH, "utf8");
  const catalog = readme.match(/<!-- skill-catalog:start -->([\s\S]*?)<!-- skill-catalog:end -->/);
  assert(Boolean(catalog), "README skill catalog markers are required");
  if (!catalog) return;
  const rows = [...catalog[1].matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((match) => match[1]).sort();
  assert(JSON.stringify(rows) === JSON.stringify(skillNames), `README skill catalog must name every shipped skill exactly once; found: ${rows.join(", ")}`);
}

function checkIdentity(portable, claudePlugin, claudeMarketplace, codexMarketplace) {
  const fields = ["name", "version", "description", "homepage", "repository"];
  for (const field of fields) {
    assert(claudePlugin[field] === portable[field], `Claude manifest ${field} must match portable manifest`);
  }
  assert(claudePlugin.author?.name === portable.author?.name, "Claude and portable author names must match");
  assert(portable.homepage === "https://github.com/vdufloth/agent-plugins", "portable homepage must use the agent-plugins repository");
  assert(portable.repository === "https://github.com/vdufloth/agent-plugins", "portable repository must use the agent-plugins repository");
  assert(claudeMarketplace.metadata?.version === portable.version, "Claude marketplace version must match portable manifest");
  assert(claudeMarketplace.name === "vdufloth-claude-plugins", "Claude marketplace identity must remain vdufloth-claude-plugins");
  assert(codexMarketplace.name === "vdufloth-agent-plugins", "Codex marketplace identity must be vdufloth-agent-plugins");
}

function checkMarketplaceEntry(entry, expectedName, expectedPath, label) {
  assert(entry?.name === expectedName, `${label} plugin name must be ${expectedName}`);
  assert(expectedPath.startsWith("./"), `${label} plugin path must begin with ./`);
  const resolved = path.resolve(ROOT, expectedPath);
  assert(resolved === PLUGIN_ROOT, `${label} plugin path must resolve to plugins/vdufloth`);
}

function checkMarketplaces(portable, claudeMarketplace, codexMarketplace) {
  const claudeEntry = claudeMarketplace.plugins?.find((entry) => entry.name === portable.name);
  const codexEntry = codexMarketplace.plugins?.find((entry) => entry.name === portable.name);
  checkMarketplaceEntry(claudeEntry, portable.name, claudeEntry?.source ?? "", "Claude marketplace");
  checkMarketplaceEntry(codexEntry, portable.name, codexEntry?.source?.path ?? "", "Codex marketplace");
  assert(claudeMarketplace.metadata?.pluginRoot === "./plugins", "Claude pluginRoot must remain ./plugins");
  assert(claudeEntry?.description === portable.description, "Claude marketplace description must match portable manifest");
  assert(codexMarketplace.plugins?.length === 1, "Codex marketplace must expose exactly one plugin in this release");
  assert(codexMarketplace.interface?.displayName === "vdufloth Agent Plugins", "Codex marketplace display name must remain stable");
  assert(codexEntry?.source?.source === "local", "Codex marketplace source type must be local");
  assert(codexEntry?.policy?.installation === "AVAILABLE", "Codex installation policy must be AVAILABLE");
  assert(codexEntry?.policy?.authentication === "ON_INSTALL", "Codex authentication policy must be ON_INSTALL");
  assert(codexEntry?.category === "Productivity", "Codex category must be Productivity");
}

function checkPackage() {
  const portable = readJson(PORTABLE_PATH);
  const claudePlugin = readJson(CLAUDE_PLUGIN_PATH);
  const claudeMarketplace = readJson(CLAUDE_MARKETPLACE_PATH);
  const codexMarketplace = readJson(CODEX_MARKETPLACE_PATH);
  const skillNames = immediateSkillNames();
  assert(portable.$schema === "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "portable manifest must target Agent Plugins 1.0.0");
  assert(!fs.existsSync(path.join(PLUGIN_ROOT, ".codex-plugin", "plugin.json")), "portable package must not add a redundant .codex-plugin manifest");
  assert(fs.readFileSync(path.join(ROOT, "CLAUDE.md"), "utf8") === "@AGENTS.md\n", "CLAUDE.md must be only the AGENTS.md import adapter");
  checkIdentity(portable, claudePlugin, claudeMarketplace, codexMarketplace);
  checkMarketplaces(portable, claudeMarketplace, codexMarketplace);
  checkSkills(skillNames);
  checkCanonicalSkillCopies(skillNames);
  checkReadmeCatalog(skillNames);
  return { portable, skillNames };
}

const mode = process.argv[2] ?? "--check";
if (!["--check", "--sync"].includes(mode) || process.argv.length > 3) {
  console.error("Usage: node scripts/check-package.mjs [--check|--sync]");
  process.exit(2);
}

if (mode === "--sync") syncDerivedVersions();
const result = checkPackage();
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

console.log(`Package checks passed (${result.skillNames.length} skills, version ${result.portable.version}).`);
