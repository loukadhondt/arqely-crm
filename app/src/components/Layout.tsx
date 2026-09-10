import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, KanbanSquare, CheckSquare, Repeat, Settings, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { useT } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const { t, locale, setLocale } = useT()
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/contacts', icon: Users, label: t('contacts') },
    { to: '/companies', icon: Building2, label: t('companies') },
    { to: '/pipeline', icon: KanbanSquare, label: t('pipeline') },
    { to: '/tasks', icon: CheckSquare, label: t('tasks') },
    { to: '/subscriptions', icon: Repeat, label: t('subscriptions') },
    { to: '/settings', icon: Settings, label: t('settings') },
  ]
  const Nav = () => (
    <nav className="flex flex-col gap-1">
      {nav.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
          <n.icon size={18} /> {n.label}
        </NavLink>
      ))}
    </nav>
  )
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-slate-950 text-white p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-brand grid place-items-center font-bold">A</div>
          <div><div className="font-semibold leading-tight">Arqely</div><div className="text-[11px] text-slate-400">CRM</div></div>
        </div>
        <Nav />
        <div className="mt-auto pt-4 border-t border-slate-800 text-xs">
          <div className="px-2 text-slate-400 truncate">{profile?.full_name ?? profile?.email}</div>
          <div className="flex items-center justify-between px-2 mt-2">
            <div className="flex gap-1">
              {(['fr', 'en'] as const).map((l) => (
                <button key={l} onClick={() => setLocale(l)} className={`px-2 py-0.5 rounded ${locale === l ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button className="text-slate-400 hover:text-white flex items-center gap-1" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> {t('logout')}</button>
          </div>
        </div>
      </aside>
      <div className="md:hidden bg-slate-950 text-white p-3 flex items-center justify-between">
        <div className="font-semibold">Arqely CRM</div>
        <button onClick={() => setOpen(!open)}><Menu /></button>
      </div>
      {open && <div className="md:hidden bg-slate-950 p-3"><Nav /><button className="mt-3 text-slate-400 text-sm flex items-center gap-1" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> {t('logout')}</button></div>}
      <main className="flex-1 min-w-0 p-4 md:p-8"><Outlet /></main>
    </div>
  )
}
