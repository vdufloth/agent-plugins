#!/usr/bin/env bash
# Install the vdufloth code-style guidance as an always-on instruction block.
# With no arguments, the historical Claude Code target is used.

set -euo pipefail

RULES_URL="${VDUFLOTH_CODE_STYLE_URL:-https://raw.githubusercontent.com/vdufloth/agent-plugins/main/plugins/vdufloth/skills/code-style/SKILL.md}"
BEGIN_MARKER="<!-- vdufloth/code-style: BEGIN -->"
END_MARKER="<!-- vdufloth/code-style: END -->"
AGENT="claude-code"
TARGET=""
AGENT_WAS_SET=false
PRINT_ONLY=false
REMOVE=false

usage() {
  cat <<'EOF'
Usage: install-code-style.sh [options]

Options:
  --agent claude-code|codex  Choose a documented user instruction file.
  --target PATH              Use an explicit instruction file for another host.
  --print                    Print the managed block without writing a file.
  --remove                   Remove only the managed block from the target.
  -h, --help                 Show this help.

No arguments target ~/.claude/CLAUDE.md for backward compatibility.
EOF
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_value() {
  local option="$1"
  local value="${2:-}"
  [[ -n "$value" && "$value" != --* ]] || die "${option} requires a value"
}

while (($#)); do
  case "$1" in
    --agent)
      require_value "$1" "${2:-}"
      AGENT="$2"
      AGENT_WAS_SET=true
      shift 2
      ;;
    --target)
      require_value "$1" "${2:-}"
      TARGET="$2"
      shift 2
      ;;
    --print)
      PRINT_ONLY=true
      shift
      ;;
    --remove)
      REMOVE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1 (run with --help for usage)"
      ;;
  esac
done

[[ "$PRINT_ONLY" == false || "$REMOVE" == false ]] || die "--print and --remove cannot be combined"
[[ -z "$TARGET" || "$AGENT_WAS_SET" == false ]] || die "--agent and --target cannot be combined"

resolve_target() {
  if [[ -n "$TARGET" ]]; then
    printf '%s\n' "$TARGET"
    return
  fi

  [[ -n "${HOME:-}" ]] || die "HOME is unset; pass --target with an explicit instruction file"
  case "$AGENT" in
    claude-code) printf '%s/.claude/CLAUDE.md\n' "$HOME" ;;
    codex) printf '%s/.codex/AGENTS.md\n' "$HOME" ;;
    *) die "unsupported agent '${AGENT}'; expected claude-code or codex, or use --target" ;;
  esac
}

TARGET="$(resolve_target)"

marker_count() {
  local marker="$1"
  local file="$2"
  grep -cF "$marker" "$file" || true
}

validate_markers() {
  local file="$1"
  local begins ends
  begins="$(marker_count "$BEGIN_MARKER" "$file")"
  ends="$(marker_count "$END_MARKER" "$file")"
  [[ "$begins" == "$ends" ]] || die "target '${file}' has an unmatched managed marker"
  [[ "$begins" -le 1 ]] || die "target '${file}' has duplicate managed blocks; resolve them manually"
}

backup_existing() {
  local file="$1"
  local stamp backup
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup="${file}.backup.${stamp}"
  [[ ! -e "$backup" ]] || backup="${backup}.$$"
  cp -p "$file" "$backup"
  printf 'Backup: %s\n' "$backup"
}

write_without_block() {
  local source="$1"
  local destination="$2"
  awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
    $0 == begin { inside = 1; next }
    $0 == end { inside = 0; next }
    !inside { print }
  ' "$source" > "$destination"
}

remove_managed_block() {
  if [[ ! -e "$TARGET" ]]; then
    printf 'No managed block found; target does not exist: %s\n' "$TARGET"
    return
  fi
  validate_markers "$TARGET"
  if [[ "$(marker_count "$BEGIN_MARKER" "$TARGET")" == 0 ]]; then
    printf 'No managed block found in %s\n' "$TARGET"
    return
  fi
  backup_existing "$TARGET"
  local temporary
  temporary="$(mktemp "${TARGET}.tmp.XXXXXX")"
  write_without_block "$TARGET" "$temporary"
  chmod --reference="$TARGET" "$temporary" 2>/dev/null || true
  mv "$temporary" "$TARGET"
  printf 'Removed vdufloth/code-style block from %s\n' "$TARGET"
}

if [[ "$REMOVE" == true ]]; then
  remove_managed_block
  exit 0
fi

load_rules() {
  local script_dir local_rules source_label raw
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
  local_rules="${script_dir}/../plugins/vdufloth/skills/code-style/SKILL.md"
  if [[ -f "$local_rules" ]]; then
    source_label="$local_rules"
    raw="$(<"$local_rules")"
  else
    source_label="$RULES_URL"
    raw="$(curl -fsSL "$RULES_URL")" || die "could not load code-style input from '${RULES_URL}' for target '${TARGET}'"
  fi
  [[ -n "$raw" ]] || die "code-style input from '${source_label}' is empty for target '${TARGET}'"
  printf '%s\n' "$raw"
}

strip_frontmatter() {
  awk '
    BEGIN { delimiters = 0 }
    NR == 1 && $0 != "---" { exit 2 }
    delimiters == 0 && $0 == "---" { delimiters = 1; next }
    delimiters == 1 && $0 == "---" { delimiters = 2; next }
    delimiters >= 2 { print }
    END { if (delimiters < 2) exit 3 }
  '
}

RAW_RULES="$(load_rules)"
printf '%s\n' "$RAW_RULES" | awk '
  NR == 1 && $0 == "---" { in_frontmatter = 1; next }
  in_frontmatter && $0 == "---" { exit found_name ? 0 : 1 }
  in_frontmatter && $0 ~ /^name:[[:space:]]*code-style[[:space:]]*$/ { found_name = 1 }
  END { if (!found_name) exit 1 }
' || die "code-style input has the wrong or missing skill name for target '${TARGET}'"
RULES_BODY="$(printf '%s\n' "$RAW_RULES" | strip_frontmatter)" || die "code-style input is malformed; expected YAML frontmatter before instructions for target '${TARGET}'"
[[ -n "$RULES_BODY" ]] || die "code-style input has an empty instruction body for target '${TARGET}'"

render_block() {
  printf '%s\n' "$BEGIN_MARKER"
  printf '%s\n' "$RULES_BODY"
  printf '%s\n' "$END_MARKER"
}

if [[ "$PRINT_ONLY" == true ]]; then
  render_block
  exit 0
fi

mkdir -p "$(dirname "$TARGET")"
if [[ -e "$TARGET" ]]; then
  validate_markers "$TARGET"
  backup_existing "$TARGET"
fi

temporary="$(mktemp "${TARGET}.tmp.XXXXXX")"
replacement=""
cleanup() {
  rm -f "$temporary"
  [[ -z "$replacement" ]] || rm -f "$replacement"
}
trap cleanup EXIT

if [[ -e "$TARGET" && "$(marker_count "$BEGIN_MARKER" "$TARGET")" == 1 ]]; then
  replacement="$(mktemp "${TARGET}.block.XXXXXX")"
  render_block > "$replacement"
  awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" -v replacement="$replacement" '
    function print_replacement(line) {
      while ((getline line < replacement) > 0) print line
      close(replacement)
    }
    $0 == begin { print_replacement(); inside = 1; next }
    $0 == end { inside = 0; next }
    !inside { print }
  ' "$TARGET" > "$temporary"
  rm -f "$replacement"
  replacement=""
else
  [[ ! -e "$TARGET" ]] || cp "$TARGET" "$temporary"
  if [[ -s "$temporary" && "$(tail -c 1 "$temporary" | wc -l)" == 0 ]]; then
    printf '\n' >> "$temporary"
  fi
  render_block >> "$temporary"
fi

[[ ! -e "$TARGET" ]] || chmod --reference="$TARGET" "$temporary" 2>/dev/null || true
mv "$temporary" "$TARGET"
trap - EXIT
printf 'Installed vdufloth/code-style block into %s\n' "$TARGET"
printf 'Re-run this script to refresh it, or pass --remove to delete the managed block.\n'
