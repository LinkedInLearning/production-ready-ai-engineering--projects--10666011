# 06 - Accessibility needs automated and manual checks

**tl;dr: automated accessibility checks are a floor. Keyboard and screen-reader passes are where many real failures appear.**

Use WCAG 2.2 Level AA as the target for `helpdesk-ai`. It is specific enough to guide both humans and tools.

Start with automated checks. axe and Lighthouse are good at catching deterministic structural issues:

- form controls without labels,
- icon buttons without accessible names,
- text with insufficient contrast,
- invalid ARIA patterns.

In the starting compose dialog, the textarea has no associated label and the send button is icon-only. The priority badges also use low-contrast colors. These are good agent tasks because the fix is local and the tool can verify it.

Ask Claude to fix the deterministic set, then re-run the scan. Green is progress.

It is not the finish line.

Automated tools cannot tell you whether the focus order makes sense, whether Escape closes a dialog, whether focus returns to the opener, or whether a status update is announced. They can confirm a label exists. They cannot always tell you whether the label is useful.

The manual pass for this app is small:

1. Use only the keyboard.
2. Open a ticket.
3. Tab through the compose dialog.
4. Press Escape.
5. Confirm focus returns to the ticket button.
6. Send a reply and confirm the status is announced by a screen reader.

When Claude proposes ARIA, review it. A common agent failure is adding roles that sound accessibility-shaped but are wrong for the interaction. A polite confirmation needs `aria-live="polite"`, not an assertive interruption.

The rule of thumb: tools verify markup, interaction verifies experience, and humans review semantics.
