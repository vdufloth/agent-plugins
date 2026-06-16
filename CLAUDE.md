# claude-plugins

Personal Claude Code plugin marketplace.

## Releasing plugin changes

When adding/changing a skill or plugin content, bump **both** versions or the
update won't propagate to consumers:

1. `plugins/<plugin>/.claude-plugin/plugin.json` → `version` (the plugin itself).
2. `.claude-plugin/marketplace.json` → `metadata.version` (the catalog).

Claude Code reads `marketplace.json` to decide whether the catalog changed. If
only the plugin version is bumped and `metadata.version` stays the same, the
marketplace refresh is cached/skipped and the new content never gets pulled.

Keep the two versions in sync. Then commit and push to `origin/main`.
