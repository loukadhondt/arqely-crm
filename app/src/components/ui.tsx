import { useEffect, useState, type ReactNode } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { useT } from '../lib/i18n'
import { useAuth } from '../lib/auth'

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 overflow-y-auto" onMouseDown={onClose}>
      <div className={`card w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} mt-8`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn-ghost p-1" onClick={onClose} aria-label="close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><label className="label">{label}</label>{children}</div>
}

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'violet' }) {
  const map = {
    slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800', blue: 'bg-sky-100 text-sky-800', violet: 'bg-brand-light text-brand-dark',
  }
  return <span className={`badge ${map[color]}`}>{children}</span>
}

export function Empty({ text }: { text?: string }) {
  const { t } = useT()
  return <div className="text-center text-sm text-slate-400 py-10">{text ?? t('none')}</div>
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export function OwnerSelect({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { team } = useAuth(); const { t } = useT()
  return (
    <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{t('unassigned')}</option>
      {team.map((p) => <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>)}
    </select>
  )
}

export function OwnerName({ id }: { id: string | null }) {
  const { team } = useAuth(); const { t } = useT()
  const p = team.find((x) => x.id === id)
  return <span className="text-slate-500">{p ? (p.full_name ?? p.email) : t('unassigned')}</span>
}

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false); const { t } = useT()
  return (
    <button className="btn-secondary" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500) } catch { /* ignore */ } }}>
      {ok ? <Check size={14} /> : <Copy size={14} />} {ok ? t('copied') : t('copy')}
    </button>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'red' | 'amber' | 'green' }) {
  const toneCls = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : tone === 'green' ? 'text-emerald-600' : ''
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneCls}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}
