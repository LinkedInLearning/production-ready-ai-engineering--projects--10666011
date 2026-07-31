import { formatTicketId } from "@helpdesk/core";

export type Priority = "low" | "normal" | "high" | "urgent";
export type Channel = "api" | "chat" | "email" | "voice" | "web";
export type AccountTier = "trial" | "startup" | "business" | "enterprise";
export type Sentiment = "angry" | "confused" | "frustrated" | "neutral" | "worried";

export interface Message {
  from: "customer" | "agent";
  at: string;
  body: string;
}

export interface Ticket {
  id: string;
  subject: string;
  customer: string;
  priority: Priority;
  status: string;
  channel: Channel;
  team: string;
  assignee: string;
  accountTier: AccountTier;
  sentiment: Sentiment;
  productArea: string;
  createdAt: string;
  lastActivityAt: string;
  slaHours: number;
  ageHours?: number;
  customerValue: number;
  csatRisk: number;
  escalated: boolean;
  tags: string[];
  relatedArticles: string[];
  messages: Message[];
}

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch("/api/tickets");
  if (!res.ok) throw new Error(`Failed to load tickets (${res.status})`);
  return res.json();
}

export async function fetchTicket(id: string): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${formatTicketId(id)}`);
  if (!res.ok) throw new Error(`Failed to load ticket (${res.status})`);
  return res.json();
}

export async function suggestReply(id: string): Promise<string> {
  const res = await fetch(`/api/tickets/${formatTicketId(id)}/suggest`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to get suggestion (${res.status})`);
  const data = (await res.json()) as { suggestion: string };
  return data.suggestion;
}

export async function sendReply(id: string, body: string): Promise<void> {
  const res = await fetch(`/api/tickets/${formatTicketId(id)}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`Failed to send reply (${res.status})`);
}

