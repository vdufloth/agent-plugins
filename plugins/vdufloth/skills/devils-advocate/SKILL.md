---
name: devils-advocate
description: Iteratively harden a design doc or implementation plan through multiple rounds of devil's advocate critique. Use when the user wants to stress-test a plan, RFC, or design doc before implementation, points to a .md plan file, or asks to "harden", "challenge", or "find holes" in a plan.
argument-hint: "[path-to-plan.md] [--quick]"
disable-model-invocation: true
---

Iteratively review and harden a design doc or implementation plan through multiple rounds of devil's advocate critique until the plan is implementation-ready.

## Input

Interpret any path and flags supplied with the explicit invocation as the input.
The input may be a file path to the design doc or plan to review, optionally
followed by `--quick` (or `-q`) for a single-pass review. Hosts expose explicit
invocation arguments differently, so do not assume a particular placeholder or
environment variable exists.

If no path is provided, auto-discover the plan by searching the current working directory for the most recently modified file matching these patterns (in order):
1. `plan-*.md`
2. `*-plan.md`
3. `*-design*.md`
4. `*-fix*.md`
5. `*implementation*.md`
6. Any `.md` file modified in the last hour (excluding `CLAUDE.md`, `README.md`, `MEMORY.md`, `AGENTS.md`)

Use the host's available filesystem search capability to find candidates, then
pick the most recently modified match. Exclude `CLAUDE.md`, `README.md`,
`MEMORY.md`, and `AGENTS.md` from the final fallback.

If you find a candidate, tell the user which file you're reviewing before starting.

**Quick mode** (`--quick` or `-q` in arguments): run a single pass through Step 1, apply auto-resolutions, present any human decisions, then stop. Skip the loop and the finalize/cleanup pass. Use this when the plan is already mature and the user wants a sanity check rather than a hardening cycle.

## Process Overview

You are an **autonomous plan hardener**. You run a loop of: review → classify findings → resolve what you can → ask the human about what you can't → update the plan → review again. You stop when the plan is clean or when diminishing returns set in.

The goal is a plan that is:
- **Accurate**: All claims about code are verified against the actual codebase
- **Complete**: No missing steps, edge cases, or gaps in test coverage
- **Decisive**: No hedging, no "consider", no unresolved options — every decision is made
- **Implementable**: An engineer could follow the plan without ambiguity

## Loop Execution

### Step 1: Run the Devil's Advocate Review

Choose the strongest isolation available for every round:

- If the host supports isolated subagent or background-agent execution, use a
  fresh isolated reviewer. Pass it only the current plan and the source files
  it should read; do not expose previous-round findings.
- If isolated execution is unavailable, perform a clearly separated serial
  review pass. Do not consult the previous review log until the new findings
  have been independently classified. Tell the user that the review used
  reduced isolation.

This independence reduces confirmation bias and lets each round assess the
current plan on its own merits.

**Tone calibration for the agent.** Critique must be specific and actionable. "This might fail" is useless; "Step 3 assumes Kafka can sustain 10x current throughput with no benchmark cited" is useful. The agent should not attack the author, hedge with disclaimers ("just my opinion, but…"), strawman the plan, or list cosmetic issues (typos, formatting) when substance is what matters. If the agent cannot point to a specific section or line of the plan, it should not raise the critique.

The agent MUST:

1. **Read the full design doc/plan** and all source files it references.

2. **Validate the root cause analysis** (if applicable):
   - Trace the actual code paths cited in the doc. Are the claims about what the code does accurate?
   - Are there alternative explanations the doc didn't consider?
   - Is there evidence that contradicts the stated root cause?

3. **Challenge assumptions**:
   - What assumptions does the plan make that aren't proven?
   - Are there edge cases or failure modes not accounted for?
   - Does the plan conflate correlation with causation?
   - **Steel-man the strongest critic.** For at least one load-bearing assumption, construct the strongest possible argument that it's wrong — in the voice of the most skeptical engineer on the team. Not a contrarian for its own sake; the version of the critique that, if true, would reshape the plan. State that argument plainly so the human can decide whether the plan survives it.

4. **Stress-test the proposed fix/implementation**:
   - Walk through the proposed changes line by line. Do they actually address the goal?
   - Could the changes introduce new bugs or regressions?
   - Are there other code paths with the same vulnerability that the fix doesn't cover?
   - Is the fix at the right layer, or should it be higher/lower in the stack?

5. **Identify gaps**:
   - What's missing from the plan? (testing, monitoring, rollback strategy, deployment ordering, etc.)
   - Are there related issues the plan should address but doesn't?
   - Does the plan have sufficient observability to validate it works?

6. **Propose refinements**:
   - Suggest specific improvements to the plan with code references.
   - Identify alternative approaches the plan didn't consider.
   - Flag anything that should be investigated before implementation.

7. **Return structured output** with:
   - Specific file paths and line numbers for all claims
   - A severity rating for each finding: **critical** / **important** / **minor**
   - Concrete suggestions, not just complaints
   - An **assumptions inventory**: list every assumption the plan makes, and mark each as **load-bearing** (the plan breaks or changes shape if this assumption is wrong) or **supporting** (an incorrect assumption would require revision but not a fundamental rethink). For each load-bearing assumption, state what evidence or verification would confirm it.
   - A summary verdict: **approve as-is** / **approve with changes** / **needs rework**

### Step 2: Classify Findings

When the review pass returns, read every finding and classify each into one of three categories:

| Category | Criteria | Action |
|----------|----------|--------|
| **Auto-resolve** | Factual corrections, missing details, code snippet fixes, test plan gaps, structural improvements, documentation clarity. You have enough information to make the right call without human input. | Apply the fix to the plan immediately. |
| **Human decision** | Trade-offs with no clear winner, scope decisions, architectural choices that affect other teams, anything where reasonable engineers would disagree, risk tolerance questions. | Collect these to present to the user. |
| **Dismiss** | Findings that are incorrect (the reviewer misread the code), already addressed, or too speculative to act on. | Note the dismissal reason briefly. |

### Step 3: Apply Auto-Resolutions

For each **auto-resolve** finding:
1. Read the relevant source files to verify the finding is accurate
2. Update the plan document with the correction or improvement
3. Keep a running log of what you changed and why

### Step 4: Present Human Decisions (if any)

If there are **human decision** findings, present them to the user ONE AT A TIME:

```
**Decision N of M: [Topic]**

The review found: [concise description of the issue]

Options:
- **A**: [option and its implications]
- **B**: [option and its implications]

**My recommendation**: [choice] because [rationale].

What would you prefer?
```

Wait for the user's answer before presenting the next decision. After all decisions are answered, apply them to the plan.

### Step 5: Decide Whether to Loop

After applying all changes, evaluate:

- **Loop again** if: You made substantive changes (not just typo fixes) that could have introduced new inconsistencies, or if the previous review had critical/important findings that required significant plan restructuring.
- **Stop** if: The review verdict was "approve as-is", or all findings were minor, or you've already completed 4 rounds (diminishing returns).

If looping, go back to Step 1. Tell the user which round you're starting (for
example, "Starting round 2 review..."). Use a fresh isolated reviewer when the
host provides one; otherwise preserve the serial-review separation described
in Step 1.

### Step 6: Finalize the Plan

When the loop ends, do a final pass on the plan to ensure it is **maximally consumable**:

1. **Structure check**: The plan should have clear sections. Ensure it has at minimum:
   - Problem statement / context
   - Root cause or goal (what and why)
   - Implementation steps (numbered, with file paths)
   - Key decisions made (table format if multiple decisions were resolved)
   - Test plan
   - Deployment / rollback considerations (if applicable)

2. **Remove noise**: Delete any sections that are no longer relevant after hardening (superseded options, resolved open questions, review artifacts). The plan should read as a clean spec, not a review history.

3. **Verify completeness**: Every implementation step should reference specific files. Every claim about code behavior should be verified. No "TODO" or "TBD" items should remain unless explicitly flagged as pre-implementation investigation tasks.

4. **Human-readable cleanup pass**: After rounds of hardening, plans accumulate redundancy, scattered decisions, and review-driven tangents. Rewrite the plan so a human reader can absorb it top-to-bottom without backtracking. Preserve all load-bearing implementation details — do NOT trade correctness for brevity.

   Apply these transforms:
   - **Flatten the opening**: Problem → Goal → Decisions table → User flow (or equivalent) in the first ~40 lines. A reader should understand *what* and *why* before any *how*.
   - **Consolidate per-variant differences**: if the plan covers multiple pages/services/entities with the same pattern, extract a reference table at the end instead of repeating details per-variant in body prose.
   - **Group by deliverable, not by concern**: e.g., "Backend changes" and "Frontend changes" as top-level sections, each with its own file list. Avoid interleaving "backend type X + frontend uses X + backend type Y + frontend uses Y".
   - **Keep code snippets where they're load-bearing** (DOM preservation constraints, async-vs-sync handler shapes, non-obvious sync effects) and **trim them where they're boilerplate** (obvious imports, standard state hooks).
   - **Collapse edge cases, test plan, rollout into tight lists** rather than multi-paragraph prose.
   - **Delete round-1 framing artifacts**: "Key finding from investigation", numbered "Findings addressed", Options/Alternatives that were already resolved. The plan should read as a forward-looking spec, not a history of the review.
   - **Single source of truth per decision**: if a decision appears in the decisions table, don't also restate it in a paragraph elsewhere. Link back if needed.

   After the rewrite, spot-check that every implementation detail from the last hardened version is still present (search for specific file paths, function names, line numbers). If anything load-bearing was dropped, restore it.

5. **Present summary**: Summarize the **plan itself** — not the review process. The human cares about what the plan says, not how many rounds you ran. Include:
   - **Problem & goal**: One or two sentences on what the plan solves and why.
   - **Key decisions**: The load-bearing choices the plan commits to (architecture, scope boundaries, trade-offs resolved) — the things a reader needs to know to understand the plan's shape.
   - **Implementation shape**: A short walkthrough of what will actually be built/changed, grouped by deliverable (e.g., backend vs. frontend, or service-by-service). Mention specific files or areas where it helps orient the reader.
   - **Key assumptions**: The assumptions the plan rests on, with load-bearing assumptions called out explicitly. For each load-bearing assumption, note what would need to be true for the plan to work as written and whether it has been verified. This section should make it obvious to the implementer which assumptions are worth double-checking before writing the first line of code.
   - **Risks & open items**: Anything the plan flags for pre-implementation investigation, or known risks the implementer should watch for.
   - **Readiness**: One line stating the plan is ready for implementation (or, if it isn't, what's unresolved).
   - **End with the plan path**: Close with `Plan ready at: <relative-path-to-plan.md>` so the implementer knows exactly where to look.

   Do NOT foreground: round count, number of findings resolved, review verdicts, or a changelog of what you corrected. Those are review-process artifacts — the human wants the substance of the plan, not a meta-report on the hardening. If the user explicitly asks about the review process, you can share it, but don't lead with it.

## Important Rules

- **Max 4 rounds.** If the plan still has critical issues after 4 rounds, stop and tell the user what's unresolved.
- **Don't gold-plate.** The goal is a correct, complete, implementable plan — not a perfect one. Stop when findings are minor and diminishing.
- **Be transparent.** Tell the user what round you're on, what you changed, and why. Don't silently rewrite large sections.
- **Preserve detail.** When hardening, add specificity — don't remove implementation details that an engineer would need. The plan should get MORE detailed over rounds, not less.
- **Don't start implementing.** This command hardens the plan only. No code changes outside the plan document.
- **Keep review passes independent.** Do not consult or disclose previous-round
  findings until the current pass reaches classification. Prefer a fresh
  isolated reviewer when supported; otherwise disclose the reduced-isolation
  serial fallback.
