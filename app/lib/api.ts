// lib/api.ts
const API_BASE = "http://localhost:8002/api/v1"

export const api = {
  me: `${API_BASE}/account/me`,
  profile: `${API_BASE}/profile`,
  myTickets: `${API_BASE}/tickets/my-tickets`,
  createTicket: `${API_BASE}/tickets`,
}