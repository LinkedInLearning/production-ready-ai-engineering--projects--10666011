# Chapter 1 - What Production-Grade Quality Means

Copy-paste prompts for the hands-on movies in this chapter. Each prompt works the same in **Claude Code CLI** (`cd` into the app, run `claude`, paste) and **Claude Code Desktop** (open the app folder, paste into the chat). Run the prompts in order.

> Reset an app to its starting state between exercises with `git restore . && git clean -fd` from inside the app folder. Run `npm install` once per app before its first exercise.


## 1.3 - Turn your quality bar into a fitness function

**App:** `demos/helpdesk-ai`

**Prompt 1**

```text
Inspect this repo and turn the architecture rule in CLAUDE.md into an executable fitness function. The rule: code under apps/web must not import code under apps/api.

Use dependency-cruiser. Add it as a dev dependency, write the smallest config that forbids that one edge, and wire it to `npm run fitness`. Run it and show me the failure before fixing anything.

Print the result in the terminal - do not write screenshots or report files. I want the failing run on screen naming the exact forbidden import (source file, imported module, rule name) plus the module and dependency counts it cruised.
```

**Prompt 2 - Then**

```text
Fix the violation properly. The web app must not import server-side code from apps/api. Here it pulls in the server's feature-flag module to gate a button, but the server already gates the feature (server-side flag plus template fallback), so the client should just call the API and drop the import. Remove the cross-boundary import and any now-dead client-side flag check; move genuinely shared, framework-free logic to @helpdesk/core instead of apps/api. Then run `npm run fitness` and `npm run test` and print the before/after violation counts in the terminal. Do not write screenshots or report files. Show the changed files and the command output.
```

**Prompt 3 - Optional - make the agent hold itself to the gate. Set a completion goal so it loops until the checks pass (verify `/goal` in your version; otherwise show the Stop-hook equivalent)**

```text
/goal npm run fitness and npm run test both pass
```

