import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nProvider, useT } from './lib/i18n'
import { AuthProvider, useAuth } from './lib/auth'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Companies, { CompanyDetail } from './pages/Companies'
import Pipeline from './pages/Pipeline'
import Tasks from './pages/Tasks'
import Subscriptions from './pages/Subscriptions'
import Settings from './pages/Settings'

function Gate() {
  const { session, profile, loading } = useAuth(); const { t } = useT()
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-400">{t('loading')}</div>
  if (!session) return <Login />
  if (!profile?.is_active) return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card p-6 max-w-sm text-center space-y-3">
        <h1 className="font-semibold">{t('pending_title')}</h1>
        <p className="text-sm text-slate-500">{t('pending_body')}</p>
        <button className="btn-secondary" onClick={() => supabase.auth.signOut()}>{t('logout')}</button>
      </div>
    </div>
  )
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/:id" element={<ContactDetail />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <I18nProvider><AuthProvider><BrowserRouter basename={import.meta.env.BASE_URL}><Gate /></BrowserRouter></AuthProvider></I18nProvider>
  )
}
