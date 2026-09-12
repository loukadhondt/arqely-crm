import type { Contact, Deal, Subscription, Task } from './types'
export type ActionCategory = 'tasks' | 'deals' | 'contacts' | 'projects'
export type ActionItem = { id: string; category: ActionCategory; title: string; detail: string; href: string; due: string | null; owner: string | null; task?: Task; draft?: Partial<Task> }
export function buildActions(tasks: Task[], deals: Deal[], contacts: Contact[], subscriptions: Subscription[], locale: 'fr' | 'en', now = new Date()): ActionItem[] {
  const copy = (fr: string, en: string) => locale === 'fr' ? fr : en
  const openTasks = tasks.filter(t => t.status === 'todo')
  const items: ActionItem[] = openTasks.map(t => ({ id: `task:${t.id}`, category: 'tasks', title: t.title, detail: t.description || t.company?.name || '', href: '/tasks', due: t.due_at, owner: t.assignee_id, task: t }))
  for (const d of deals.filter(d => d.status === 'open')) {
    if (openTasks.some(t => t.deal_id === d.id)) continue
    items.push({ id: `deal:${d.id}`, category: 'deals', title: d.title, detail: copy('Affaire ouverte sans prochaine tâche liée.', 'Open deal without a linked next task.'), href: '/pipeline', due: d.expected_close ? `${d.expected_close}T23:59:59` : null, owner: d.owner_id, draft: { title: copy('Définir la prochaine action : ', 'Define next action: ') + d.title, deal_id: d.id, company_id: d.company_id, contact_id: d.contact_id, assignee_id: d.owner_id } })
  }
  for (const c of contacts.filter(c => c.status !== 'lost')) {
    const reasons: string[] = []
    if (!c.email && !c.phone) reasons.push(copy('Coordonnées à trouver', 'Contact details missing'))
    if (c.tags?.some(t => /[àa][ -]confirmer|[àa][ -]compl[ée]ter/i.test(t)) || /à confirmer|à compléter/i.test(c.notes || '')) reasons.push(copy('Informations à confirmer', 'Information to confirm'))
    const followed = openTasks.some(t => t.contact_id === c.id || (t.deal_id && deals.some(d => d.id === t.deal_id && d.contact_id === c.id)))
    if (['lead', 'prospect'].includes(c.status) && !followed) reasons.push(copy('Aucune prochaine tâche liée', 'No linked next task'))
    if (reasons.length) items.push({ id: `contact:${c.id}`, category: 'contacts', title: [c.first_name,c.last_name].filter(Boolean).join(' ') || c.email || '—', detail: reasons.join(' · '), href: `/contacts/${c.id}`, due: null, owner: c.owner_id, draft: { title: copy('Vérifier / suivre : ', 'Review / follow up: ') + ([c.first_name,c.last_name].filter(Boolean).join(' ') || c.email || '—'), contact_id: c.id, company_id: c.company_id, assignee_id: c.owner_id, description: reasons.join(' · ') } })
  }
  const horizon = new Date(now); horizon.setDate(horizon.getDate() + 30); horizon.setHours(23,59,59,999)
  for (const s of subscriptions.filter(s => ['active','paused'].includes(s.status))) {
    const dates = [s.renewal_date,s.end_date].filter((d): d is string => Boolean(d)).sort()
    const due = dates[0] ? `${dates[0]}T23:59:59` : null
    if (s.status !== 'paused' && (!due || new Date(due) > horizon)) continue
    items.push({ id: `project:${s.id}`, category: 'projects', title: s.name, detail: s.status === 'paused' ? copy('Projet ou abonnement en pause : décider de la suite.', 'Paused project or subscription: decide next steps.') : copy('Renouvellement ou fin de projet à traiter.', 'Renewal or project end to handle.'), href: '/subscriptions', due, owner: s.owner_id })
  }
  return items.sort((a,b) => (a.due || '9999').localeCompare(b.due || '9999') || a.title.localeCompare(b.title))
}
