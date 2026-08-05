import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Priority } from "@helpdesk/core";

export interface Message {
  from: "customer" | "agent";
  at: string;
  body: string;
}

export type Channel = "api" | "chat" | "email" | "voice" | "web";
export type AccountTier = "trial" | "startup" | "business" | "enterprise";
export type Sentiment = "angry" | "confused" | "frustrated" | "neutral" | "worried";

export interface Ticket {
  id: string;
  subject: string;
  customer: string;
  priority: Priority;
  status: "open" | "pending" | "closed";
  channel: Channel;
  team: string;
  assignee: string;
  accountTier: AccountTier;
  sentiment: Sentiment;
  productArea: string;
  createdAt: string;
  lastActivityAt: string;
  slaHours: number;
  customerValue: number;
  csatRisk: number;
  escalated: boolean;
  tags: string[];
  relatedArticles: string[];
  messages: Message[];
}

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = join(here, "..", "..", "..", "data", "tickets.json");

// In-memory store seeded from disk. Mutable so the reply endpoint can append.
const tickets: Ticket[] = JSON.parse(readFileSync(dataPath, "utf8"));

export function getTickets(): Ticket[] {
  return tickets;
}

export function getTicket(id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

export function addMessage(id: string, message: Message): Ticket | undefined {
  const ticket = getTicket(id);
  if (!ticket) return undefined;
  ticket.messages.push(message);
  return ticket;
}
