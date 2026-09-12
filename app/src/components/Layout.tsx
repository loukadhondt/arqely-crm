import Brand from './Brand'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, KanbanSquare, CheckSquare, Repeat, Settings, LogOut, Menu, X, Layers } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const { t, locale, setLocale } = useT()
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const copy = (fr: string, en: string) => locale === 'fr' ? fr : en
  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  const groups = [
    { label: copy('Espace de travail', 'Workspace'), items: [
      { to: '/', icon: LayoutDashboard, label: copy('Vue d’ensemble', 'Overview') },
      { to: '/tasks', icon: CheckSquare, label: t('tasks') },
      { to: '/subscriptions', icon: Repeat, label: t('subscriptions') },
    ] },
    { label: copy('Développement', 'Business'), items: [
      { to: '/pipeline', icon: KanbanSquare, label: t('pipeline') },
      { to: '/contacts', icon: Users, label: t('contacts') },
      { to: '/companies', icon: Building2, label: t('companies') },
      { to: '/offers', icon: Layers, label: copy('Nos offres', 'Our offers') },
    ] },
  ]
  const navItem = (n: typeof groups[number]['items'][number]) => <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}><n.icon size={18} strokeWidth={1.6} /><span>{n.label}</span></NavLink>
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">{copy('Aller au contenu', 'Skip to content')}</a>
    <header className="mobile-header"><Brand compact /><button className="btn-ghost" aria-label={copy('Menu de navigation', 'Navigation menu')} aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button></header>
    {open && <button className="sidebar-backdrop" aria-label={copy('Fermer le menu', 'Close menu')} onClick={() => setOpen(false)} />}
    <aside id="app-sidebar" className={`app-sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-brand"><Brand /></div>
      <nav aria-label={copy('Navigation principale', 'Main navigation')} className="space-y-7">{groups.map(group => <div key={group.label}><p className="nav-caption">{group.label}</p><div className="space-y-1">{group.items.map(navItem)}</div></div>)}</nav>
      <div className="sidebar-footer">
        {navItem({ to: '/settings', icon: Settings, label: t('settings') })}
        <div className="profile-block"><div className="profile-avatar">{(profile?.full_name ?? profile?.email ?? 'A').slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-medium">{profile?.full_name ?? profile?.email ?? 'Arqely'}</p><p className="text-[11px] text-neutral-500 mt-1">{profile?.role === 'owner' ? copy('Administrateur', 'Administrator') : copy('Équipe Arqely', 'Arqely team')}</p></div></div>
        <div className="flex items-center justify-between px-2"><div className="language-switch">{(['fr', 'en'] as const).map(l => <button key={l} aria-pressed={locale === l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>)}</div><button className="btn-ghost !px-2" aria-label={t('logout')} title={t('logout')} onClick={() => supabase.auth.signOut()}><LogOut size={16} /></button></div>
      </div>
    </aside>
    <main id="main-content" tabIndex={-1} className="app-main"><div className="workspace-content"><Outlet /></div></main>
  </div>
}
