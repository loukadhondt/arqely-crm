import IntroScene from '../components/IntroScene'
import Brand from '../components/Brand'
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
    <div className="login-page">
      <aside className="login-story"><IntroScene /><div className="intro-brand"><Brand /></div><div className="intro-copy"><p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-7">{locale === 'fr' ? 'Votre espace de travail' : 'Your workspace'}</p><h2>{locale === 'fr' ? 'Moins de bruit. Plus de clarté.' : 'Less noise. More clarity.'}</h2><p className="text-neutral-400 text-sm leading-relaxed mt-7 max-w-sm">{locale === 'fr' ? 'Vos relations, vos projets et vos prochaines actions. Tout commence ici.' : 'Your relationships, projects and next steps. It all starts here.'}</p></div><p className="intro-footer text-xs">Arqely · {locale === 'fr' ? 'Espace équipe' : 'Team workspace'}</p></aside>
      <div className="login-form-side">
      <form onSubmit={submit} className="login-form">
        <div className="flex items-center justify-between">
          <Brand compact />
          <div className="flex gap-1 text-xs">{(['fr', 'en'] as const).map((l) => <button type="button" key={l} onClick={() => setLocale(l)} className={`px-2 py-0.5 rounded ${locale === l ? 'bg-black text-white' : 'text-neutral-500'}`}>{l.toUpperCase()}</button>)}</div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight !mt-10">{mode === 'in' ? t('login_title') : t('signup_title')}</h1><p className="text-xs text-neutral-500 -mt-2">Neo Move devient Arqely</p>
        {mode === 'up' && <Field label={t('full_name')}><input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></Field>}
        <Field label={t('email')}><input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label={t('password')}><input className="input" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} /></Field>
        {msg && <div className="text-sm text-black bg-neutral-100 border border-neutral-300 rounded-lg p-2">{msg}</div>}
        <button className="btn-primary w-full justify-center" disabled={busy}>{mode === 'in' ? t('sign_in') : t('sign_up')}</button>
        <button type="button" className="text-sm text-slate-500 hover:text-slate-800 w-full" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? t('no_account') : t('have_account')}
        </button>
      </form>
      </div>
    </div>
  )
}
