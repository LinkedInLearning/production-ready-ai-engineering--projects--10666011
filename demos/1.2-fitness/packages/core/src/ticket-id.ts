// Shared, framework-free helper. Lives in @helpdesk/core because both the web
// UI and the API need to normalize ticket ids the same way, and neither side may
// reach across the architecture boundary to borrow the other's copy (see CLAUDE.md).
export function formatTicketId(id: string): string {
  return id.startsWith("T-") ? id : `T-${id}`;
}
