# Chapter 2 — Dimension: User Experience

Copy-paste prompts for the hands-on movies in this chapter. Each prompt works the same in **Claude Code CLI** (`cd` into the app, run `claude`, paste) and **Claude Code Desktop** (open the app folder, paste into the chat). Run the prompts in order.

> Reset an app to its starting state between exercises with `git restore . && git clean -fd` from inside the app folder. Run `npm install` once per app before its first exercise.


## 2.2 — Verify the experience in a real browser

**App:** `demos/helpdesk-ai`

**Start:**
```bash
cd demos/helpdesk-ai
npm run dev:slow   # NOT `npm run dev` — this episode needs the simulated 4s queue load
```

**Prompt 1**

```text
Verify the helpdesk queue-to-reply flow at http://localhost:5173 using the built-in browser - if its not live, fire it up using npm run dev:slow. Report in the terminal — no screenshots, no files — and do not change any code. Work through all of this without stopping to ask me; you have everything you need.

FIRST, confirm the simulated slow queue is actually on:
  curl -s -o /dev/null -w "%{time_total}\n" http://localhost:3001/api/tickets
It must be about 4 seconds. If it comes back under a second, stop immediately and tell me to restart the app with `npm run dev:slow` — nothing below is valid without it.

1. LOADING. Do not navigate in one call and inspect in the next; the round trip is slower than the load and you will miss the window. In a SINGLE evaluation, load the app in a hidden iframe and poll it about once a second for ~7s, recording per tick: elapsed ms, ticket-row count, whether any loading text is present, and the number of [role=status], [aria-busy] and [aria-live] regions. Return the timeline.

2. EMPTY. Type a query into the search box that matches nothing and report what replaces the list. Then compare it to the loading screen and tell me directly: could a user tell those two apart?

3. SUBMIT FAILURE. Order matters — do this while the API is still up: open a ticket and draft a reply. THEN stop the API yourself with `lsof -ti:3001 | xargs kill`, submit the reply, and report exactly what happens to the compose box and whether the user could tell it did not send.

4. FETCH FAILURE. With the API still down, reload the page and report what the queue shows, plus any console errors.

Finish with one line per state: what is on screen, and whether a user could tell what happened.
```

**Prompt 2 — Then**

```text
Fix all four states. Confine the changes to apps/web/src/App.tsx and apps/web/src/components/Compose.tsx — do not go exploring:
- a loading affordance while the queue is fetching, announced to assistive tech
- a distinct empty-result message, worded so it cannot be confused with loading
- a fetch-failure message with a retry control
- a failed submit that keeps the user's draft and shows an inline error plus Retry

Then re-verify only the two beats that carry the episode, using the identical methods: re-run the single-evaluation iframe timeline (the early ticks must now report a loading affordance instead of an empty panel), and repeat the draft-then-kill-API-then-submit sequence. Print one before/after table covering all four states, then run `npm run typecheck`. Do not re-drive the states you have already proven.
```

