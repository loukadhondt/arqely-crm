import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { Field } from '../components/ui'

export default function Login() {
  const { t, locale, setLocale } = useT()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [name, setName] = useState('')
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null)
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
      if (error) setMsg(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { data: { full_name: name } } })
      if (error) setMsg(error.message)
      else if (!data.session) setMsg(t('check_email'))
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="h-9 w-9 rounded-lg bg-brand text-white grid place-items-center font-bold">A</div><div className="font-semibold">Arqely CRM</div></div>
          <div className="flex gap-1 text-xs">{(['fr', 'en'] as const).map((l) => <button type="button" key={l} onClick={() => setLocale(l)} className={`px-2 py-0.5 rounded ${locale === l ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>{l.toUpperCase()}</button>)}</div>
        </div>
        <h1 className="text-lg font-semibold">{mode === 'in' ? t('login_title') : t('signup_title')}</h1>
        {mode === 'up' && <Field label={t('full_name')}><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>}
        <Field label={t('email')}><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label={t('password')}><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} /></Field>
        {msg && <div className="text-sm text-amber-700 bg-amber-50 rounded-lg p-2">{msg}</div>}
        <button className="btn-primary w-full justify-center" disabled={busy}>{mode === 'in' ? t('sign_in') : t('sign_up')}</button>
        <button type="button" className="text-sm text-slate-500 hover:text-slate-800 w-full" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? t('no_account') : t('have_account')}
        </button>
      </form>
    </div>
  )
}
