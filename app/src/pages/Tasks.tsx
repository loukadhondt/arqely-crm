import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, fmtDate, relTime } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { contactName, type Task, type Contact, type Company } from '../lib/types'
import { PageHeader, Modal, Field, OwnerSelect, OwnerName, Badge, Empty } from '../components/ui'

const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function TaskForm({ initial, onSaved, onClose }: { initial?: Partial<Task>; onSaved: (t: Task) => void; onClose: () => void }) {
  const { t } = useT(); const { profile } = useAuth()
  const [f, setF] = useState<Partial<Task>>({ priority: 'normal', assignee_id: profile?.id ?? null, ...initial })
  const [contacts, setContacts] = useState<Contact[]>([]); const [companies, setCompanies] = useState<Company[]>([]); const [busy, setBusy] = useState(false)
  useEffect(() => {
    supabase.from('contacts').select('id,first_name,last_name,email,company_id').order('first_name').then(({ data }) => setContacts((data ?? []) as Contact[]))
    supabase.from('companies').select('id,name').order('name').then(({ data }) => setCompanies((data ?? []) as Company[]))
  }, [])
  const set = (k: keyof Task, v: unknown) => setF({ ...f, [k]: v })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!f.title?.trim()) return; setBusy(true)
    const payload = { title: f.title.trim(), description: f.description || null, due_at: f.due_at ? new Date(f.due_at).toISOString() : null, priority: f.priority ?? 'normal', assignee_id: f.assignee_id ?? null, contact_id: f.contact_id || null, company_id: f.company_id || null, deal_id: f.deal_id || null, created_by: profile?.id ?? null }
    const q = f.id ? supabase.from('tasks').update(payload).eq('id', f.id) : supabase.from('tasks').insert(payload)
    const { data, error } = await q.select('*').single(); setBusy(false)
    if (error) { alert(error.message); return }
    onSaved(data as Task)
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label={t('title')} className="col-span-2"><input className="input" value={f.title ?? ''} onChange={(e) => set('title', e.target.value)} required autoFocus /></Field>
      <Field label={t('due')}><input className="input" type="datetime-local" value={toLocalInput(f.due_at)} onChange={(e) => set('due_at', e.target.value)} /></Field>
      <Field label={t('priority')}><select className="input" value={f.priority} onChange={(e) => set('priority', e.target.value)}>{(['low', 'normal', 'high', 'urgent'] as const).map((p) => <option key={p} value={p}>{t(`prio_${p}`)}</option>)}</select></Field>
      <Field label={t('assignee')}><OwnerSelect value={f.assignee_id ?? null} onChange={(v) => set('assignee_id', v)} /></Field>
      <Field label={t('contact')}><select className="input" value={f.contact_id ?? ''} onChange={(e) => { const c = contacts.find((x) => x.id === e.target.value); setF({ ...f, contact_id: e.target.value || null, company_id: f.company_id ?? c?.company_id ?? null }) }}><option value="">—</option>{contacts.map((c) => <option key={c.id} value={c.id}>{contactName(c)}</option>)}</select></Field>
      <Field label={t('company')}><select className="input" value={f.company_id ?? ''} onChange={(e) => set('company_id', e.target.value || null)}><option value="">—</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label={t('description')} className="col-span-2"><textarea className="input" rows={3} value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} /></Field>
      <div className="col-span-2 flex justify-end gap-2 pt-2"><button type="button" className="btn-secondary" onClick={onClose}>{t('cancel')}</button><button className="btn-primary" disabled={busy}>{t('save')}</button></div>
    </form>
  )
}

const prioColor = { low: 'slate', normal: 'blue', high: 'amber', urgent: 'red' } as const

export default function Tasks() {
  const { t, locale } = useT(); const { profile } = useAuth()
  const [rows, setRows] = useState<Task[]>([]); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Task | null>(null)
  const [showDone, setShowDone] = useState(false); const [onlyMine, setOnlyMine] = useState(false); const [loading, setLoading] = useState(true)
  const load = async () => {
    const { data } = await supabase.from('tasks').select('*, contact:contacts(id,first_name,last_name), company:companies(id,name)').order('status').order('due_at', { ascending: true, nullsFirst: false }).limit(500)
    setRows((data ?? []) as Task[]); setLoading(false)
  }
  useEffect(() => { load() }, [])
  const toggle = async (tk: Task) => { await supabase.from('tasks').update(tk.status === 'done' ? { status: 'todo', completed_at: null } : { status: 'done', completed_at: new Date().toISOString() }).eq('id', tk.id); load() }
  const del = async (tk: Task) => { if (!confirm(t('confirm_delete'))) return; await supabase.from('tasks').delete().eq('id', tk.id); setEditing(null); load() }
  const list = rows.filter((x) => (showDone || x.status === 'todo') && (!onlyMine || x.assignee_id === profile?.id))
  const now = Date.now()
  return (
    <div>
      <PageHeader title={t('tasks')}>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> {t('mine')}</label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> {t('show_done')}</label>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> {t('new')}</button>
      </PageHeader>
      <div className="card divide-y divide-slate-100">
        {list.map((x) => {
          const late = x.status === 'todo' && x.due_at && new Date(x.due_at).getTime() < now
          return (
            <div key={x.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
              <input type="checkbox" className="mt-1" checked={x.status === 'done'} onChange={() => toggle(x)} />
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditing(x)}>
                <div className={`text-sm font-medium ${x.status === 'done' ? 'line-through text-slate-400' : ''}`}>{x.title}</div>
                {x.description && <div className="text-xs text-slate-500 truncate">{x.description}</div>}
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-2 mt-0.5">
                  {x.contact && <Link to={`/contacts/${x.contact.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{contactName(x.contact)}</Link>}
                  {x.company && <Link to={`/companies/${x.company.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{x.company.name}</Link>}
                  <OwnerName id={x.assignee_id} />
                </div>
              </div>
              <Badge color={prioColor[x.priority]}>{t(`prio_${x.priority}`)}</Badge>
              <div className={`text-xs whitespace-nowrap ${late ? 'text-black font-semibold underline underline-offset-2' : 'text-neutral-500'}`} title={fmtDate(x.due_at, locale, true)}>{x.due_at ? relTime(x.due_at, locale) : ''}</div>
            </div>
          )
        })}
        {!loading && list.length === 0 && <Empty text={t('no_tasks')} />}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('task')}><TaskForm onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load() }} /></Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={t('task')}>
        {editing && <><TaskForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} /><div className="mt-3 flex justify-start"><button className="btn-danger" onClick={() => del(editing)}><Trash2 size={14} /> {t('delete')}</button></div></>}
      </Modal>
    </div>
  )
}
