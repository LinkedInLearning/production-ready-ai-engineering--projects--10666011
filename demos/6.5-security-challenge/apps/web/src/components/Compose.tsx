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
  const [sendError, setSendError] = useState(false);
  const [busy, setBusy] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus management (Demo D7): move focus into the dialog, and restore it to the
  // element that opened it when the dialog closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  // Keyboard (Demo D7): Escape closes the dialog; Tab stays trapped inside it.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
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

  // Guarded send (Demo D2): confirm the request succeeded before telling the agent the
  // reply went out. On failure we surface an error, keep the draft, and offer a retry
  // instead of silently claiming success.
  async function onSend() {
    setSendError(false);
    setStatus("");
    setBusy(true);
    try {
      await sendReply(ticket.id, draft);
      setStatus("Reply sent.");
      setDraft("");
    } catch {
      setSendError(true);
    } finally {
      setBusy(false);
    }
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

                        <label className="compose__label" htmlFor="compose-reply">
              Your reply
            </label>
            <textarea
              id="compose-reply"
              className="compose__box"
              placeholder="Write a reply..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />

            <div className="compose__actions">
              <button type="button" className="btn" onClick={onSuggest} disabled={busy}>
                {busy ? "Drafting..." : "AI Suggested Reply"}
              </button>
                            <button type="button" className="iconbtn" onClick={onSend} disabled={busy} aria-label="Send reply">
                <span aria-hidden="true">&#10148;</span>
              </button>
            </div>

            {/* Failure UX (Demo D2): a visible error with a retry that re-sends the
                same draft. role="alert" so a screen reader announces the failure. */}
            {sendError && (
              <div className="compose__error" role="alert">
                <span>Reply failed to send. Your draft was kept.</span>
                <button type="button" className="btn" onClick={onSend} disabled={busy}>
                  {busy ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            <div className="compose__status" role="status" aria-live="polite">{status}</div>
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
