import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, ExternalLink, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, fmtMoney, fmtDate } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { contactName, type Company, type Contact, type Subscription, type Deal } from '../lib/types'
import { PageHeader, Modal, Field, Empty, OwnerSelect, OwnerName, Badge } from '../components/ui'
import { statusColor } from './Contacts'
import { SubForm, subColor } from './Subscriptions'

export function CompanyForm({ initial, onSaved, onClose }: { initial?: Partial<Company>; onSaved: (c: Company) => void; onClose: () => void }) {
  const { t } = useT(); const { profile } = useAuth()
  const [f, setF] = useState<Partial<Company>>({ country: 'BE', owner_id: profile?.id ?? null, ...initial })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof Company, v: unknown) => setF({ ...f, [k]: v })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!f.name?.trim()) return; setBusy(true)
    const payload = { name: f.name.trim(), industry: f.industry || null, website: f.website || null, phone: f.phone || null, email: f.email || null, address: f.address || null, city: f.city || null, country: f.country || null, google_maps_url: f.google_maps_url || null, notes: f.notes || null, owner_id: f.owner_id ?? null }
    const q = f.id ? supabase.from('companies').update(payload).eq('id', f.id) : supabase.from('companies').insert(payload)
    const { data, error } = await q.select('*').single(); setBusy(false)
    if (error) { alert(error.message); return }
    onSaved(data as Company)
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label={t('company')} className="col-span-2"><input className="input" value={f.name ?? ''} onChange={(e) => set('name', e.target.value)} required /></Field>
      <Field label={t('industry')}><input className="input" value={f.industry ?? ''} onChange={(e) => set('industry', e.target.value)} placeholder="Plombier, Électricien…" /></Field>
      <Field label={t('website')}><input className="input" value={f.website ?? ''} onChange={(e) => set('website', e.target.value)} /></Field>
      <Field label={t('phone')}><input className="input" value={f.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field label={t('email')}><input className="input" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
      <Field label={t('address')} className="col-span-2"><input className="input" value={f.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label={t('city')}><input className="input" value={f.city ?? ''} onChange={(e) => set('city', e.target.value)} /></Field>
      <Field label={t('country')}><input className="input" value={f.country ?? ''} onChange={(e) => set('country', e.target.value)} /></Field>
      <Field label={t('google_maps')} className="col-span-2"><input className="input" value={f.google_maps_url ?? ''} onChange={(e) => set('google_maps_url', e.target.value)} /></Field>
      <Field label={t('owner')}><OwnerSelect value={f.owner_id ?? null} onChange={(v) => set('owner_id', v)} /></Field>
      <Field label={t('notes')} className="col-span-2"><textarea className="input" rows={3} value={f.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div className="col-span-2 flex justify-end gap-2 pt-2"><button type="button" className="btn-secondary" onClick={onClose}>{t('cancel')}</button><button className="btn-primary" disabled={busy}>{t('save')}</button></div>
    </form>
  )
}

export default function Companies() {
  const { t } = useT(); const nav = useNavigate()
  const [rows, setRows] = useState<(Company & { contacts: { count: number }[]; subscriptions: { monthly_amount: number; status: string }[] })[]>([])
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(true)
  const load = async () => {
    const { data } = await supabase.from('companies').select('*, contacts(count), subscriptions(monthly_amount,status)').order('name')
    setRows((data ?? []) as typeof rows); setLoading(false)
  }
  useEffect(() => { load() }, [])
  const filtered = rows.filter((c) => !q || `${c.name} ${c.city ?? ''} ${c.industry ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const { locale } = useT()
  return (
    <div>
      <PageHeader title={t('companies')}>
        <input className="input w-56" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> {t('new')}</button>
      </PageHeader>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 bg-slate-50"><tr><th className="px-4 py-2">{t('company')}</th><th className="px-4 py-2">{t('industry')}</th><th className="px-4 py-2">{t('city')}</th><th className="px-4 py-2">{t('contacts')}</th><th className="px-4 py-2">MRR</th><th className="px-4 py-2">{t('owner')}</th></tr></thead>
          <tbody>{filtered.map((c) => (
            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => nav(`/companies/${c.id}`)}>
              <td className="px-4 py-2 font-medium">{c.name}</td><td className="px-4 py-2 text-slate-500">{c.industry ?? '—'}</td><td className="px-4 py-2 text-slate-500">{c.city ?? '—'}</td>
              <td className="px-4 py-2">{c.contacts?.[0]?.count ?? 0}</td>
              <td className="px-4 py-2">{fmtMoney(c.subscriptions.filter((s) => s.status === 'active').reduce((a, s) => a + Number(s.monthly_amount), 0), locale)}</td>
              <td className="px-4 py-2"><OwnerName id={c.owner_id} /></td>
            </tr>))}</tbody>
        </table>
        {!loading && filtered.length === 0 && <Empty />}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('company')}><CompanyForm onClose={() => setOpen(false)} onSaved={(c) => { setOpen(false); nav(`/companies/${c.id}`) }} /></Modal>
    </div>
  )
}

export function CompanyDetail() {
  const { id } = useParams(); const nav = useNavigate(); const { t, locale } = useT()
  const [c, setC] = useState<Company | null>(null); const [contacts, setContacts] = useState<Contact[]>([]); const [subs, setSubs] = useState<Subscription[]>([]); const [deals, setDeals] = useState<Deal[]>([])
  const [edit, setEdit] = useState(false); const [subOpen, setSubOpen] = useState(false)
  const load = async () => {
    const [a, b, s, d] = await Promise.all([
      supabase.from('companies').select('*').eq('id', id!).single(),
      supabase.from('contacts').select('*').eq('company_id', id!).order('created_at'),
      supabase.from('subscriptions').select('*, service:services(id,code,name_fr,name_en)').eq('company_id', id!).order('status'),
      supabase.from('deals').select('*').eq('company_id', id!).order('created_at', { ascending: false }),
    ])
    setC(a.data as Company); setContacts((b.data ?? []) as Contact[]); setSubs((s.data ?? []) as Subscription[]); setDeals((d.data ?? []) as Deal[])
  }
  useEffect(() => { load() }, [id])
  const del = async () => { if (!confirm(t('confirm_delete'))) return; await supabase.from('companies').delete().eq('id', id!); nav('/companies') }
  if (!c) return <div className="text-slate-400">{t('loading')}</div>
  const mrr = subs.filter((s) => s.status === 'active').reduce((a, s) => a + Number(s.monthly_amount), 0)
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="text-sm text-slate-500"><Link to="/companies" className="hover:underline">{t('companies')}</Link> /</div>
          <h1 className="text-2xl font-semibold">{c.name}</h1>
          <div className="text-sm text-slate-600 flex flex-wrap gap-2 mt-1 items-center">
            {c.industry && <Badge>{c.industry}</Badge>}{c.city && <span><MapPin size={12} className="inline" /> {c.city}</span>}
            {c.website && <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">{c.website} <ExternalLink size={12} /></a>}
            {c.google_maps_url && <a href={c.google_maps_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">Google Maps <ExternalLink size={12} /></a>}
            <OwnerName id={c.owner_id} />
          </div>
        </div>
        <div className="flex gap-2"><button className="btn-secondary" onClick={() => setEdit(true)}><Pencil size={16} /> {t('edit')}</button><button className="btn-danger" onClick={del}><Trash2 size={16} /></button></div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 text-sm space-y-1">
          <div><span className="text-slate-500">{t('phone')}:</span> {c.phone ?? '—'}</div>
          <div><span className="text-slate-500">{t('email')}:</span> {c.email ?? '—'}</div>
          <div><span className="text-slate-500">{t('address')}:</span> {[c.address, c.city, c.country].filter(Boolean).join(', ') || '—'}</div>
          <div><span className="text-slate-500">MRR:</span> <b>{fmtMoney(mrr, locale)}</b></div>
          {c.notes && <div className="pt-2 whitespace-pre-wrap text-slate-600">{c.notes}</div>}
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">{t('contacts_of')}</h2>
          {contacts.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
          {contacts.map((x) => <Link key={x.id} to={`/contacts/${x.id}`} className="block py-2 border-b border-slate-100 last:border-0 text-sm hover:bg-slate-50 -mx-2 px-2 rounded"><div className="font-medium flex items-center gap-2">{contactName(x)} <Badge color={statusColor[x.status]}>{t(`status_${x.status}`)}</Badge></div><div className="text-xs text-slate-500">{x.email} {x.phone && `· ${x.phone}`}</div></Link>)}
          <h2 className="font-semibold mb-2 mt-4">{t('deals_of')}</h2>
          {deals.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
          {deals.map((d) => <div key={d.id} className="text-sm py-1 flex justify-between"><span>{d.title}</span><Badge color={d.status === 'won' ? 'green' : d.status === 'lost' ? 'slate' : 'blue'}>{d.status}</Badge></div>)}
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2"><h2 className="font-semibold">{t('subs_of')}</h2><button className="btn-ghost text-xs" onClick={() => setSubOpen(true)}><Plus size={14} /> {t('add')}</button></div>
          {subs.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
          {subs.map((s) => <div key={s.id} className="py-2 border-b border-slate-100 last:border-0 text-sm"><div className="font-medium flex items-center gap-2">{s.name} <Badge color={subColor[s.status]}>{t(`sub_${s.status}`)}</Badge></div><div className="text-xs text-slate-500">{fmtMoney(Number(s.monthly_amount), locale)}{t('per_month')} {Number(s.one_off_amount) > 0 && `+ ${fmtMoney(Number(s.one_off_amount), locale)}`} · {t('renewal_date')}: {fmtDate(s.renewal_date, locale)}</div></div>)}
        </div>
      </div>
      <Modal open={edit} onClose={() => setEdit(false)} title={t('edit')}><CompanyForm initial={c} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); load() }} /></Modal>
      <Modal open={subOpen} onClose={() => setSubOpen(false)} title={t('subscription')}><SubForm initial={{ company_id: c.id }} onClose={() => setSubOpen(false)} onSaved={() => { setSubOpen(false); load() }} /></Modal>
    </div>
  )
}
