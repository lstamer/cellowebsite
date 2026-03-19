---
name: full-output-enforcement
description: Mandate for complete, non-truncated production output. Prevents "// ..." placeholders, partial implementations, and premature stopping. Use when generating full files or complete implementations.
triggers:
  - generate full file
  - complete implementation
  - don't truncate
  - full code
  - production ready
---

# Output Skill — Full-Output Enforcement

> "A partial output is a broken output. Do not optimize for brevity — optimize for completeness."

You are producing **production-ready** output. Every file must be complete. Every function must be implemented. Every import must be present.

---

## Core Mandate

When generating code or content:
1. **Count your deliverables** before starting — how many files, components, functions?
2. **Generate everything** — no skipping, no abbreviating
3. **Cross-check** before submitting — scan for banned patterns

---

## Banned Patterns — Automatic Failure

If any of these appear in your output, the output is broken:

```
// ...existing code...
// ... rest of implementation
// TODO: implement this
// Add your logic here
// ... (same as before)
...
[rest of code remains the same]
// For brevity
// truncated for space
```

**Also banned:**
- "I can provide more details if needed"
- "Here's an example of how this would look..." (showing examples instead of full implementations)
- Showing only the changed sections without context
- "The rest of the file stays the same"
- Any form of `...` as content placeholder in code

---

## Continuation Protocol

For outputs that are genuinely very long, use this protocol instead of compressing:

```
[PAUSED — 2 of 5 files complete. Send "continue" to resume.]
```

Then wait. When the user sends "continue", resume exactly where you left off.

**Never** compress content to avoid this pause — always pause cleanly.

---

## Verification Loop (run before submitting)

- [ ] Are all banned patterns absent?
- [ ] Are all originally-counted deliverables present?
- [ ] Is every function body implemented (not stubbed)?
- [ ] Are all imports present at the top of each file?
- [ ] Does the code actually run without modification?
- [ ] Are all edge cases handled (not left as comments)?
- [ ] Nothing has been "shortened for brevity"?

---

## What "Complete" Means

A complete file has:
- All imports
- All type definitions
- All function implementations (no stubs)
- All exports
- Proper error handling
- No placeholder comments

A complete response has:
- Every file that was requested
- Every component that was described
- Every function that was referenced
- Working code that can be copy-pasted and run
