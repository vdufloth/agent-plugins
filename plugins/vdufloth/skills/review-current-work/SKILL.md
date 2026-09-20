---
name: review-current-work
description: Senior tech lead review of all new commits on the current branch. Audits architecture, code-pattern fit, security, performance, and missing unit-test coverage. Use when the user asks to review the current branch, review recent work, audit commits before opening a PR, or invokes /review-current-work.
---

Act as a senior tech lead reviewing every new commit on the current branch (commits not yet on the base branch). Produce an actionable review, not a summary.

## Scope

- Inspect every commit between the base branch and `HEAD`. Do not skip commits even if later ones overwrite earlier changes — patterns of churn are signal too.
- Detect the base branch from the repo: prefer `main`, fall back to `master`, then to the upstream tracking branch (`git rev-parse --abbrev-ref @{u}` minus the remote prefix). If still ambiguous, ask once.
- Read the project's `AGENTS.md`, `CLAUDE.md`, `README.md`, and any `CONTRIBUTING.md` before reviewing so "project's code pattern" is grounded, not guessed. A missing file is not an error; use whichever repository guidance the host and project provide.

## Gather context

Run these (read-only) before forming opinions:

```bash
git rev-parse --abbrev-ref HEAD
git merge-base --fork-point <base> HEAD || git merge-base <base> HEAD
git log --no-merges <base>..HEAD --stat
git diff <base>...HEAD
```

For each non-trivial file touched, also read the surrounding module so suggestions match existing idioms.

## Review dimensions

For each finding, output: **file:line — problem — suggested fix**. One finding per line where possible. Group by dimension.

1. **Architecture** — boundary violations, leaked abstractions, missing seams, god modules, duplicated responsibility, coupling that will hurt later. Call out structural issues even if the code "works".
2. **Project pattern fit** — naming, layering, error-handling style, logging conventions, dependency-injection style, test layout. Compare against neighboring files, not generic best practice.
3. **Security** — input validation at boundaries, authn/authz checks, secret handling, SSRF/SQLi/XSS/path-traversal/command-injection surfaces, unsafe deserialization, dependency risk introduced by this branch.
4. **Performance** — N+1 queries, accidental quadratic loops, missing indexes implied by new queries, sync I/O on hot paths, unnecessary allocations in tight loops, missing pagination/streaming for unbounded inputs.
5. **Missing unit tests** — for each new/changed function or branch added by these commits, name the test that should exist and does not. Cover happy path, error path, and at least one edge case per function. Skip tests that already exist.

## Output shape

Lead with a 2–4 line verdict (`ship`, `ship with fixes`, or `block`) and the top three risks. Then sections for each dimension above. Then a checklist of recommended tests, each one line: `path/to/file::function — case to cover`.

Skip dimensions with no findings rather than padding with "looks good".

## Rules

- Cite line numbers from the diff or current `HEAD` files, not from memory.
- Do not propose unrelated refactors. Stay inside the diff's blast radius unless a change in the diff forces a fix outside it.
- If a finding is uncertain, mark it `?` and say what would resolve the uncertainty.
- Do not modify files. This skill reviews; it does not fix. If the user wants fixes applied, they will ask in a follow-up.
- Do not run tests or builds — review is static. Mention if running them would resolve an uncertainty.
