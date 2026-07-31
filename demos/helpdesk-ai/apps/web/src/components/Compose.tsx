import { useEffect, useRef, useState } from "react";
import { suggestReply, sendReply, type Ticket } from "../api.js";

interface Props {
  ticket: Ticket;
  onClose: () => void;
}

function focusableWithin(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

export function Compose({ ticket, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // NOTE (course): focus moves into the dialog on open but is never restored to the
  // opener on close, so keyboard focus is lost when the dialog goes away. Demo D7
  // fixes focus restoration.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // NOTE (course): Tab is trapped within the dialog, but Escape does nothing - there
  // is no keyboard way to dismiss it. Demo D7 adds Escape-to-close.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusables = focusableWithin(dialogRef.current);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function onSuggest() {
    setBusy(true);
    setDraft(await suggestReply(ticket.id));
    setBusy(false);
  }

  // NOTE (course): optimistic and unguarded. The box clears and "Reply sent." shows
  // immediately; if the request fails there is no error, no retry, and no signal -
  // the agent believes the reply went out. Demo D2 adds the failure UX.
  async function onSend() {
    setStatus("Reply sent.");
    setDraft("");
    await sendReply(ticket.id, draft);
  }

  return (
    <div className="modal-shell">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
        ref={dialogRef}
        onKeyDown={onKeyDown}
      >
        <div className="modal__head">
          <div>
            <span className={`badge badge--${ticket.priority}`}>{ticket.priority}</span>
            <span className={`channel channel--${ticket.channel}`}>{ticket.channel}</span>
            <h2 id="compose-title">{ticket.subject}</h2>
            <p>{ticket.customer} | {ticket.accountTier} | {ticket.team}</p>
          </div>
          <button
            type="button"
            className="modal__x"
            onClick={onClose}
            aria-label="Close reply dialog"
            ref={closeRef}
          >
            x
          </button>
        </div>

        <div className="compose-grid">
          <div>
            <div className="thread">
              {ticket.messages.map((m, i) => (
                <p key={i} className={`msg msg--${m.from}`}>
                  {m.body}
                </p>
              ))}
            </div>

            {/* NOTE (course): no <label> - only a placeholder, which is not an
                accessible name for the textarea. Demo D7 adds a real label. */}
            <textarea
              className="compose__box"
              placeholder="Write a reply..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />

            <div className="compose__actions">
              <button type="button" className="btn" onClick={onSuggest} disabled={busy}>
                {busy ? "Drafting..." : "AI Suggested Reply"}
              </button>
              {/* NOTE (course): icon-only button with no accessible name - the glyph
                  is aria-hidden and there is no aria-label. Demo D7 names it. */}
              <button type="button" className="iconbtn" onClick={onSend}>
                <span aria-hidden="true">&#10148;</span>
              </button>
            </div>

            {/* NOTE (course): visual-only status - no aria-live, so a screen reader
                never announces "Reply sent." And there is no error/retry UI at all.
                Demo D2 adds the error state; Demo D7 makes this a live region. */}
            <div className="compose__status">{status}</div>
          </div>

          <aside className="reply-context">
            <section>
              <span className="eyebrow">Customer</span>
              <dl>
                <div><dt>Assignee</dt><dd>{ticket.assignee}</dd></div>
                <div><dt>Sentiment</dt><dd>{ticket.sentiment}</dd></div>
                <div><dt>CSAT risk</dt><dd>{ticket.csatRisk}</dd></div>
                <div><dt>Escalated</dt><dd>{ticket.escalated ? "yes" : "no"}</dd></div>
              </dl>
            </section>
            <section>
              <span className="eyebrow">Macros</span>
              <div className="macro-list">
                <button type="button">Ask for logs</button>
                <button type="button">Send status page</button>
                <button type="button">Escalate to on-call</button>
              </div>
            </section>
            <section>
              <span className="eyebrow">Related articles</span>
              <ul className="article-list">
                {ticket.relatedArticles.map((article) => (
                  <li key={article}>{article}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
