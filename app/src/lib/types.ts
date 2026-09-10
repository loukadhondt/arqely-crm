export type Profile = {
  id: string; email: string; full_name: string | null; role: 'owner' | 'member'
  locale: 'fr' | 'en'; is_active: boolean; created_at: string
}
export type Company = {
  id: string; name: string; industry: string | null; website: string | null; phone: string | null
  email: string | null; address: string | null; city: string | null; country: string | null
  google_maps_url: string | null; notes: string | null; owner_id: string | null; created_at: string
}
export type ContactStatus = 'lead' | 'prospect' | 'client' | 'lost'
export type Contact = {
  id: string; company_id: string | null; first_name: string | null; last_name: string | null
  email: string | null; phone: string | null; position: string | null; source: string
  status: ContactStatus; tags: string[]; notes: string | null; owner_id: string | null
  last_activity_at: string | null; created_at: string
  company?: Pick<Company, 'id' | 'name'> | null
}
export type Stage = { id: string; name_fr: string; name_en: string; position: number; probability: number; is_won: boolean; is_lost: boolean }
export type Deal = {
  id: string; title: string; contact_id: string | null; company_id: string | null; stage_id: string
  amount: number; monthly_amount: number; currency: string; expected_close: string | null
  status: 'open' | 'won' | 'lost'; lost_reason: string | null; position: number; owner_id: string | null
  closed_at: string | null; created_at: string
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name' | 'email'> | null
  company?: Pick<Company, 'id' | 'name'> | null
}
export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'form' | 'booking' | 'system'
export type Activity = {
  id: string; type: ActivityType; subject: string | null; body: string | null; contact_id: string | null
  company_id: string | null; deal_id: string | null; user_id: string | null; occurred_at: string; metadata: Record<string, unknown>
}
export type Task = {
  id: string; title: string; description: string | null; due_at: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'; status: 'todo' | 'done'; assignee_id: string | null
  created_by: string | null; contact_id: string | null; company_id: string | null; deal_id: string | null
  completed_at: string | null; created_at: string
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name'> | null
  company?: Pick<Company, 'id' | 'name'> | null
}
export type Service = { id: string; code: string; name_fr: string; name_en: string; billing: 'monthly' | 'one_off'; default_price: number; is_active: boolean }
export type Subscription = {
  id: string; company_id: string | null; contact_id: string | null; service_id: string | null; name: string
  status: 'active' | 'paused' | 'cancelled' | 'completed'; monthly_amount: number; one_off_amount: number
  start_date: string; end_date: string | null; renewal_date: string | null; notes: string | null; owner_id: string | null
  company?: Pick<Company, 'id' | 'name'> | null
  service?: Pick<Service, 'id' | 'code' | 'name_fr' | 'name_en'> | null
}
export type InboundEvent = { id: string; source: string; payload: Record<string, unknown>; processed: boolean; contact_id: string | null; error: string | null; created_at: string }

export const contactName = (c?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null) =>
  c ? ([c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || '—') : '—'
