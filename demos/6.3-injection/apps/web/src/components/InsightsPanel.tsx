import { useMemo } from "react";
import type { Ticket } from "../api.js";

interface Props {
  tickets: Ticket[];
}

interface InsightRow {
  area: string;
  count: number;
  risk: number;
  value: number;
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function summarizeByArea(tickets: Ticket[]): InsightRow[] {
  const rows = new Map<string, InsightRow>();
  for (const ticket of tickets) {
    const current = rows.get(ticket.productArea) ?? {
      area: ticket.productArea,
      count: 0,
      risk: 0,
      value: 0,
    };
    current.count += 1;
    current.risk += ticket.csatRisk;
    current.value += ticket.customerValue;
    rows.set(ticket.productArea, current);
  }
  return Array.from(rows.values())
    .map((row) => ({ ...row, risk: row.count ? Math.round(row.risk / row.count) : 0 }))
    .sort((a, b) => b.risk - a.risk);
}

function channelShare(tickets: Ticket[]) {
  const counts = tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.channel] = (acc[ticket.channel] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([channel, count]) => ({
      channel,
      count,
      width: tickets.length ? Math.max(8, Math.round((count / tickets.length) * 100)) : 0,
    }));
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "have", "your", "from", "into",
  "about", "when", "will", "there", "their", "would", "could", "been", "what",
  "just", "cannot", "since", "still", "which", "them", "they", "were", "here",
]);

// Real reporting work: scan every message body across the whole queue and rank the
// most common meaningful terms ("hot topics"). Cost scales with message volume.
// NOTE (course): this runs on EVERY render because it is not memoized - typing in
// the search box re-renders the app and re-scans all message text. Demo D4 memoizes
// it and code-splits/defers this whole panel off the critical path.
function hotTopics(tickets: Ticket[]): Array<{ term: string; count: number }> {
  const freq = new Map<string, number>();
  for (const ticket of tickets) {
    for (const message of ticket.messages) {
      const words = message.body.toLowerCase().split(/[^a-z]+/);
      for (const word of words) {
        if (word.length < 4 || STOPWORDS.has(word)) continue;
        freq.set(word, (freq.get(word) ?? 0) + 1);
      }
    }
  }
  return Array.from(freq.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function InsightsPanel({ tickets }: Props) {
  // NOTE (course): all derived here, unmemoized, on every render.
  // Memoized (Demo D4): unrelated re-renders no longer re-run the reporting scans.
  const areaRows = useMemo(() => summarizeByArea(tickets), [tickets]);
  const channels = useMemo(() => channelShare(tickets), [tickets]);
  const topics = useMemo(() => hotTopics(tickets), [tickets]);
  const atRiskValue = tickets
    .filter((ticket) => ticket.csatRisk >= 70 || ticket.escalated)
    .reduce((sum, ticket) => sum + ticket.customerValue, 0);

  return (
    <section id="insights" className="panel panel--insights">
      <div className="panel__head">
        <div>
          <span className="eyebrow">Reporting</span>
          <h2>Queue health</h2>
        </div>
        <span className="panel__status panel__status--warn">eager</span>
      </div>

      <div className="insight-callout">
        <span>Revenue at CSAT risk</span>
        <strong>{currency(atRiskValue)}</strong>
      </div>

      <div className="chart-list" aria-label="Channel mix">
        {channels.map((item) => (
          <div className="chart-row" key={item.channel}>
            <span>{item.channel}</span>
            <div className="chart-row__track">
              <i style={{ width: `${item.width}%` }} />
            </div>
            <b>{item.count}</b>
          </div>
        ))}
      </div>

      <div className="tag-cloud" aria-label="Hot topics">
        {topics.map((topic) => (
          <span key={topic.term}>{topic.term} · {topic.count}</span>
        ))}
      </div>

      <ul className="area-list">
        {areaRows.slice(0, 5).map((row) => (
          <li key={row.area}>
            <span>
              <b>{row.area}</b>
              <small>{row.count} tickets</small>
            </span>
            <strong>{row.risk}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
