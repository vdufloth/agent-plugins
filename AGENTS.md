# Contributor guidance

## Purpose

This repository distributes reusable software-engineering skills through four
routes: the portable Agent Plugins package, the Claude Code marketplace, the
Codex marketplace, and editable copies installed with the `skills` CLI.

The repository remains a multi-plugin catalog. The current package lives at
`plugins/vdufloth`; do not flatten it into the repository root or rename the
GitHub repository as part of routine changes.

## Layout

- `plugins/vdufloth/plugin.json` is the canonical plugin identity and version.
- `plugins/vdufloth/skills/` contains the canonical skill sources.
- `plugins/vdufloth/.claude-plugin/plugin.json` is the Claude compatibility
  manifest.
- `.claude-plugin/marketplace.json` preserves the existing Claude marketplace.
- `.agents/plugins/marketplace.json` is the Codex marketplace adapter.
- `plugins/vdufloth/skills/*/agents/openai.yaml` contains OpenAI-only display
  metadata and invocation policy.
- `docs/compatibility.md` records host support and known limitations.
- `docs/adr/` records distribution decisions.

## Canonical-copy invariant

Every skill has exactly one `SKILL.md`, directly beneath
`plugins/vdufloth/skills/<skill-name>/`. Never duplicate or generate skill
copies under `.claude/skills`, `.codex/skills`, or `.agents/skills` in this
repository. Host-specific behavior belongs in a supported sidecar or in
clearly identified compatibility frontmatter, not in a forked instruction
body.

## Changing skills

When adding or changing a skill:

1. Keep the directory name and the `name` frontmatter identical and compliant
   with the Agent Skills specification.
2. Make the description portable, concise, and explicit about when the skill
   applies.
3. Refer to capabilities instead of host-specific tool names unless behavior
   is intentionally host-specific.
4. Add or update `agents/openai.yaml`; use
   `policy.allow_implicit_invocation: false` for explicit-only skills.
5. Add the skill to the README catalog exactly once and update compatibility
   documentation when host behavior changes.
6. Update `CHANGELOG.md` for user-visible behavior.

## Versions and releases

`plugins/vdufloth/plugin.json` is the version source of truth. The Claude
plugin version and Claude marketplace metadata version must match it. After
changing the canonical version, run:

```bash
node scripts/check-package.mjs --sync
```

The sync command changes only the two derived Claude version fields. Use a
minor release for a new skill or a material compatibility change and a patch
release for compatible fixes. Keep the repository slug
`vdufloth/agent-plugins`. Treat the Claude marketplace name
`vdufloth-claude-plugins` as a stable compatibility identifier; do not rename
it as part of routine branding changes. ADR 0003 records the repository rename.

## Validation

Run the checks that are available locally before handing off a change:

```bash
node scripts/check-package.mjs --check
bash scripts/test-install-code-style.sh
python scripts/validate-skills-reference.py  # after installing skills-ref==0.1.1
claude plugin validate . --strict
claude plugin validate plugins/vdufloth --strict
npx skills@1.7.0 add . --list
```

CI also validates the portable manifest against Agent Plugins 1.0, validates
skills with the pinned Agent Skills reference validator, and performs Codex,
Claude, and `skills` discovery in disposable profiles. It compares skill
changes with the base revision and requires the documented version and
changelog updates. Do not run install smoke tests against a developer's real
Claude or Codex profile.

When behavior, installation, or discovery changes, update `README.md`,
`docs/compatibility.md`, and `CHANGELOG.md` in the same change.
