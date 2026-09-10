import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, fmtMoney, fmtDate } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { contactName, type Subscription, type Service, type Company, type Contact } from '../lib/types'
import { PageHeader, Modal, Field, OwnerSelect, OwnerName, Badge, Empty, Stat } from '../components/ui'

export const subColor = { active: 'green', paused: 'amber', cancelled: 'slate', completed: 'blue' } as const

export function SubForm({ initial, onSaved, onClose }: { initial?: Partial<Subscription>; onSaved: (s: Subscription) => void; onClose: () => void }) {
  const { t, locale } = useT(); const { profile } = useAuth()
  const [f, setF] = useState<Partial<Subscription>>({ status: 'active', monthly_amount: 0, one_off_amount: 0, start_date: new Date().toISOString().slice(0, 10), owner_id: profile?.id ?? null, ...initial })
  const [services, setServices] = useState<Service[]>([]); const [companies, setCompanies] = useState<Company[]>([]); const [contacts, setContacts] = useState<Contact[]>([]); const [busy, setBusy] = useState(false)
  useEffect(() => {
    supabase.from('services').select('*').eq('is_active', true).order('name_fr').then(({ data }) => setServices((data ?? []) as Service[]))
    supabase.from('companies').select('id,name').order('name').then(({ data }) => setCompanies((data ?? []) as Company[]))
    supabase.from('contacts').select('id,first_name,last_name,email,company_id').order('first_name').then(({ data }) => setContacts((data ?? []) as Contact[]))
  }, [])
  const set = (k: keyof Subscription, v: unknown) => setF({ ...f, [k]: v })
  const pickService = (id: string) => {
    const s = services.find((x) => x.id === id)
    if (!s) { set('service_id', null); return }
    const start = f.start_date ? new Date(f.start_date) : new Date(); const renew = new Date(start); renew.setMonth(renew.getMonth() + 1)
    setF({ ...f, service_id: id, name: f.name || (locale === 'fr' ? s.name_fr : s.name_en), monthly_amount: s.billing === 'monthly' ? s.default_price : f.monthly_amount, one_off_amount: s.billing === 'one_off' ? s.default_price : f.one_off_amount, renewal_date: s.billing === 'monthly' ? renew.toISOString().slice(0, 10) : f.renewal_date })
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!f.name?.trim()) return; setBusy(true)
    const payload = { name: f.name.trim(), company_id: f.company_id || null, contact_id: f.contact_id || null, service_id: f.service_id || null, status: f.status ?? 'active', monthly_amount: Number(f.monthly_amount) || 0, one_off_amount: Number(f.one_off_amount) || 0, start_date: f.start_date || new Date().toISOString().slice(0, 10), end_date: f.end_date || null, renewal_date: f.renewal_date || null, notes: f.notes || null, owner_id: f.owner_id ?? null }
    const q = f.id ? supabase.from('subscriptions').update(payload).eq('id', f.id) : supabase.from('subscriptions').insert(payload)
    const { data, error } = await q.select('*').single(); setBusy(false)
    if (error) { alert(error.message); return }
    if (payload.company_id && payload.status === 'active') await supabase.from('contacts').update({ status: 'client' }).eq('company_id', payload.company_id).neq('status', 'client')
    onSaved(data as Subscription)
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label={t('service')} className="col-span-2"><select className="input" value={f.service_id ?? ''} onChange={(e) => pickService(e.target.value)}><option value="">—</option>{services.map((s) => <option key={s.id} value={s.id}>{locale === 'fr' ? s.name_fr : s.name_en} · {fmtMoney(s.default_price, locale)}{s.billing === 'monthly' ? t('per_month') : ''}</option>)}</select></Field>
      <Field label={t('title')} className="col-span-2"><input className="input" value={f.name ?? ''} onChange={(e) => set('name', e.target.value)} required /></Field>
      <Field label={t('company')}><select className="input" value={f.company_id ?? ''} onChange={(e) => set('company_id', e.target.value || null)} required><option value="">—</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label={t('contact')}><select className="input" value={f.contact_id ?? ''} onChange={(e) => set('contact_id', e.target.value || null)}><option value="">—</option>{contacts.filter((c) => !f.company_id || c.company_id === f.company_id).map((c) => <option key={c.id} value={c.id}>{contactName(c)}</option>)}</select></Field>
      <Field label={t('monthly_amount')}><input className="input" type="number" step="0.01" value={f.monthly_amount ?? 0} onChange={(e) => set('monthly_amount', e.target.value)} /></Field>
      <Field label={t('one_off_amount')}><input className="input" type="number" step="0.01" value={f.one_off_amount ?? 0} onChange={(e) => set('one_off_amount', e.target.value)} /></Field>
      <Field label={t('status')}><select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>{(['active', 'paused', 'cancelled', 'completed'] as const).map((s) => <option key={s} value={s}>{t(`sub_${s}`)}</option>)}</select></Field>
      <Field label={t('owner')}><OwnerSelect value={f.owner_id ?? null} onChange={(v) => set('owner_id', v)} /></Field>
      <Field label={t('start_date')}><input className="input" type="date" value={f.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} /></Field>
      <Field label={t('renewal_date')}><input className="input" type="date" value={f.renewal_date ?? ''} onChange={(e) => set('renewal_date', e.target.value)} /></Field>
      <Field label={t('end_date')}><input className="input" type="date" value={f.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} /></Field>
      <Field label={t('notes')} className="col-span-2"><textarea className="input" rows={2} value={f.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div className="col-span-2 flex justify-end gap-2 pt-2"><button type="button" className="btn-secondary" onClick={onClose}>{t('cancel')}</button><button className="btn-primary" disabled={busy}>{t('save')}</button></div>
    </form>
  )
}

export default function Subscriptions() {
  const { t, locale } = useT()
  const [rows, setRows] = useState<Subscription[]>([]); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Subscription | null>(null); const [status, setStatus] = useState('active'); const [loading, setLoading] = useState(true)
  const load = async () => {
    const { data } = await supabase.from('subscriptions').select('*, company:companies(id,name), service:services(id,code,name_fr,name_en)').order('renewal_date', { ascending: true, nullsFirst: false })
    setRows((data ?? []) as Subscription[]); setLoading(false)
  }
  useEffect(() => { load() }, [])
  const del = async (s: Subscription) => { if (!confirm(t('confirm_delete'))) return; await supabase.from('subscriptions').delete().eq('id', s.id); setEditing(null); load() }
  const list = rows.filter((s) => !status || s.status === status)
  const active = rows.filter((s) => s.status === 'active')
  const mrr = active.reduce((a, s) => a + Number(s.monthly_amount), 0)
  const oneOff = rows.reduce((a, s) => a + Number(s.one_off_amount), 0)
  return (
    <div>
      <PageHeader title={t('subscriptions')}>
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{t('all')}</option>{(['active', 'paused', 'cancelled', 'completed'] as const).map((s) => <option key={s} value={s}>{t(`sub_${s}`)}</option>)}</select>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> {t('new')}</button>
      </PageHeader>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label={t('total_mrr')} value={fmtMoney(mrr, locale)} />
        <Stat label={t('active_clients')} value={new Set(active.map((s) => s.company_id)).size} />
        <Stat label={t('total_one_off')} value={fmtMoney(oneOff, locale)} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 bg-slate-50"><tr><th className="px-4 py-2">{t('subscription')}</th><th className="px-4 py-2">{t('company')}</th><th className="px-4 py-2">{t('status')}</th><th className="px-4 py-2">MRR</th><th className="px-4 py-2">{t('one_off')}</th><th className="px-4 py-2">{t('renewal_date')}</th><th className="px-4 py-2">{t('owner')}</th></tr></thead>
          <tbody>{list.map((s) => (
            <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setEditing(s)}>
              <td className="px-4 py-2 font-medium">{s.name}</td>
              <td className="px-4 py-2">{s.company ? <Link to={`/companies/${s.company.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{s.company.name}</Link> : '—'}</td>
              <td className="px-4 py-2"><Badge color={subColor[s.status]}>{t(`sub_${s.status}`)}</Badge></td>
              <td className="px-4 py-2">{fmtMoney(Number(s.monthly_amount), locale)}</td>
              <td className="px-4 py-2">{Number(s.one_off_amount) > 0 ? fmtMoney(Number(s.one_off_amount), locale) : '—'}</td>
              <td className="px-4 py-2 text-slate-500">{fmtDate(s.renewal_date, locale)}</td>
              <td className="px-4 py-2"><OwnerName id={s.owner_id} /></td>
            </tr>))}</tbody>
        </table>
        {!loading && list.length === 0 && <Empty />}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('subscription')}><SubForm onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load() }} /></Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={t('subscription')}>{editing && <><SubForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} /><div className="mt-3"><button className="btn-danger" onClick={() => del(editing)}><Trash2 size={14} /> {t('delete')}</button></div></>}</Modal>
    </div>
  )
}
