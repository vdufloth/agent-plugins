---
name: code-style
description: Apply personal coding conventions (function/file size limits, naming, explicit types, dependency injection, tests, structure, formatting, logging) when writing new code, editing or refactoring existing code, reviewing diffs, or implementing a feature or bug fix in any project and any language.
---

Apply these conventions when producing or modifying code in this project. They are language-agnostic; map each rule onto the idioms of the language you are working in.

## Code

- Functions: 4–20 lines. Split if longer.
- Files: under 500 lines. Split by responsibility.
- One thing per function. One responsibility per module (SRP).
- Names are specific and unique. Avoid `data`, `handler`, `Manager`. Prefer names that return fewer than 5 grep hits in the codebase.
- Types are explicit. No `any`, no untyped dicts/maps, no untyped functions.
- No code duplication. Extract shared logic into a function or module.
- Early returns over nested ifs. Max 2 levels of indentation.
- Exception messages include the offending value AND the expected shape.

## Comments

- Keep existing comments. Don't strip them on refactor — they carry intent and provenance.
- Write WHY, not WHAT. Skip `// increment counter` above `i++`.
- Docstrings on public functions: intent + one usage example.
- Reference issue numbers or commit SHAs when a line exists because of a specific bug or upstream constraint.

## Tests

- Run tests with the project's canonical test command. Detect it from `package.json` (`scripts.test`), `Makefile`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `README.md`, or CI config. If ambiguous, ask once before running.
- Every new function gets a test. Every bug fix gets a regression test.
- Mock external I/O (API, DB, filesystem) with named fake classes, not inline stubs.
- Tests are F.I.R.S.T: Fast, Independent, Repeatable, Self-validating, Timely.

## Dependencies

- Inject dependencies through constructor or function parameter, not via globals or import-time side effects.
- Wrap third-party libs behind a thin interface owned by this project.

## Structure

- Follow the framework's convention (Rails, Django, Next.js, etc.).
- Prefer small focused modules over god files.
- Use predictable paths: controller/model/view, src/lib/test, etc.

## Formatting

- Use the language's default formatter: `cargo fmt`, `gofmt`, `prettier`, `black`, `rubocop -A`, `ruff format`. Don't discuss style beyond that.

## Logging

- Structured JSON for debugging and observability logs.
- Plain text only for user-facing CLI output.

## When applying these rules

- Detect the project's language, framework, and tooling first (read `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, etc.) so you can map "default formatter" and "test command" to concrete commands.
- If existing code in the project violates a rule, fix it within the scope of the change you're making — do not perform unrelated cleanups.
- If a rule directly conflicts with a project-specific convention documented in `AGENTS.md`, `CLAUDE.md`, `README.md`, or `CONTRIBUTING.md`, the project document wins. Flag the conflict to the user.
