# vdufloth agent plugins

Personal software-engineering skills packaged once for Claude Code, Codex, and
other Agent Skills-compatible clients.

Managed plugins are the easiest route: the host installs and updates the whole
bundle. The `skills` CLI is an alternative for people who want editable skill
copies in an agent's native skills directory.

> [!IMPORTANT]
> Choose one installation route for each host. Installing both the managed
> plugin and editable copies exposes duplicate skills with the same names.

## Install

<!-- install-routes:start -->

| Route | Install | Update | Best for |
| --- | --- | --- | --- |
| Claude Code plugin | `/plugin marketplace add vdufloth/agent-plugins`<br>`/plugin install vdufloth@vdufloth-claude-plugins` | `/plugin marketplace update vdufloth-claude-plugins`<br>`/plugin update vdufloth@vdufloth-claude-plugins` | Native managed Claude installation |
| Codex plugin | `codex plugin marketplace add vdufloth/agent-plugins`<br>`codex plugin add vdufloth@vdufloth-agent-plugins` | `codex plugin marketplace upgrade vdufloth-agent-plugins`<br>`codex plugin add vdufloth@vdufloth-agent-plugins` | Native managed Codex installation |
| Editable skills | `npx skills@latest add vdufloth/agent-plugins` | `npx skills@latest update` | Codex, Claude Code, Cursor, and other supported agents |

<!-- install-routes:end -->

The repository is public, and these skills do not require authentication.
The editable route prompts for the target agent and skills unless you pass the
corresponding `skills` CLI flags.

The repository moved from `vdufloth/claude-plugins` to
`vdufloth/agent-plugins`. GitHub redirects existing checkouts and marketplace
sources. The Claude marketplace ID remains `vdufloth-claude-plugins` so
existing installations continue to update.

See [compatibility](docs/compatibility.md) for tested versions, capabilities,
and limitations.

## Skills

<!-- skill-catalog:start -->

| Skill | Invocation | Description |
| --- | --- | --- |
| `code-style` | Implicit or explicit | Applies language-agnostic conventions for code size, naming, types, dependencies, tests, formatting, and logging. |
| `devils-advocate` | Explicit only in Claude and Codex | Iteratively stress-tests and hardens a plan or design document, with a serial fallback when isolated reviewers are unavailable. |
| `humanizer` | Implicit or explicit | Rewrites AI-sounding prose in the writer's voice without changing its facts or meaning. |
| `review-current-work` | Implicit or explicit | Reviews all branch commits for architecture, project-pattern fit, security, performance, and missing tests. |

<!-- skill-catalog:end -->

### Invocation examples

Claude Code:

```text
/vdufloth:devils-advocate docs/my-plan.md --quick
/vdufloth:humanizer
/vdufloth:review-current-work
```

Codex CLI or IDE extension:

```text
$devils-advocate docs/my-plan.md --quick
$humanizer
$review-current-work
```

`code-style`, `humanizer`, and `review-current-work` may also activate
automatically when a request matches their descriptions. `devils-advocate` is
explicitly disabled for implicit invocation in both Claude and Codex.

## Always-on code style (optional)

Installing the skill through a plugin is normally sufficient. The bootstrap
script is only for users who want the code-style rules loaded in every session
instead of invoked as a skill.

No arguments preserve the original Claude target:

```bash
bash scripts/install-code-style.sh
```

Choose Claude or Codex explicitly:

```bash
bash scripts/install-code-style.sh --agent claude-code
bash scripts/install-code-style.sh --agent codex
```

Use an explicit instruction file for another agent, preview the managed block,
or remove it:

```bash
bash scripts/install-code-style.sh --target /path/to/instructions.md
bash scripts/install-code-style.sh --print
bash scripts/install-code-style.sh --agent codex --remove
```

For remote installation, pass script arguments after `bash -s --`:

```bash
curl -fsSL https://raw.githubusercontent.com/vdufloth/agent-plugins/main/scripts/install-code-style.sh | bash -s -- --agent codex
```

The script owns only its marker-delimited block. It makes a timestamped backup
before changing an existing file, preserves other content, and replaces its
block on re-run without duplication.

## Repository structure

```text
.
├── AGENTS.md                         # canonical contributor guidance
├── CLAUDE.md                         # thin Claude import adapter
├── .agents/plugins/marketplace.json  # Codex marketplace
├── .claude-plugin/marketplace.json   # Claude marketplace
├── docs/
│   ├── compatibility.md
│   └── adr/
├── plugins/vdufloth/
│   ├── plugin.json                   # portable identity and version
│   ├── .claude-plugin/plugin.json    # Claude compatibility manifest
│   └── skills/                       # one canonical skill tree
└── scripts/
    ├── assert-discovery.mjs
    ├── check-package.mjs
    ├── check-release.mjs
    ├── install-code-style.sh
    ├── test-install-code-style.sh
    └── validate-skills-reference.py
```

No skill is copied into a host-specific directory inside this repository.

## Contributing and releasing

To add a skill, create
`plugins/vdufloth/skills/<skill-name>/SKILL.md`, add its OpenAI metadata at
`agents/openai.yaml`, and add one row to the skill catalog above. Keep the
directory and frontmatter names identical.

The portable manifest is the version source of truth. Bump
`plugins/vdufloth/plugin.json`, then synchronize the two Claude-derived fields:

```bash
node scripts/check-package.mjs --sync
```

Validate before release:

```bash
node scripts/check-package.mjs --check
bash scripts/test-install-code-style.sh
claude plugin validate . --strict
claude plugin validate plugins/vdufloth --strict
npx skills@1.7.0 add . --list
```

Update this README, [compatibility documentation](docs/compatibility.md), and
[changelog](CHANGELOG.md) whenever behavior or installation changes. The full
maintainer rules are in [AGENTS.md](AGENTS.md).

The distribution choices and staged repository rename are documented in
[ADR 0001](docs/adr/0001-portable-plugin-with-host-adapters.md) and
[ADR 0002](docs/adr/0002-stage-the-repository-rename.md).

## License

MIT — see [LICENSE](LICENSE).
