# Chapter 4 - Dimension: Accessibility

Copy-paste prompts for the hands-on movies in this chapter. Each prompt works the same in **Claude Code CLI** (`cd` into the app, run `claude`, paste) and **Claude Code Desktop** (open the app folder, paste into the chat). Run the prompts in order.

> Reset an app to its starting state between exercises with `git restore . && git clean -fd` from inside the app folder. Run `npm install` once per app before its first exercise.


## 4.2 - Audit accessibility: automated and manual

**App:** `demos/helpdesk-ai`

**Requires axe + Playwright (one-time, in this app):**

```bash
npm i -D @axe-core/playwright playwright && npx playwright install chromium
```

**Prompt 1**

```text
Audit the helpdesk UI for WCAG 2.2 AA issues. Write a small script `a11y.mjs` that uses Playwright with @axe-core/playwright and scans TWO states: the ticket list as loaded, and again with the compose dialog open (the dialog's controls are not in the tree until it is open, so a single page scan misses them). Wire it to `npm run a11y`.

Run it and report each violation with rule id, impact, node count, the success criterion, and the measured value - for contrast, the actual ratio against the 4.5:1 requirement. Print results in the terminal; do not save screenshots or reports.

Then answer one question explicitly: does the reply textarea pass or fail, and why? Tell me the accessible name axe computed for it. Do not fix anything yet.
```

**Prompt 2 - Then**

```text
Fix what the scan found: name the icon-only send button, and fix the priority badge contrast to meet 4.5:1. Re-run `npm run a11y` and show the before/after violation counts and the new contrast ratio.

Then go beyond the scanner. Give the reply textarea a real, persistent label - the placeholder is not one, as your scan just demonstrated. Next do a keyboard-only pass on the compose dialog: open it, tab through it, press Escape, and report what happens. Fix the focus handling so Escape closes the dialog and focus returns to the opener. Finally add the least intrusive live-region behavior so "Reply sent" is announced politely. Report each fix with how you verified it.
```

