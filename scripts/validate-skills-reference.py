#!/usr/bin/env python3
"""Run the pinned Agent Skills validator with a narrow Claude extension allowlist."""

from pathlib import Path
import re
import sys

from skills_ref import validate


ROOT = Path(__file__).resolve().parents[1]
SKILLS_ROOT = ROOT / "plugins" / "vdufloth" / "skills"
CLAUDE_EXTENSIONS = {"argument-hint", "disable-model-invocation"}


def unexpected_fields(problem: str) -> set[str] | None:
    match = re.match(r"Unexpected fields in frontmatter: (.*?)\. Only", problem)
    if not match:
        return None
    return {field.strip() for field in match.group(1).split(",")}


def is_allowed_extension(skill_name: str, problem: str) -> bool:
    fields = unexpected_fields(problem)
    return skill_name == "devils-advocate" and fields == CLAUDE_EXTENSIONS


def validate_skill(skill_dir: Path) -> list[str]:
    problems = [str(problem) for problem in validate(skill_dir)]
    blocked = [problem for problem in problems if not is_allowed_extension(skill_dir.name, problem)]
    if len(problems) != len(blocked):
        print(f"Allowed documented Claude frontmatter extensions: {skill_dir}")
    return blocked


def main() -> int:
    failed = False
    for skill_dir in sorted(path for path in SKILLS_ROOT.iterdir() if path.is_dir()):
        problems = validate_skill(skill_dir)
        if not problems:
            print(f"Valid skill: {skill_dir.relative_to(ROOT)}")
            continue
        failed = True
        for problem in problems:
            print(f"error: {skill_dir.relative_to(ROOT)}: {problem}", file=sys.stderr)
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
