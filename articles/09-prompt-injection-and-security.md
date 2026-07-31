# 09 - Prompt injection and security review

**tl;dr: treat user content as data, not instructions. Then scan the rest of the code like any other production change.**

The `T-1006` ticket in `helpdesk-ai` contains a hidden instruction asking the assistant to ignore prior instructions and leak a fake customer email list. In the starting app, the deterministic mock obeys it so the failure is easy to see.

This is the clearest place to make "green but wrong" visible. Have Claude drive the built-in browser, trigger the Suggested Reply on `T-1006`, and screenshot the leaked list in the reply box — the red frame — then, after hardening, screenshot the safe reply on the same ticket as the green frame. The eval log tells you the gate flipped; the frame pair proves it in the running product. Save both under `evidence/injection/`.

That is indirect prompt injection. The user submitted content. The system later fed that content to a model. The model treated part of the content as an instruction.

The fix is not just a stronger prompt. A stronger prompt can help, but the security boundary should not depend on politeness.

Harden the architecture:

- isolate untrusted ticket text as data,
- keep private data out of reach when the feature does not need it,
- avoid network or webhook access in the same path unless required,
- validate output before returning it,
- add an eval that catches the leak.

This maps directly to the broader AI security model. The dangerous combination is private data, untrusted content, and an exfiltration path. Remove one of those where you can.

The rest of the endpoint still needs ordinary security review:

- dependency verification,
- input validation,
- SSRF prevention,
- auth and rate limits,
- secrets handling,
- logging without leaking sensitive data.

Ask Claude Code for file-line findings and exploit sketches, not general advice. "Could be insecure" is not enough. A useful finding says what file, what path, how it fails, and what check would catch it again.

For agent-assisted work, security has two surfaces: the code the agent writes and the permissions the agent has while writing it. Both deserve constraints.
