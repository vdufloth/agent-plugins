# ADR 0002: Stage the repository rename

- Status: Accepted
- Date: 2026-09-20

## Context

The repository and its existing Claude marketplace use Claude-specific names,
while the package now supports multiple agents. Renaming both during the
compatibility migration would mix packaging risk with redirect and upgrade
risk.

## Decision

Keep the GitHub slug `vdufloth/claude-plugins` and the Claude marketplace name
`vdufloth-claude-plugins` for the 0.4.0 release. Titles and descriptions may be
agent-neutral.

## Reason

Existing Claude installations must remain updateable, and the new portable and
Codex paths should be testable independently from a repository migration.

## Follow-up criteria

A later rename requires all of the following:

- Verify the GitHub redirect for clone, archive, and raw-file URLs.
- Test fresh marketplace additions and clean plugin installs under the new
  slug.
- Test an old Claude installation updating through the redirect.
- Update and verify every documentation and manifest link.
- Prepare and test a rollback plan before changing the public slug.
