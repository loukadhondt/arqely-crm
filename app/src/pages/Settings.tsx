import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { supabase, FUNCTIONS_URL } from '../lib/supabase'
import { useT, fmtDate } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import type { Profile, Service, InboundEvent } from '../lib/types'
import { PageHeader, Badge, CopyButton, Field } from '../components/ui'

export default function Settings() {
  const { t, locale, setLocale } = useT(); const { profile, refresh } = useAuth()
  const [members, setMembers] = useState<Profile[]>([]); const [settings, setSettings] = useState<Record<string, string>>({})
  const [services, setServices] = useState<Service[]>([]); const [events, setEvents] = useState<InboundEvent[]>([])
  const [name, setName] = useState(profile?.full_name ?? '')

  const load = async () => {
    const [m, s, sv, ev] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('app_settings').select('*'),
      supabase.from('services').select('*').order('name_fr'),
      supabase.from('inbound_events').select('*').order('created_at', { ascending: false }).limit(30),
    ])
    setMembers((m.data ?? []) as Profile[]); setSettings(Object.fromEntries(((s.data ?? []) as { key: string; value: string }[]).map((x) => [x.key, x.value])))
    setServices((sv.data ?? []) as Service[]); setEvents((ev.data ?? []) as InboundEvent[])
  }
  useEffect(() => { load() }, [])
  useEffect(() => { setName(profile?.full_name ?? '') }, [profile])

  const setActive = async (p: Profile, v: boolean) => { await supabase.from('profiles').update({ is_active: v }).eq('id', p.id); load(); refresh() }
  const saveSetting = async (key: string, value: string) => { await supabase.from('app_settings').upsert({ key, value }); load() }
  const rotate = async () => {
    if (!confirm(t('rotate_warn'))) return
    const bytes = crypto.getRandomValues(new Uint8Array(24)); const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
    await saveSetting('webhook_secret', hex)
  }
  const saveService = async (s: Service) => { await supabase.from('services').update({ name_fr: s.name_fr, name_en: s.name_en, default_price: s.default_price, billing: s.billing, is_active: s.is_active }).eq('id', s.id) }
  const saveProfile = async () => { if (!profile) return; await supabase.from('profiles').update({ full_name: name, locale }).eq('id', profile.id); refresh() }

  const hook = (source: string) => `${FUNCTIONS_URL}/inbound-lead?source=${source}&token=${settings.webhook_secret ?? ''}`
  const Hook = ({ source, title, help }: { source: string; title: string; help: string }) => (
    <div className="border border-slate-200 rounded-lg p-3">
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-slate-500 mt-1 mb-2">{help}</div>
      <div className="flex gap-2 items-center"><code className="text-xs bg-slate-100 rounded px-2 py-1 flex-1 truncate">{hook(source)}</code><CopyButton text={hook(source)} /></div>
    </div>
  )

  return (
    <div>
      <PageHeader title={t('settings')} />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold">{t('my_profile')}</h2>
          <Field label={t('full_name')}><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t('language')}><select className="input" value={locale} onChange={(e) => setLocale(e.target.value as 'fr' | 'en')}><option value="fr">Français</option><option value="en">English</option></select></Field>
          <button className="btn-primary" onClick={saveProfile}>{t('save')}</button>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">{t('team')}</h2>
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
              <div><div className="font-medium">{m.full_name ?? m.email}</div><div className="text-xs text-slate-500">{m.email} · {m.role}</div></div>
              <div className="flex items-center gap-2">
                <Badge color={m.is_active ? 'green' : 'slate'}>{m.is_active ? t('active') : t('inactive')}</Badge>
                {m.id !== profile?.id && <button className="btn-secondary text-xs" onClick={() => setActive(m, !m.is_active)}>{m.is_active ? t('deactivate') : t('activate')}</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="card p-5 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between"><h2 className="font-semibold">{t('integrations')}</h2><button className="btn-secondary text-xs" onClick={rotate}><RefreshCw size={14} /> {t('rotate_secret')}</button></div>
          <p className="text-xs text-slate-500">{t('integrations_help')}</p>
          <Hook source="framer" title={t('framer_hook')} help={t('framer_help')} />
          <Hook source="calcom" title={t('calcom_hook')} help={t('calcom_help')} />
          <Hook source="email" title={t('email_hook')} help={t('email_help')} />
          <Field label={t('default_owner')}>
            <div className="flex gap-2"><select className="input" value={settings.default_owner_email ?? ''} onChange={(e) => saveSetting('default_owner_email', e.target.value)}><option value="">{t('unassigned')}</option>{members.filter((m) => m.is_active).map((m) => <option key={m.id} value={m.email}>{m.full_name ?? m.email}</option>)}</select></div>
          </Field>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3">{t('services_catalog')}</h2>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                <input className="input col-span-4" value={s.name_fr} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, name_fr: e.target.value } : x))} onBlur={() => saveService(s)} />
                <input className="input col-span-3" value={s.name_en} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, name_en: e.target.value } : x))} onBlur={() => saveService(s)} />
                <input className="input col-span-2" type="number" value={s.default_price} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, default_price: Number(e.target.value) } : x))} onBlur={() => saveService(s)} />
                <select className="input col-span-2" value={s.billing} onChange={(e) => { const ns = { ...s, billing: e.target.value as Service['billing'] }; setServices(services.map((x) => x.id === s.id ? ns : x)); saveService(ns) }}><option value="monthly">{t('monthly')}</option><option value="one_off">{t('one_off')}</option></select>
                <input type="checkbox" className="col-span-1" checked={s.is_active} onChange={(e) => { const ns = { ...s, is_active: e.target.checked }; setServices(services.map((x) => x.id === s.id ? ns : x)); saveService(ns) }} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">{t('inbound_log')}</h2>
          {events.length === 0 && <div className="text-sm text-slate-400">{t('none')}</div>}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2"><Badge color="violet">{e.source}</Badge><span className="text-slate-500">{fmtDate(e.created_at, locale, true)}</span>{e.contact_id && <Link to={`/contacts/${e.contact_id}`} className="hover:underline">{t('contact')} →</Link>}</div>
                <div>{e.error ? <Badge color="red" >{t('failed')}: {e.error}</Badge> : e.processed ? <Badge color="green">{t('processed')}</Badge> : <Badge>…</Badge>}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
