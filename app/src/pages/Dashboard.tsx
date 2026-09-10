import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarClock, Inbox, Repeat, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, fmtMoney, fmtDate, relTime } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { contactName, type Task, type Deal, type Contact, type Subscription, type Stage } from '../lib/types'
import { PageHeader, Stat, Badge, OwnerName } from '../components/ui'

export default function Dashboard() {
  const { t, locale } = useT(); const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [deals, setDeals] = useState<Deal[]>([]); const [stages, setStages] = useState<Stage[]>([])
  const [leads, setLeads] = useState<Contact[]>([]); const [stale, setStale] = useState<Contact[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [onlyMine, setOnlyMine] = useState(false)

  const load = async () => {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
    const threeDaysAgo = new Date(Date.now() - 3 * 864e5).toISOString()
    const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
    const [tk, dl, st, ld, sl, sb] = await Promise.all([
      supabase.from('tasks').select('*, contact:contacts(id,first_name,last_name), company:companies(id,name)').eq('status', 'todo').order('due_at', { ascending: true, nullsFirst: false }).limit(200),
      supabase.from('deals').select('*, contact:contacts(id,first_name,last_name,email), company:companies(id,name)').in('status', ['open','won']),
      supabase.from('pipeline_stages').select('*').order('position'),
      supabase.from('contacts').select('*, company:companies(id,name)').gte('created_at', weekAgo).order('created_at', { ascending: false }).limit(10),
      supabase.from('contacts').select('*, company:companies(id,name)').eq('status', 'lead').or(`last_activity_at.is.null,last_activity_at.lt.${threeDaysAgo}`).lt('created_at', threeDaysAgo).order('created_at').limit(10),
      supabase.from('subscriptions').select('*, company:companies(id,name)').eq('status', 'active').lte('renewal_date', in30).order('renewal_date'),
    ])
    setTasks((tk.data ?? []) as Task[]); setDeals((dl.data ?? []) as Deal[]); setStages((st.data ?? []) as Stage[])
    setLeads((ld.data ?? []) as Contact[]); setStale((sl.data ?? []) as Contact[]); setSubs((sb.data ?? []) as Subscription[])
  }
  useEffect(() => { load() }, [])

  const [mrr, setMrr] = useState(0); const [clients, setClients] = useState(0)
  useEffect(() => {
    supabase.from('subscriptions').select('monthly_amount, company_id').eq('status', 'active').then(({ data }) => {
      setMrr((data ?? []).reduce((s, x) => s + Number(x.monthly_amount), 0))
      setClients(new Set((data ?? []).map((x) => x.company_id)).size)
    })
  }, [])

  const myTasks = onlyMine ? tasks.filter((x) => x.assignee_id === profile?.id) : tasks
  const now = new Date(); const endToday = new Date(now); endToday.setHours(23, 59, 59, 999)
  const endWeek = new Date(now); endWeek.setDate(now.getDate() + 7)
  const overdue = myTasks.filter((x) => x.due_at && new Date(x.due_at) < now)
  const today = myTasks.filter((x) => x.due_at && new Date(x.due_at) >= now && new Date(x.due_at) <= endToday)
  const week = myTasks.filter((x) => x.due_at && new Date(x.due_at) > endToday && new Date(x.due_at) <= endWeek)
  const noDate = myTasks.filter((x) => !x.due_at)

  const openDeals = deals.filter((d) => d.status === 'open')
  const wonDeals = deals.filter((d) => d.status === 'won')
  const pipelineValue = openDeals.reduce((s, d) => s + Number(d.amount), 0)
  const weighted = openDeals.reduce((s, d) => { const p = stages.find((x) => x.id === d.stage_id)?.probability ?? 0; return s + Number(d.amount) * p / 100 }, 0)
  const signed = wonDeals.reduce((s, d) => s + Number(d.amount), 0)
  const signedMonthly = wonDeals.reduce((s, d) => s + Number(d.monthly_amount), 0)

  const complete = async (id: string) => { await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id); load() }

  const TaskRow = ({ x }: { x: Task }) => (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <button onClick={() => complete(x.id)} className="mt-0.5 text-neutral-300 hover:text-black" title={t('done')}><CheckCircle2 size={18} /></button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{x.title}</div>
        <div className="text-xs text-slate-500 flex flex-wrap gap-x-2">
          {x.contact && <Link className="hover:underline" to={`/contacts/${x.contact.id}`}>{contactName(x.contact)}</Link>}
          {x.company && <Link className="hover:underline" to={`/companies/${x.company.id}`}>{x.company.name}</Link>}
          <OwnerName id={x.assignee_id} />
        </div>
      </div>
      <div className="text-xs text-slate-500 whitespace-nowrap">{x.due_at ? relTime(x.due_at, locale) : ''}</div>
      {x.priority === 'urgent' && <Badge color="red">{t('prio_urgent')}</Badge>}
      {x.priority === 'high' && <Badge color="amber">{t('prio_high')}</Badge>}
    </div>
  )

  return (
    <div>
      <PageHeader title={t('dashboard')}>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> {t('mine')}</label>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Stat label={t('overdue')} value={overdue.length} tone={overdue.length ? 'red' : undefined} />
        <Stat label={t('signed_total')} value={fmtMoney(signed, locale)} sub={`${wonDeals.length} ${t('won_deals')} · ${t('excl_vat')}`} tone="green" />
        <Stat label={t('signed_monthly')} value={`${fmtMoney(signedMonthly, locale)}${t('per_month')}`} sub={t('shown_separately')} />
        <Stat label={t('pipeline_value')} value={fmtMoney(pipelineValue, locale)} sub={`${fmtMoney(weighted, locale)} ${t('weighted')} · ${openDeals.length} ${t('open_deals').toLowerCase()} · ${t('estimates')}`} />
        <Stat label={t('mrr')} value={fmtMoney(mrr, locale)} sub={`${clients} ${t('active_clients').toLowerCase()}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><CalendarClock size={18} /> {t('todo_overview')}</h2>
          {myTasks.length === 0 && <div className="text-sm text-slate-400 py-6 text-center">{t('no_tasks')}</div>}
          {overdue.length > 0 && <><div className="text-xs font-bold text-black uppercase mt-2 tracking-wide">{t('overdue')}</div>{overdue.map((x) => <TaskRow key={x.id} x={x} />)}</>}
          {today.length > 0 && <><div className="text-xs font-semibold text-slate-500 uppercase mt-4">{t('today')}</div>{today.map((x) => <TaskRow key={x.id} x={x} />)}</>}
          {week.length > 0 && <><div className="text-xs font-semibold text-slate-500 uppercase mt-4">{t('this_week')}</div>{week.map((x) => <TaskRow key={x.id} x={x} />)}</>}
          {noDate.length > 0 && <><div className="text-xs font-semibold text-slate-500 uppercase mt-4">{t('todo')}</div>{noDate.slice(0, 8).map((x) => <TaskRow key={x.id} x={x} />)}</>}
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
    </div>
  )
}
