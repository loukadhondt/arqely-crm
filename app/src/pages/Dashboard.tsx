import ActionOverview from '../components/ActionOverview'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarClock, Inbox, Repeat, CheckCircle2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, fmtMoney, fmtDate, relTime } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { contactName, type Task, type Deal, type Contact, type Subscription, type Stage } from '../lib/types'
import { PageHeader, Stat, Badge, OwnerName, Modal } from '../components/ui'

import { TaskForm } from './Tasks'

export default function Dashboard() {
  const { t, locale } = useT(); const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [deals, setDeals] = useState<Deal[]>([]); const [stages, setStages] = useState<Stage[]>([])
  const [leads, setLeads] = useState<Contact[]>([]); const [stale, setStale] = useState<Contact[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [allSubs, setAllSubs] = useState<Subscription[]>([])
  const [onlyMine, setOnlyMine] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Partial<Task> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<string[]>([])
  const copy = (fr: string, en: string) => locale === 'fr' ? fr : en

  const [mrr, setMrr] = useState(0); const [clients, setClients] = useState(0)
  const load = async () => {
    setLoading(true); setError('')
    // Range through all rows instead of silently truncating the overview.
    const all = async (makeQuery: () => any) => {
      const rows: any[] = []
      for (let offset = 0; ; offset += 500) {
        const result = await makeQuery().range(offset, offset + 499)
        if (result.error) throw new Error(result.error.message)
        rows.push(...(result.data ?? []))
        if ((result.data ?? []).length < 500) return rows
      }
    }
    try {
      const [tk, dl, st, ct, sb] = await Promise.all([
        all(() => supabase.from('tasks').select('*, contact:contacts(id,first_name,last_name), company:companies(id,name)').eq('status','todo').order('id')),
        all(() => supabase.from('deals').select('*, contact:contacts(id,first_name,last_name,email), company:companies(id,name)').in('status',['open','won']).order('id')),
        all(() => supabase.from('pipeline_stages').select('*').order('position').order('id')),
        all(() => supabase.from('contacts').select('*, company:companies(id,name)').order('id')),
        all(() => supabase.from('subscriptions').select('*, company:companies(id,name)').in('status',['active','paused']).order('id')),
      ])
      setTasks(tk); setDeals(dl); setStages(st); setAllContacts(ct); setAllSubs(sb)
      const weekAgo = Date.now() - 7 * 864e5; const threeDaysAgo = Date.now() - 3 * 864e5
      setLeads(ct.filter(c => ['lead','prospect'].includes(c.status) && new Date(c.created_at).getTime() >= weekAgo).sort((a,b) => b.created_at.localeCompare(a.created_at)))
      setStale(ct.filter(c => c.status === 'lead' && new Date(c.created_at).getTime() < threeDaysAgo && (!c.last_activity_at || new Date(c.last_activity_at).getTime() < threeDaysAgo)))
      const in30 = new Date(); in30.setDate(in30.getDate()+30)
      setSubs(sb.filter(s => s.status === 'active' && s.renewal_date && new Date(s.renewal_date) <= in30).sort((a,b) => a.renewal_date.localeCompare(b.renewal_date)))
      const active = sb.filter(s => s.status === 'active')
      setMrr(active.reduce((sum,s) => sum + Number(s.monthly_amount),0)); setClients(new Set(active.map(s => s.company_id).filter(Boolean)).size)
    } catch (e) { setError(e instanceof Error ? e.message : copy('Chargement impossible.', 'Unable to load.')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const myTasks = onlyMine ? tasks.filter((x) => x.assignee_id === profile?.id) : tasks
  const now = new Date(); const endToday = new Date(now); endToday.setHours(23, 59, 59, 999)
  const endWeek = new Date(endToday); endWeek.setDate(now.getDate() + 7)
  const groups = [
    { id: 'overdue', label: t('overdue'), items: myTasks.filter(x => x.due_at && new Date(x.due_at) < now) },
    { id: 'today', label: t('today'), items: myTasks.filter(x => x.due_at && new Date(x.due_at) >= now && new Date(x.due_at) <= endToday) },
    { id: 'week', label: copy('Les 7 prochains jours', 'Next 7 days'), items: myTasks.filter(x => x.due_at && new Date(x.due_at) > endToday && new Date(x.due_at) <= endWeek) },
    { id: 'later', label: copy('Plus tard', 'Later'), items: myTasks.filter(x => x.due_at && new Date(x.due_at) > endWeek) },
    { id: 'undated', label: copy('À planifier', 'To schedule'), items: myTasks.filter(x => !x.due_at) },
  ]
  const rank = { urgent: 0, high: 1, normal: 2, low: 3 }
  const visibleGroups = groups.filter(g => filter === 'all' || filter === g.id).map(g => ({ ...g, items: g.items.filter(x =>
    [x.title, x.description, x.company?.name, x.contact && contactName(x.contact)].filter(Boolean).join(' ').toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale))
  ).sort((a, b) => rank[a.priority] - rank[b.priority] || (a.due_at ?? '').localeCompare(b.due_at ?? '')) }))
  const overdue = groups[0].items

  const openDeals = deals.filter((d) => d.status === 'open')
  const wonDeals = deals.filter((d) => d.status === 'won')
  const pipelineValue = openDeals.reduce((s, d) => s + Number(d.amount), 0)
  const weighted = openDeals.reduce((s, d) => { const p = stages.find((x) => x.id === d.stage_id)?.probability ?? 0; return s + Number(d.amount) * p / 100 }, 0)
  const signed = wonDeals.reduce((s, d) => s + Number(d.amount), 0)
  const signedMonthly = wonDeals.reduce((s, d) => s + Number(d.monthly_amount), 0)

  const complete = async (id: string) => {
    setPending(ids => [...ids, id]); setError('')
    try {
      const { data, error } = await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id).select('id').single()
      if (error) setError(error.message)
      else if (data) setTasks(items => items.filter(x => x.id !== id))
    } catch { setError(copy('Connexion interrompue. Réessayez.', 'Connection interrupted. Please retry.')) }
    finally { setPending(ids => ids.filter(x => x !== id)) }
  }

  const TaskRow = ({ x }: { x: Task }) => (
    <div className="flex flex-wrap items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <button disabled={pending.includes(x.id)} aria-label={`${t('done')}: ${x.title}`} onClick={() => complete(x.id)} className="mt-0.5 text-neutral-300 hover:text-black" title={t('done')}><CheckCircle2 size={18} /></button>
      <div className="min-w-0 flex-1">
        <button className="text-sm font-medium text-left break-words hover:underline focus-visible:underline" onClick={() => setEditing(x)}>{x.title}</button>
        {x.description && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{x.description}</p>}
        <div className="text-xs text-slate-500 flex flex-wrap gap-x-2">
          {x.contact && <Link className="hover:underline" to={`/contacts/${x.contact.id}`}>{contactName(x.contact)}</Link>}
          {x.company && <Link className="hover:underline" to={`/companies/${x.company.id}`}>{x.company.name}</Link>}
          <OwnerName id={x.assignee_id} />
        </div>
      </div>
      <div className="text-xs text-slate-500 whitespace-nowrap">{x.due_at ? fmtDate(x.due_at, locale, true) : copy('À planifier', 'To schedule')}</div>
      {x.priority === 'urgent' && <Badge color="red">{t('prio_urgent')}</Badge>}
      {x.priority === 'high' && <Badge color="amber">{t('prio_high')}</Badge>}
    </div>
  )

  return (
    <div>
      <PageHeader title={copy('Vue d’ensemble', 'Overview')}>
        <button className="btn-secondary" disabled={loading} onClick={load}>{copy('Actualiser', 'Refresh')}</button>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> {t('mine')}</label>
        <button className="btn-primary" onClick={() => setEditing({})}><Plus size={16} /> {copy('Nouvelle mission', 'New task')}</button>
      </PageHeader>
      <p className="text-sm text-slate-500 mb-5">{onlyMine ? copy('Vue de vos éléments attribués.', 'Your assigned items.') : copy('Vue de toute l’équipe, y compris les éléments non attribués.', 'Whole-team overview, including unassigned items.')}</p>
      {error && <div role="alert" className="card p-3 mb-4 text-sm">{error}</div>}
      <ActionOverview tasks={tasks} deals={deals} contacts={allContacts} subscriptions={allSubs} loading={loading} failed={Boolean(error)} owner={onlyMine ? profile?.id : undefined} onEdit={setEditing} />
      <details className="planning-section"><summary>{copy('Planifier mes missions', 'Plan my tasks')}</summary><div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6" aria-label={copy('Filtrer les missions', 'Filter tasks')}>
        {[{ id: 'all', label: copy('Missions à faire', 'Tasks to do'), items: myTasks }, ...groups].map(g => (
          <button key={g.id} aria-pressed={filter === g.id} onClick={() => setFilter(g.id)} className={`rounded-xl border p-4 text-left transition-colors ${filter === g.id ? 'bg-black text-white border-black' : 'bg-white border-slate-200 hover:border-neutral-400'}`}>
            <div className="text-xs">{g.label}</div><div className="text-2xl font-semibold mt-2">{loading ? '—' : g.items.length}</div>
          </button>
        ))}
      </div>


      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex flex-wrap justify-between gap-3 mb-4">
            <h2 className="font-semibold flex items-center gap-2"><CalendarClock size={18} /> {copy('Missions à faire', 'Tasks to do')}</h2>
            <Link className="text-sm underline underline-offset-4" to="/tasks">{copy('Toutes les missions', 'All tasks')}</Link>
          </div>
          <input type="search" className="input mb-4" aria-label={copy('Rechercher une mission', 'Search tasks')} placeholder={copy('Rechercher une mission, un contact, une entreprise…', 'Search tasks, contacts, companies…')} value={search} onChange={e => setSearch(e.target.value)} />
          {loading ? <div role="status" className="py-8 text-center text-sm text-slate-500">{t('loading')}</div> : <>
            {visibleGroups.map(g => g.items.length > 0 && <section key={g.id} className="mb-5 last:mb-0">
              <h3 className="flex items-center justify-between bg-neutral-100 rounded-lg px-3 py-2 text-xs font-semibold"><span>{g.label}</span><span>{g.items.length}</span></h3>
              {g.items.map(x => <TaskRow key={x.id} x={x} />)}
            </section>)}
            {visibleGroups.every(g => g.items.length === 0) && <div className="py-8 text-center text-sm text-slate-500">{search || filter !== 'all' ? copy('Aucune mission pour ces filtres.', 'No tasks match these filters.') : t('no_tasks')}</div>}
          </>}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Inbox size={18} /> {t('recent_leads')}</h2>
            {leads.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
            {leads.map((c) => (
              <Link key={c.id} to={`/contacts/${c.id}`} className="block py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded">
                <div className="text-sm font-medium">{contactName(c)}</div>
                <div className="text-xs text-slate-500 flex gap-2">{c.company?.name}<Badge color="violet">{t(`src_${c.source}` as 'src_manual')}</Badge><span>{relTime(c.created_at, locale)}</span></div>
              </Link>
            ))}
          </div>
          <div className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle size={18} /> {t('untouched_leads')}</h2>
            {stale.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
            {stale.map((c) => (
              <Link key={c.id} to={`/contacts/${c.id}`} className="block py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded">
                <div className="text-sm font-medium">{contactName(c)}</div>
                <div className="text-xs text-slate-500">{c.company?.name} · {t('last_activity')}: {c.last_activity_at ? relTime(c.last_activity_at, locale) : '—'}</div>
              </Link>
            ))}
          </div>
          <div className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Repeat size={18} /> {t('upcoming_renewals')}</h2>
            {subs.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
            {subs.map((s) => (
              <div key={s.id} className="py-2 border-b border-slate-100 last:border-0 text-sm flex justify-between gap-2">
                <div><div className="font-medium">{s.name}</div><div className="text-xs text-slate-500">{s.company?.name}</div></div>
                <div className="text-right text-xs"><div>{fmtDate(s.renewal_date, locale)}</div><div className="text-slate-500">{fmtMoney(Number(s.monthly_amount), locale)}{t('per_month')}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </details><h2 className="font-semibold mt-8 mb-3">{copy('Vue commerciale', 'Business overview')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Stat label={t('overdue')} value={overdue.length} tone={overdue.length ? 'red' : undefined} />
        <Stat label={t('signed_total')} value={fmtMoney(signed, locale)} sub={`${wonDeals.length} ${t('won_deals')} · ${t('excl_vat')}`} tone="green" />
        <Stat label={t('signed_monthly')} value={`${fmtMoney(signedMonthly, locale)}${t('per_month')}`} sub={t('shown_separately')} />
        <Stat label={t('pipeline_value')} value={fmtMoney(pipelineValue, locale)} sub={`${fmtMoney(weighted, locale)} ${t('weighted')} · ${openDeals.length} ${t('open_deals').toLowerCase()} · ${t('estimates')}`} />
        <Stat label={t('mrr')} value={fmtMoney(mrr, locale)} sub={`${clients} ${t('active_clients').toLowerCase()}`} />
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={copy('Mission', 'Task')}>
        {editing && <TaskForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      </Modal>

    </div>
  )
}
