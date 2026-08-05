import { useEffect, useMemo, useState } from "react";
import { fetchTickets, type Channel, type Priority, type Ticket } from "./api.js";
import { TicketList } from "./components/TicketList.js";
import { Compose } from "./components/Compose.js";
// NOTE (course): reporting is imported eagerly, so it ships in the initial JS
// bundle and mounts synchronously with the queue instead of being code-split.
// Demo D4 lazy-loads and defers this non-critical surface.
import { InsightsPanel } from "./components/InsightsPanel.js";

const priorities: Array<Priority | "all"> = ["all", "urgent", "high", "normal", "low"];
const channels: Array<Channel | "all"> = ["all", "chat", "email", "web", "api", "voice"];

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [channel, setChannel] = useState<Channel | "all">("all");

  // NOTE (course): sunny-day only. No loading state while tickets fetch, no empty
  // state, and no error handling - if the request is slow the queue is blank, and
  // if it fails, nothing tells the user. Demo D2 adds the missing UX states.
  useEffect(() => {
    fetchTickets().then(setTickets);
  }, []);

  const filteredTickets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const haystack = [
        ticket.id,
        ticket.subject,
        ticket.customer,
        ticket.team,
        ticket.assignee,
        ticket.productArea,
        ticket.tags.join(" "),
      ].join(" ").toLowerCase();

      return (
        (!needle || haystack.includes(needle)) &&
        (priority === "all" || ticket.priority === priority) &&
        (channel === "all" || ticket.channel === channel)
      );
    });
  }, [channel, priority, query, tickets]);

  const openCount = tickets.filter((ticket) => ticket.status === "open").length;
  const urgentCount = tickets.filter((ticket) => ticket.priority === "urgent").length;
  const escalatedCount = tickets.filter((ticket) => ticket.escalated).length;
  const atRisk = tickets.filter((ticket) => ticket.csatRisk >= 70);
  const atRiskValue = atRisk.reduce((sum, ticket) => sum + ticket.customerValue, 0);
  const focusTicket = filteredTickets[0] ?? tickets[0] ?? null;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">HA</span>
          <div>
            <strong>Helpdesk AI</strong>
            <small>Support operations</small>
          </div>
        </div>
        <nav className="topbar__nav" aria-label="Workspace">
          <a href="#queue">Queue</a>
          <a href="#quality">Quality</a>
          <a href="#insights">Reporting</a>
          <a href="#assist">AI assist</a>
        </nav>
      </header>

      <main className="app__main">
        <section className="hero-panel">
          <div className="hero-panel__copy">
            <span className="eyebrow">AI-assisted support inbox</span>
            <h1>Triage, draft, and verify the support queue.</h1>
            <p>
              A compact support workspace with real product surfaces: queue filters, customer
              context, reporting, knowledge links, and an AI Suggested Reply flow.
            </p>
          </div>
          <div className="hero-panel__visual">
            {/* NOTE (course): oversized PNG with no width/height and no responsive
                sources. It is the LCP element and it shifts the layout when it finally
                arrives. Demo D4 right-sizes it and reserves its space. */}
            <img className="app__hero" src="/hero-1280.png" alt="" />
          </div>
        </section>

        <section className="metrics" aria-label="Queue summary">
          <article>
            <span>Open tickets</span>
            <strong>{openCount}</strong>
            <small>{filteredTickets.length} visible now</small>
          </article>
          <article>
            <span>Urgent</span>
            <strong>{urgentCount}</strong>
            <small>{escalatedCount} escalated</small>
          </article>
          <article>
            <span>CSAT risk</span>
            <strong>{atRisk.length}</strong>
            <small>{currency(atRiskValue)} at risk</small>
          </article>
          <article>
            <span>Quality floor</span>
            <strong>low</strong>
            <small>ready for gates</small>
          </article>
        </section>

        <div className="workspace">
          <section id="queue" className="panel panel--queue">
            <div className="panel__head">
              <div>
                <span className="eyebrow">Queue</span>
                <h2>Priority inbox</h2>
              </div>
              <span className="panel__status">live mock data</span>
            </div>

            <div className="queue-toolbar">
              <div className="searchbox">
                <span>Search</span>
                <input
                  aria-label="Search tickets"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="customer, tag, product area"
                />
              </div>
              <select
                aria-label="Filter by priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority | "all")}
              >
                {priorities.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select
                aria-label="Filter by channel"
                value={channel}
                onChange={(event) => setChannel(event.target.value as Channel | "all")}
              >
                {channels.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            {/* NOTE (course): the list renders unconditionally - no loading, empty,
                or error branch. Demo D2 adds them. */}
            <TicketList tickets={filteredTickets} onOpen={setSelected} />
          </section>

          <aside className="side-stack">
            <section id="quality" className="panel">
              <span className="eyebrow">Quality bar</span>
              <h2>Not production-ready yet</h2>
              <ul className="quality-list">
                <li><span>UX states</span><b>missing</b></li>
                <li><span>Accessibility</span><b>needs audit</b></li>
                <li><span>Performance</span><b>ungated</b></li>
                <li><span>Security</span><b>review needed</b></li>
                <li><span>Reliability</span><b>no fallback</b></li>
              </ul>
            </section>

            {focusTicket && (
              <section className="panel panel--account">
                <span className="eyebrow">Next account</span>
                <h2>{focusTicket.customer}</h2>
                <dl className="account-facts">
                  <div><dt>Tier</dt><dd>{focusTicket.accountTier}</dd></div>
                  <div><dt>Area</dt><dd>{focusTicket.productArea}</dd></div>
                  <div><dt>Owner</dt><dd>{focusTicket.assignee}</dd></div>
                  <div><dt>Risk</dt><dd>{focusTicket.csatRisk}</dd></div>
                </dl>
                <div className="tag-cloud">
                  {focusTicket.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </section>
            )}

            <InsightsPanel tickets={tickets} />

            <section id="assist" className="panel panel--assist">
              <span className="eyebrow">AI assist</span>
              <h2>Suggested Reply</h2>
              <p>
                Uses a deterministic mock unless an API key is present, so every recording take
                stays reproducible. The prompt boundary and output guardrail are intentionally weak.
              </p>
            </section>
          </aside>
        </div>
        {selected && <Compose ticket={selected} onClose={() => setSelected(null)} />}
      </main>
    </div>
  );
}
