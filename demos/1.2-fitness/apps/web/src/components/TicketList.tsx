import type { Ticket } from "../api.js";

interface Props {
  tickets: Ticket[];
  onOpen: (t: Ticket) => void;
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function currency(value: number): string {
  if (value >= 100000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value / 1000)}k`;
}

// NOTE (course): starting state has no loading/empty/error UI (Demo D2 adds them),
// and the priority badge colors fail contrast (Demo D7 fixes a11y).
export function TicketList({ tickets, onOpen }: Props) {
  return (
    <ul className="tickets">
      {tickets.map((t) => (
        <li key={t.id} className="ticket">
          <button className="ticket__open" onClick={() => onOpen(t)}>
            <span className="ticket__priority">
              <span className={`badge badge--${t.priority}`}>{t.priority}</span>
              <span className={`channel channel--${t.channel}`}>{t.channel}</span>
              <span className="ticket__id">{t.id}</span>
            </span>
            <span className="ticket__body">
              <span className="ticket__subject">
                {t.escalated && <span className="escalation-dot" />}
                {t.subject}
              </span>
              <span className="ticket__preview">{t.messages[0]?.body}</span>
              <span className="ticket__tags">
                {t.tags.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </span>
            </span>
            <span className="ticket__meta">
              <span className="ticket__customer">{t.customer}</span>
              <span>{t.accountTier} | {currency(t.customerValue)}</span>
              <span>{t.assignee} | {t.team}</span>
              <span>CSAT risk {t.csatRisk} | SLA {t.slaHours}h</span>
              <span>last {shortDate(t.lastActivityAt)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
