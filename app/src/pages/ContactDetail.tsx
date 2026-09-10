import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Mail, Phone, Pencil, Trash2, Plus, StickyNote, PhoneCall, Users, FileText, CalendarCheck, Cpu } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, fmtDate, fmtMoney } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { contactName, type Contact, type Activity, type ActivityType, type Deal, type Task, type Stage } from '../lib/types'
import { Modal, Badge, OwnerName, Empty } from '../components/ui'
import { ContactForm, statusColor } from './Contacts'
import { TaskForm } from './Tasks'
import { DealForm } from './Pipeline'

const icons: Record<ActivityType, typeof Mail> = { note: StickyNote, call: PhoneCall, email: Mail, meeting: Users, form: FileText, booking: CalendarCheck, system: Cpu }

export default function ContactDetail() {
  const { id } = useParams(); const nav = useNavigate(); const { t, locale } = useT(); const { profile } = useAuth()
  const [c, setC] = useState<Contact | null>(null)
  const [acts, setActs] = useState<Activity[]>([]); const [deals, setDeals] = useState<Deal[]>([]); const [tasks, setTasks] = useState<Task[]>([]); const [stages, setStages] = useState<Stage[]>([])
  const [edit, setEdit] = useState(false); const [taskOpen, setTaskOpen] = useState(false); const [dealOpen, setDealOpen] = useState(false)
  const [actType, setActType] = useState<ActivityType>('note'); const [actSubject, setActSubject] = useState(''); const [actBody, setActBody] = useState('')

  const load = async () => {
    const [a, b, d, tk, st] = await Promise.all([
      supabase.from('contacts').select('*, company:companies(id,name)').eq('id', id!).single(),
      supabase.from('activities').select('*').eq('contact_id', id!).order('occurred_at', { ascending: false }),
      supabase.from('deals').select('*').eq('contact_id', id!).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('contact_id', id!).order('status').order('due_at', { ascending: true, nullsFirst: false }),
      supabase.from('pipeline_stages').select('*').order('position'),
    ])
    setC(a.data as Contact); setActs((b.data ?? []) as Activity[]); setDeals((d.data ?? []) as Deal[]); setTasks((tk.data ?? []) as Task[]); setStages((st.data ?? []) as Stage[])
  }
  useEffect(() => { load() }, [id])

  const addActivity = async () => {
    if (!actBody.trim() && !actSubject.trim()) return
    await supabase.from('activities').insert({ type: actType, subject: actSubject || null, body: actBody || null, contact_id: id, company_id: c?.company_id ?? null, user_id: profile?.id ?? null })
    setActSubject(''); setActBody(''); load()
  }
  const del = async () => { if (!confirm(t('confirm_delete'))) return; await supabase.from('contacts').delete().eq('id', id!); nav('/contacts') }
  const toggleTask = async (tk: Task) => { await supabase.from('tasks').update(tk.status === 'done' ? { status: 'todo', completed_at: null } : { status: 'done', completed_at: new Date().toISOString() }).eq('id', tk.id); load() }

  if (!c) return <div className="text-slate-400">{t('loading')}</div>
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="text-sm text-slate-500"><Link to="/contacts" className="hover:underline">{t('contacts')}</Link> /</div>
          <h1 className="text-2xl font-semibold">{contactName(c)}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
            <Badge color={statusColor[c.status]}>{t(`status_${c.status}`)}</Badge>
            <Badge color="violet">{t(`src_${c.source}` as 'src_manual')}</Badge>
            {c.company && <Link to={`/companies/${c.company.id}`} className="hover:underline">{c.company.name}</Link>}
            {c.position && <span>· {c.position}</span>}
            <span>· <OwnerName id={c.owner_id} /></span>
            {c.tags.map((tg) => <Badge key={tg}>{tg}</Badge>)}
          </div>
        </div>
        <div className="flex gap-2">
          {c.email && <a className="btn-secondary" href={`mailto:${c.email}`}><Mail size={16} /> {t('write_email')}</a>}
          {c.phone && <a className="btn-secondary" href={`tel:${c.phone}`}><Phone size={16} /> {t('call')}</a>}
          <button className="btn-secondary" onClick={() => setEdit(true)}><Pencil size={16} /> {t('edit')}</button>
          <button className="btn-danger" onClick={del}><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="flex gap-2 mb-2 flex-wrap">
              {(['note', 'call', 'email', 'meeting'] as const).map((tp) => (
                <button key={tp} onClick={() => setActType(tp)} className={`btn text-xs ${actType === tp ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>{t(`log_${tp}`)}</button>
              ))}
            </div>
            <input className="input mb-2" placeholder={t('title')} value={actSubject} onChange={(e) => setActSubject(e.target.value)} />
            <textarea className="input" rows={3} placeholder={t('add_note')} value={actBody} onChange={(e) => setActBody(e.target.value)} />
            <div className="flex justify-end mt-2"><button className="btn-primary" onClick={addActivity}><Plus size={16} /> {t('add')}</button></div>
          </div>
          <div className="card p-4">
            <h2 className="font-semibold mb-3">{t('timeline')}</h2>
            {acts.length === 0 && <Empty />}
            <ol className="space-y-3">
              {acts.map((a) => { const Ic = icons[a.type]; return (
                <li key={a.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 grid place-items-center text-slate-500 shrink-0"><Ic size={15} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm"><span className="font-medium">{a.subject ?? t(`act_${a.type}` as 'act_form') ?? a.type}</span> <span className="text-xs text-slate-400 ml-2">{fmtDate(a.occurred_at, locale, true)}</span> {a.user_id && <span className="text-xs"><OwnerName id={a.user_id} /></span>}</div>
                    {a.body && <div className="text-sm text-slate-600 whitespace-pre-wrap mt-0.5">{a.body}</div>}
                  </div>
                </li>
              ) })}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 text-sm space-y-1">
            <div><span className="text-slate-500">{t('email')}:</span> {c.email ?? '—'}</div>
            <div><span className="text-slate-500">{t('phone')}:</span> {c.phone ?? '—'}</div>
            <div><span className="text-slate-500">{t('created')}:</span> {fmtDate(c.created_at, locale)}</div>
            {c.notes && <div className="pt-2 whitespace-pre-wrap text-slate-600">{c.notes}</div>}
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2"><h2 className="font-semibold">{t('deals_of')}</h2><button className="btn-ghost text-xs" onClick={() => setDealOpen(true)}><Plus size={14} /> {t('add')}</button></div>
            {deals.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
            {deals.map((d) => { const s = stages.find((x) => x.id === d.stage_id); return (
              <Link to="/pipeline" key={d.id} className="block py-2 border-b border-slate-100 last:border-0 text-sm hover:bg-slate-50 -mx-2 px-2 rounded">
                <div className="font-medium">{d.title}</div>
                <div className="text-xs text-slate-500 flex gap-2 items-center">
                  <Badge color={d.status === 'won' ? 'green' : d.status === 'lost' ? 'slate' : 'blue'}>{s ? (locale === 'fr' ? s.name_fr : s.name_en) : d.status}</Badge>
                  <span>{[Number(d.amount) > 0 ? fmtMoney(Number(d.amount), locale) : null, Number(d.monthly_amount) > 0 ? `${fmtMoney(Number(d.monthly_amount), locale)}${t('per_month')}` : null].filter(Boolean).join(' + ') || fmtMoney(0, locale)}</span>
                </div>
              </Link>
            ) })}
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2"><h2 className="font-semibold">{t('tasks_of')}</h2><button className="btn-ghost text-xs" onClick={() => setTaskOpen(true)}><Plus size={14} /> {t('add')}</button></div>
            {tasks.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
            {tasks.map((tk) => (
              <label key={tk.id} className="flex items-start gap-2 py-1.5 text-sm cursor-pointer">
                <input type="checkbox" checked={tk.status === 'done'} onChange={() => toggleTask(tk)} className="mt-1" />
                <div className={tk.status === 'done' ? 'line-through text-slate-400' : ''}>{tk.title}<div className="text-xs text-slate-500">{fmtDate(tk.due_at, locale, true)} · <OwnerName id={tk.assignee_id} /></div></div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <Modal open={edit} onClose={() => setEdit(false)} title={t('edit')}><ContactForm initial={c} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); load() }} /></Modal>
      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title={t('task')}><TaskForm initial={{ contact_id: c.id, company_id: c.company_id }} onClose={() => setTaskOpen(false)} onSaved={() => { setTaskOpen(false); load() }} /></Modal>
      <Modal open={dealOpen} onClose={() => setDealOpen(false)} title={t('deal')}><DealForm initial={{ contact_id: c.id, company_id: c.company_id, title: c.company?.name ?? contactName(c) }} onClose={() => setDealOpen(false)} onSaved={() => { setDealOpen(false); load() }} /></Modal>
    </div>
  )
}
