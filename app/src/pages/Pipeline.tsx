import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trophy, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useT, fmtMoney, fmtDate } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { contactName, type Deal, type Stage, type Contact, type Company } from '../lib/types'
import { PageHeader, Modal, Field, OwnerSelect, OwnerName, Badge } from '../components/ui'

export function DealForm({ initial, onSaved, onClose }: { initial?: Partial<Deal>; onSaved: (d: Deal) => void; onClose: () => void }) {
  const { t, locale } = useT(); const { profile } = useAuth()
  const [f, setF] = useState<Partial<Deal>>({ amount: 0, monthly_amount: 0, owner_id: profile?.id ?? null, ...initial })
  const [stages, setStages] = useState<Stage[]>([]); const [contacts, setContacts] = useState<Contact[]>([]); const [companies, setCompanies] = useState<Company[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    supabase.from('pipeline_stages').select('*').order('position').then(({ data }) => { const s = (data ?? []) as Stage[]; setStages(s); if (!f.stage_id && s[0]) setF((x) => ({ ...x, stage_id: s[0].id })) })
    supabase.from('contacts').select('id,first_name,last_name,email,company_id').order('first_name').then(({ data }) => setContacts((data ?? []) as Contact[]))
    supabase.from('companies').select('id,name').order('name').then(({ data }) => setCompanies((data ?? []) as Company[]))
  }, [])
  const set = (k: keyof Deal, v: unknown) => setF({ ...f, [k]: v })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!f.title?.trim() || !f.stage_id) return; setBusy(true)
    const payload = { title: f.title.trim(), contact_id: f.contact_id || null, company_id: f.company_id || null, stage_id: f.stage_id, amount: Number(f.amount) || 0, monthly_amount: Number(f.monthly_amount) || 0, expected_close: f.expected_close || null, owner_id: f.owner_id ?? null }
    const q = f.id ? supabase.from('deals').update(payload).eq('id', f.id) : supabase.from('deals').insert(payload)
    const { data, error } = await q.select('*').single(); setBusy(false)
    if (error) { alert(error.message); return }
    onSaved(data as Deal)
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label={t('title')} className="col-span-2"><input className="input" value={f.title ?? ''} onChange={(e) => set('title', e.target.value)} required /></Field>
      <Field label={t('contact')}><select className="input" value={f.contact_id ?? ''} onChange={(e) => { const c = contacts.find((x) => x.id === e.target.value); setF({ ...f, contact_id: e.target.value || null, company_id: f.company_id ?? c?.company_id ?? null }) }}><option value="">—</option>{contacts.map((c) => <option key={c.id} value={c.id}>{contactName(c)}</option>)}</select></Field>
      <Field label={t('company')}><select className="input" value={f.company_id ?? ''} onChange={(e) => set('company_id', e.target.value || null)}><option value="">—</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label={t('stage')}><select className="input" value={f.stage_id ?? ''} onChange={(e) => set('stage_id', e.target.value)}>{stages.map((s) => <option key={s.id} value={s.id}>{locale === 'fr' ? s.name_fr : s.name_en}</option>)}</select></Field>
      <Field label={t('expected_close')}><input className="input" type="date" value={f.expected_close ?? ''} onChange={(e) => set('expected_close', e.target.value)} /></Field>
      <Field label={t('amount')}><input className="input" type="number" step="0.01" value={f.amount ?? 0} onChange={(e) => set('amount', e.target.value)} /></Field>
      <Field label={t('monthly_amount')}><input className="input" type="number" step="0.01" value={f.monthly_amount ?? 0} onChange={(e) => set('monthly_amount', e.target.value)} /></Field>
      <Field label={t('owner')}><OwnerSelect value={f.owner_id ?? null} onChange={(v) => set('owner_id', v)} /></Field>
      <div className="col-span-2 flex justify-end gap-2 pt-2"><button type="button" className="btn-secondary" onClick={onClose}>{t('cancel')}</button><button className="btn-primary" disabled={busy}>{t('save')}</button></div>
    </form>
  )
}

export default function Pipeline() {
  const { t, locale } = useT()
  const [stages, setStages] = useState<Stage[]>([]); const [deals, setDeals] = useState<Deal[]>([])
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Deal | null>(null); const [dragId, setDragId] = useState<string | null>(null)
  const [showClosed, setShowClosed] = useState(false); const [lostFor, setLostFor] = useState<Deal | null>(null); const [lostReason, setLostReason] = useState('')

  const load = async () => {
    const [s, d] = await Promise.all([
      supabase.from('pipeline_stages').select('*').order('position'),
      supabase.from('deals').select('*, contact:contacts(id,first_name,last_name,email), company:companies(id,name)').order('position').order('created_at'),
    ])
    setStages((s.data ?? []) as Stage[]); setDeals((d.data ?? []) as Deal[])
  }
  useEffect(() => { load() }, [])

  const moveTo = async (dealId: string, stage: Stage) => {
    const patch: Partial<Deal> = { stage_id: stage.id }
    if (stage.is_won) { patch.status = 'won'; patch.closed_at = new Date().toISOString() }
    else if (stage.is_lost) { patch.status = 'lost'; patch.closed_at = new Date().toISOString() }
    else { patch.status = 'open'; patch.closed_at = null; patch.lost_reason = null }
    setDeals((ds) => ds.map((d) => (d.id === dealId ? { ...d, ...patch } : d)))
    await supabase.from('deals').update(patch).eq('id', dealId)
    if (stage.is_won) {
      const d = deals.find((x) => x.id === dealId)
      if (d?.contact_id) await supabase.from('contacts').update({ status: 'client' }).eq('id', d.contact_id)
      if (d?.contact_id) await supabase.from('activities').insert({ type: 'system', subject: locale === 'fr' ? `Affaire signée : ${d.title}` : `Deal won: ${d.title}`, contact_id: d.contact_id, company_id: d.company_id, deal_id: d.id })
    }
  }
  const markLost = async () => {
    if (!lostFor) return
    const stage = stages.find((s) => s.is_lost)!
    await supabase.from('deals').update({ stage_id: stage.id, status: 'lost', closed_at: new Date().toISOString(), lost_reason: lostReason || null }).eq('id', lostFor.id)
    if (lostFor.contact_id) await supabase.from('contacts').update({ status: 'lost' }).eq('id', lostFor.contact_id)
    setLostFor(null); setLostReason(''); load()
  }
  const del = async (d: Deal) => { if (!confirm(t('confirm_delete'))) return; await supabase.from('deals').delete().eq('id', d.id); setEditing(null); load() }

  const value = (d: Deal) => Number(d.amount) + Number(d.monthly_amount) * 12
  const visibleStages = stages.filter((s) => showClosed || (!s.is_won && !s.is_lost))
  const openTotal = deals.filter((d) => d.status === 'open').reduce((a, d) => a + value(d), 0)

  return (
    <div>
      <PageHeader title={t('pipeline')}>
        <span className="text-sm text-slate-500">{fmtMoney(openTotal, locale)} · {deals.filter((d) => d.status === 'open').length} {t('open_deals').toLowerCase()}</span>
        <label className="text-sm flex items-center gap-2 ml-2"><input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> {t('show_closed')}</label>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> {t('new')}</button>
      </PageHeader>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {visibleStages.map((s) => {
          const list = deals.filter((d) => d.stage_id === s.id)
          const total = list.reduce((a, d) => a + value(d), 0)
          return (
            <div key={s.id} className={`w-72 shrink-0 rounded-xl p-2 ${s.is_won ? 'bg-emerald-50' : s.is_lost ? 'bg-slate-100' : 'bg-slate-100/70'}`}
              onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) { moveTo(dragId, s); setDragId(null) } }}>
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <div className="text-sm font-semibold">{locale === 'fr' ? s.name_fr : s.name_en} <span className="text-slate-400 font-normal">({list.length})</span></div>
                <div className="text-xs text-slate-500">{fmtMoney(total, locale)}</div>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {list.map((d) => (
                  <div key={d.id} draggable onDragStart={() => setDragId(d.id)} onClick={() => setEditing(d)}
                    className="card p-3 cursor-grab active:cursor-grabbing hover:border-brand">
                    <div className="text-sm font-medium">{d.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {d.contact && <Link to={`/contacts/${d.contact.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{contactName(d.contact)}</Link>}
                      {d.company && <span> · {d.company.name}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="font-medium">{Number(d.amount) > 0 && fmtMoney(Number(d.amount), locale)}{Number(d.amount) > 0 && Number(d.monthly_amount) > 0 && ' + '}{Number(d.monthly_amount) > 0 && `${fmtMoney(Number(d.monthly_amount), locale)}${t('per_month')}`}</span>
                      <OwnerName id={d.owner_id} />
                    </div>
                    {d.expected_close && <div className="text-[11px] text-slate-400 mt-1">{t('expected_close')}: {fmtDate(d.expected_close, locale)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('deal')}><DealForm onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load() }} /></Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.title ?? ''}>
        {editing && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge color={editing.status === 'won' ? 'green' : editing.status === 'lost' ? 'slate' : 'blue'}>{editing.status}</Badge>
              {editing.status === 'open' && <>
                <button className="btn-secondary text-emerald-700" onClick={() => { moveTo(editing.id, stages.find((s) => s.is_won)!); setEditing(null) }}><Trophy size={14} /> {t('mark_won')}</button>
                <button className="btn-secondary" onClick={() => { setLostFor(editing); setEditing(null) }}><XCircle size={14} /> {t('mark_lost')}</button>
              </>}
              {editing.status !== 'open' && <button className="btn-secondary" onClick={() => { moveTo(editing.id, stages[0]); setEditing(null); load() }}><RotateCcw size={14} /> {t('reopen')}</button>}
              <button className="btn-danger ml-auto" onClick={() => del(editing)}><Trash2 size={14} /></button>
            </div>
            {editing.lost_reason && <div className="text-sm text-slate-500">{t('lost_reason')}: {editing.lost_reason}</div>}
            <DealForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
          </div>
        )}
      </Modal>
      <Modal open={!!lostFor} onClose={() => setLostFor(null)} title={t('mark_lost')}>
        <Field label={t('lost_reason')}><textarea className="input" rows={3} value={lostReason} onChange={(e) => setLostReason(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 mt-3"><button className="btn-secondary" onClick={() => setLostFor(null)}>{t('cancel')}</button><button className="btn-primary" onClick={markLost}>{t('save')}</button></div>
      </Modal>
    </div>
  )
}
