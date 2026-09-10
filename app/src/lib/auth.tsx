import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from './types'

type AuthState = { session: Session | null; profile: Profile | null; team: Profile[]; loading: boolean; refresh: () => Promise<void> }
const Ctx = createContext<AuthState>({ session: null, profile: null, team: [], loading: true, refresh: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [team, setTeam] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const load = async (s: Session | null) => {
    if (!s) { setProfile(null); setTeam([]); setLoading(false); return }
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    const list = (data ?? []) as Profile[]
    setTeam(list.filter((p) => p.is_active))
    setProfile(list.find((p) => p.id === s.user.id) ?? null)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); load(data.session) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); load(s) })
    return () => sub.subscription.unsubscribe()
  }, [])

  return <Ctx.Provider value={{ session, profile, team, loading, refresh: () => load(session) }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
