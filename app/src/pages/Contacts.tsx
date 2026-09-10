import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, relTime } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { contactName, type Contact, type Company, type ContactStatus } from '../lib/types'
import { PageHeader, Modal, Field, Badge, Empty, OwnerSelect, OwnerName } from '../components/ui'

export const statusColor: Record<ContactStatus, 'blue' | 'amber' | 'green' | 'slate'> = { lead: 'blue', prospect: 'amber', client: 'green', lost: 'slate' }
const SOURCES = ['manual', 'framer', 'calcom', 'email', 'referral', 'ads', 'other']

export function ContactForm({ initial, onSaved, onClose }: { initial?: Partial<Contact>; onSaved: (c: Contact) => void; onClose: () => void }) {
  const { t } = useT(); const { profile } = useAuth()
  const [f, setF] = useState<Partial<Contact>>({ status: 'lead', source: 'manual', tags: [], owner_id: profile?.id ?? null, ...initial })
  const [companies, setCompanies] = useState<Company[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { supabase.from('companies').select('*').order('name').then(({ data }) => setCompanies((data ?? []) as Company[])) }, [])
  const set = (k: keyof Contact, v: unknown) => setF({ ...f, [k]: v })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    const payload = {
      first_name: f.first_name || null, last_name: f.last_name || null, email: f.email?.trim().toLowerCase() || null, phone: f.phone || null,
      position: f.position || null, company_id: f.company_id || null, source: f.source ?? 'manual', status: f.status ?? 'lead',
      tags: f.tags ?? [], notes: f.notes || null, owner_id: f.owner_id ?? null,
    }
    const q = f.id ? supabase.from('contacts').update(payload).eq('id', f.id) : supabase.from('contacts').insert(payload)
    const { data, error } = await q.select('*, company:companies(id,name)').single()
    setBusy(false)
    if (error) { alert(error.message); return }
    onSaved(data as Contact)
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label={t('first_name')}><input className="input" value={f.first_name ?? ''} onChange={(e) => set('first_name', e.target.value)} /></Field>
      <Field label={t('last_name')}><input className="input" value={f.last_name ?? ''} onChange={(e) => set('last_name', e.target.value)} /></Field>
      <Field label={t('email')}><input className="input" type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
      <Field label={t('phone')}><input className="input" value={f.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field label={t('company')}>
        <select className="input" value={f.company_id ?? ''} onChange={(e) => set('company_id', e.target.value || null)}>
          <option value="">—</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label={t('position')}><input className="input" value={f.position ?? ''} onChange={(e) => set('position', e.target.value)} /></Field>
      <Field label={t('status')}>
        <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
          {(['lead', 'prospect', 'client', 'lost'] as const).map((s) => <option key={s} value={s}>{t(`status_${s}`)}</option>)}
        </select>
      </Field>
      <Field label={t('source')}>
        <select className="input" value={f.source} onChange={(e) => set('source', e.target.value)}>
          {SOURCES.map((s) => <option key={s} value={s}>{t(`src_${s}` as 'src_manual')}</option>)}
        </select>
      </Field>
      <Field label={t('owner')}><OwnerSelect value={f.owner_id ?? null} onChange={(v) => set('owner_id', v)} /></Field>
      <Field label={t('tags')}><input className="input" value={(f.tags ?? []).join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} /></Field>
      <Field label={t('notes')} className="col-span-2"><textarea className="input" rows={3} value={f.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('cancel')}</button>
        <button className="btn-primary" disabled={busy}>{t('save')}</button>
      </div>
    </form>
  )
}

export default function Contacts() {
  const { t, locale } = useT(); const nav = useNavigate()
  const [rows, setRows] = useState<Contact[]>([]); const [q, setQ] = useState(''); const [status, setStatus] = useState<string>('')
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(true)
  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('contacts').select('*, company:companies(id,name)').order('created_at', { ascending: false }).limit(500)
    setRows((data ?? []) as Contact[]); setLoading(false)
  }
  useEffect(() => { load() }, [])
  const filtered = rows.filter((c) => (!status || c.status === status) && (!q || `${contactName(c)} ${c.email ?? ''} ${c.phone ?? ''} ${c.company?.name ?? ''} ${c.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <div>
      <PageHeader title={t('contacts')}>
        <input className="input w-56" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('all')}</option>{(['lead', 'prospect', 'client', 'lost'] as const).map((s) => <option key={s} value={s}>{t(`status_${s}`)}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> {t('new')}</button>
      </PageHeader>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 bg-slate-50"><tr>
            <th className="px-4 py-2">{t('contact')}</th><th className="px-4 py-2">{t('company')}</th><th className="px-4 py-2">{t('status')}</th>
            <th className="px-4 py-2">{t('source')}</th><th className="px-4 py-2">{t('owner')}</th><th className="px-4 py-2">{t('last_activity')}</th>
          </tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => nav(`/contacts/${c.id}`)}>
                <td className="px-4 py-2"><div className="font-medium">{contactName(c)}</div><div className="text-xs text-slate-500">{c.email} {c.phone && `· ${c.phone}`}</div></td>
                <td className="px-4 py-2">{c.company ? <Link to={`/companies/${c.company.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{c.company.name}</Link> : '—'}</td>
                <td className="px-4 py-2"><Badge color={statusColor[c.status]}>{t(`status_${c.status}`)}</Badge></td>
                <td className="px-4 py-2 text-slate-500">{t(`src_${c.source}` as 'src_manual')}</td>
                <td className="px-4 py-2"><OwnerName id={c.owner_id} /></td>
                <td className="px-4 py-2 text-slate-500">{relTime(c.last_activity_at, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <Empty />}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('contact')}>
        <ContactForm onClose={() => setOpen(false)} onSaved={(c) => { setOpen(false); nav(`/contacts/${c.id}`) }} />
      </Modal>
    </div>
  )
}
