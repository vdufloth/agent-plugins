#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER="${SCRIPT_DIR}/install-code-style.sh"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

fail() {
  printf 'test failure: %s\n' "$*" >&2
  exit 1
}

assert_contains() {
  local needle="$1"
  local file="$2"
  grep -qF "$needle" "$file" || fail "${file} does not contain ${needle}"
}

assert_count() {
  local expected="$1"
  local needle="$2"
  local file="$3"
  local actual
  actual="$(grep -cF "$needle" "$file" || true)"
  [[ "$actual" == "$expected" ]] || fail "expected ${expected} occurrences of ${needle} in ${file}, found ${actual}"
}

target="${TEST_ROOT}/explicit/instructions.md"
mkdir -p "$(dirname "$target")"
printf 'content before\n' > "$target"

bash "$INSTALLER" --target "$target" >/dev/null
assert_contains "content before" "$target"
assert_count 1 "<!-- vdufloth/code-style: BEGIN -->" "$target"
compgen -G "${target}.backup.*" >/dev/null || fail "first install did not create a backup"

printf 'content after\n' >> "$target"
bash "$INSTALLER" --target "$target" >/dev/null
assert_contains "content before" "$target"
assert_contains "content after" "$target"
assert_count 1 "<!-- vdufloth/code-style: BEGIN -->" "$target"

printed="${TEST_ROOT}/printed.md"
bash "$INSTALLER" --print > "$printed"
assert_count 1 "<!-- vdufloth/code-style: BEGIN -->" "$printed"
assert_contains "## Code" "$printed"

bash "$INSTALLER" --target "$target" --remove >/dev/null
assert_count 0 "<!-- vdufloth/code-style: BEGIN -->" "$target"
assert_contains "content before" "$target"
assert_contains "content after" "$target"

preset_home="${TEST_ROOT}/home"
HOME="$preset_home" bash "$INSTALLER" --agent claude-code >/dev/null
[[ -f "${preset_home}/.claude/CLAUDE.md" ]] || fail "Claude preset did not create CLAUDE.md"
HOME="$preset_home" bash "$INSTALLER" --agent codex >/dev/null
[[ -f "${preset_home}/.codex/AGENTS.md" ]] || fail "Codex preset did not create AGENTS.md"

remote_root="${TEST_ROOT}/remote"
mkdir -p "${remote_root}/scripts"
cp "$INSTALLER" "${remote_root}/scripts/install-code-style.sh"
empty_input="${TEST_ROOT}/empty-skill.md"
malformed_input="${TEST_ROOT}/malformed-skill.md"
valid_remote_target="${TEST_ROOT}/valid-remote-target.md"
: > "$empty_input"
printf '%s\n' 'name: code-style' 'missing frontmatter delimiters' > "$malformed_input"

VDUFLOTH_CODE_STYLE_URL="file://${SCRIPT_DIR}/../plugins/vdufloth/skills/code-style/SKILL.md" \
  bash "${remote_root}/scripts/install-code-style.sh" --target "$valid_remote_target" >/dev/null
assert_count 1 "<!-- vdufloth/code-style: BEGIN -->" "$valid_remote_target"

if VDUFLOTH_CODE_STYLE_URL="file://${empty_input}" bash "${remote_root}/scripts/install-code-style.sh" --target "${TEST_ROOT}/empty-target.md" >/dev/null 2>&1; then
  fail "empty remote skill input was accepted"
fi
if VDUFLOTH_CODE_STYLE_URL="file://${malformed_input}" bash "${remote_root}/scripts/install-code-style.sh" --target "${TEST_ROOT}/malformed-target.md" >/dev/null 2>&1; then
  fail "malformed remote skill input was accepted"
fi
[[ ! -e "${TEST_ROOT}/empty-target.md" ]] || fail "empty input modified its target"
[[ ! -e "${TEST_ROOT}/malformed-target.md" ]] || fail "malformed input modified its target"

printf 'Installer tests passed.\n'
