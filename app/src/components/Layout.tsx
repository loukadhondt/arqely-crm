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
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white text-black font-medium' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
          <n.icon size={18} /> {n.label}
        </NavLink>
      ))}
    </nav>
  )
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-black text-white p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-white text-black grid place-items-center font-bold">A</div>
          <div><div className="font-semibold leading-tight">Arqely CRM</div><div className="text-[11px] text-neutral-400">Neo Move devient Arqely</div></div>
        </div>
        <Nav />
        <div className="mt-auto pt-4 border-t border-neutral-800 text-xs">
          <div className="px-2 text-neutral-300 truncate">{profile?.full_name ?? profile?.email} <span className="text-neutral-500">· {profile?.role === 'owner' ? 'admin' : (locale === 'fr' ? 'membre' : 'member')}</span></div>
          <div className="flex items-center justify-between px-2 mt-2">
            <div className="flex gap-1">
              {(['fr', 'en'] as const).map((l) => (
                <button key={l} onClick={() => setLocale(l)} className={`px-2 py-0.5 rounded ${locale === l ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-white'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button className="text-neutral-400 hover:text-white flex items-center gap-1" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> {t('logout')}</button>
          </div>
        </div>
      </aside>
      <div className="md:hidden bg-black text-white p-3 flex items-center justify-between">
        <div className="font-semibold">Arqely CRM</div>
        <button onClick={() => setOpen(!open)}><Menu /></button>
      </div>
      {open && <div className="md:hidden bg-black p-3"><Nav /><button className="mt-3 text-neutral-400 text-sm flex items-center gap-1" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> {t('logout')}</button></div>}
      <main className="flex-1 min-w-0 p-4 md:p-8"><Outlet /></main>
    </div>
  )
}
