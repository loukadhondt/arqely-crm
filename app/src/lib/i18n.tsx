import { createContext, useContext, useState, type ReactNode } from 'react'

export type Locale = 'fr' | 'en'

const dict = {
  // nav
  dashboard: ['Tableau de bord', 'Dashboard'],
  contacts: ['Contacts', 'Contacts'],
  companies: ['Entreprises', 'Companies'],
  pipeline: ['Pipeline', 'Pipeline'],
  tasks: ['Tâches', 'Tasks'],
  subscriptions: ['Projets & abonnements', 'Projects & subscriptions'],
  settings: ['Paramètres', 'Settings'],
  logout: ['Se déconnecter', 'Sign out'],
  // auth
  login_title: ['Connexion à Arqely CRM', 'Sign in to Arqely CRM'],
  signup_title: ['Créer un compte', 'Create an account'],
  email: ['Email', 'Email'],
  password: ['Mot de passe', 'Password'],
  full_name: ['Nom complet', 'Full name'],
  sign_in: ['Se connecter', 'Sign in'],
  sign_up: ['Créer le compte', 'Create account'],
  no_account: ['Pas encore de compte ?', 'No account yet?'],
  have_account: ['Déjà un compte ?', 'Already have an account?'],
  check_email: ['Vérifiez votre boîte mail pour confirmer votre compte.', 'Check your inbox to confirm your account.'],
  pending_title: ['Compte en attente d’activation', 'Account pending activation'],
  pending_body: ['Un membre de l’équipe doit activer votre compte dans Paramètres → Équipe.', 'A team member must activate your account in Settings → Team.'],
  // common
  save: ['Enregistrer', 'Save'],
  cancel: ['Annuler', 'Cancel'],
  delete: ['Supprimer', 'Delete'],
  edit: ['Modifier', 'Edit'],
  add: ['Ajouter', 'Add'],
  new: ['Nouveau', 'New'],
  search: ['Rechercher…', 'Search…'],
  loading: ['Chargement…', 'Loading…'],
  none: ['Aucun élément', 'Nothing here yet'],
  confirm_delete: ['Supprimer définitivement ?', 'Delete permanently?'],
  all: ['Tous', 'All'],
  mine: ['Les miens', 'Mine'],
  owner: ['Responsable', 'Owner'],
  unassigned: ['Non assigné', 'Unassigned'],
  notes: ['Notes', 'Notes'],
  created: ['Créé le', 'Created'],
  open_link: ['Ouvrir', 'Open'],
  copy: ['Copier', 'Copy'],
  copied: ['Copié !', 'Copied!'],
  // dashboard
  todo_overview: ['Aperçu des choses à faire', 'What needs doing'],
  overdue: ['En retard', 'Overdue'],
  today: ['Aujourd’hui', 'Today'],
  this_week: ['Cette semaine', 'This week'],
  new_leads: ['Nouveaux leads (7 j)', 'New leads (7 d)'],
  open_deals: ['Affaires ouvertes', 'Open deals'],
  pipeline_value: ['Valeur du pipeline', 'Pipeline value'],
  mrr: ['MRR clients', 'Client MRR'],
  active_clients: ['Clients actifs', 'Active clients'],
  upcoming_renewals: ['Renouvellements à venir (30 j)', 'Upcoming renewals (30 d)'],
  recent_leads: ['Derniers leads entrants', 'Latest inbound leads'],
  untouched_leads: ['Leads sans suivi depuis 3 jours', 'Leads with no follow-up for 3 days'],
  no_tasks: ['Rien à faire — bravo !', 'Nothing to do — nice!'],
  // contacts
  contact: ['Contact', 'Contact'],
  first_name: ['Prénom', 'First name'],
  last_name: ['Nom', 'Last name'],
  phone: ['Téléphone', 'Phone'],
  position: ['Poste', 'Position'],
  company: ['Entreprise', 'Company'],
  source: ['Source', 'Source'],
  status: ['Statut', 'Status'],
  tags: ['Tags (séparés par des virgules)', 'Tags (comma separated)'],
  last_activity: ['Dernière activité', 'Last activity'],
  status_lead: ['Lead', 'Lead'], status_prospect: ['Prospect', 'Prospect'], status_client: ['Client', 'Client'], status_lost: ['Perdu', 'Lost'],
  src_manual: ['Manuel', 'Manual'], src_framer: ['Site web', 'Website'], src_calcom: ['RDV cal.com', 'cal.com booking'], src_email: ['Email', 'Email'], src_referral: ['Recommandation', 'Referral'], src_ads: ['Publicité', 'Ads'], src_other: ['Autre', 'Other'],
  activity: ['Activité', 'Activity'],
  timeline: ['Historique', 'Timeline'],
  add_note: ['Ajouter une note', 'Add a note'],
  log_call: ['Appel', 'Call'], log_email: ['Email', 'Email'], log_meeting: ['Réunion', 'Meeting'], log_note: ['Note', 'Note'],
  act_form: ['Formulaire site', 'Website form'], act_booking: ['RDV réservé', 'Booking'], act_system: ['Système', 'System'],
  deals_of: ['Affaires', 'Deals'],
  tasks_of: ['Tâches', 'Tasks'],
  write_email: ['Écrire un email', 'Write email'],
  call: ['Appeler', 'Call'],
  // companies
  industry: ['Secteur', 'Industry'],
  website: ['Site web', 'Website'],
  address: ['Adresse', 'Address'],
  city: ['Ville', 'City'],
  country: ['Pays', 'Country'],
  google_maps: ['Lien Google Maps / Fiche GBP', 'Google Maps / GBP link'],
  contacts_of: ['Contacts', 'Contacts'],
  subs_of: ['Services actifs', 'Active services'],
  // pipeline
  deal: ['Affaire', 'Deal'],
  title: ['Titre', 'Title'],
  amount: ['Montant unique (€)', 'One-off amount (€)'],
  monthly_amount: ['Montant mensuel (€)', 'Monthly amount (€)'],
  expected_close: ['Clôture prévue', 'Expected close'],
  stage: ['Étape', 'Stage'],
  mark_won: ['Marquer signé', 'Mark won'],
  mark_lost: ['Marquer perdu', 'Mark lost'],
  lost_reason: ['Raison de la perte', 'Lost reason'],
  reopen: ['Réouvrir', 'Reopen'],
  per_month: ['/mois', '/mo'],
  weighted: ['pondéré', 'weighted'],
  show_closed: ['Afficher signés/perdus', 'Show won/lost'],
  // tasks
  task: ['Tâche', 'Task'],
  due: ['Échéance', 'Due'],
  priority: ['Priorité', 'Priority'],
  assignee: ['Assigné à', 'Assignee'],
  description: ['Description', 'Description'],
  prio_low: ['Basse', 'Low'], prio_normal: ['Normale', 'Normal'], prio_high: ['Haute', 'High'], prio_urgent: ['Urgente', 'Urgent'],
  done: ['Terminée', 'Done'], todo: ['À faire', 'To do'],
  show_done: ['Afficher terminées', 'Show done'],
  linked_to: ['Lié à', 'Linked to'],
  // subscriptions
  subscription: ['Projet / abonnement', 'Project / subscription'],
  service: ['Service', 'Service'],
  start_date: ['Début', 'Start'],
  end_date: ['Fin', 'End'],
  renewal_date: ['Prochain renouvellement', 'Next renewal'],
  one_off_amount: ['Montant unique (€)', 'One-off amount (€)'],
  sub_active: ['Actif', 'Active'], sub_paused: ['En pause', 'Paused'], sub_cancelled: ['Résilié', 'Cancelled'], sub_completed: ['Terminé', 'Completed'],
  total_mrr: ['MRR total', 'Total MRR'],
  total_one_off: ['Montants uniques', 'One-off total'],
  // settings
  team: ['Équipe', 'Team'],
  activate: ['Activer', 'Activate'],
  deactivate: ['Désactiver', 'Deactivate'],
  active: ['Actif', 'Active'],
  inactive: ['Inactif', 'Inactive'],
  integrations: ['Intégrations site web', 'Website integrations'],
  integrations_help: ['Ces URLs reçoivent automatiquement les leads. Ne partagez le jeton avec personne.', 'These URLs receive leads automatically. Keep the token private.'],
  framer_hook: ['Formulaire Framer (neomove.ai)', 'Framer form (neomove.ai)'],
  framer_help: ['Framer → Formulaire → Paramètres → Webhook : collez cette URL. Champs reconnus : Name, Email, Phone, Business/Company, Website, City, Message.', 'Framer → Form → Settings → Webhook: paste this URL. Recognised fields: Name, Email, Phone, Business/Company, Website, City, Message.'],
  calcom_hook: ['Réservation cal.com (audit gratuit)', 'cal.com booking (free audit)'],
  calcom_help: ['cal.com → Settings → Developer → Webhooks → New : URL ci-dessous, événements « Booking created » et « Booking rescheduled ».', 'cal.com → Settings → Developer → Webhooks → New: URL below, events "Booking created" and "Booking rescheduled".'],
  email_hook: ['Emails entrants (contact@neomove.ai)', 'Inbound emails (contact@neomove.ai)'],
  email_help: ['Via Zapier/Make : déclencheur « Nouvel email Gmail » → action « Webhook POST (JSON) » vers cette URL avec les champs from, subject, text.', 'Via Zapier/Make: trigger "New Gmail email" → action "Webhook POST (JSON)" to this URL with fields from, subject, text.'],
  default_owner: ['Responsable par défaut des nouveaux leads (email)', 'Default owner for new leads (email)'],
  rotate_secret: ['Régénérer le jeton', 'Rotate token'],
  rotate_warn: ['Vous devrez mettre à jour les URLs dans Framer, cal.com et Zapier.', 'You will need to update the URLs in Framer, cal.com and Zapier.'],
  services_catalog: ['Catalogue de services', 'Service catalogue'],
  default_price: ['Prix par défaut (€)', 'Default price (€)'],
  billing: ['Facturation', 'Billing'],
  monthly: ['Mensuel', 'Monthly'], one_off: ['Unique', 'One-off'],
  inbound_log: ['Journal des leads entrants', 'Inbound lead log'],
  processed: ['Traité', 'Processed'],
  failed: ['Erreur', 'Failed'],
  language: ['Langue', 'Language'],
  my_profile: ['Mon profil', 'My profile'],
} as const

export type TKey = keyof typeof dict

const Ctx = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (k: TKey) => string }>({
  locale: 'fr', setLocale: () => {}, t: (k) => dict[k]?.[0] ?? k,
})

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const stored = (() => { try { return localStorage.getItem('arqely_locale') as Locale | null } catch { return null } })()
  const [locale, setLocaleState] = useState<Locale>(initial ?? stored ?? 'fr')
  const setLocale = (l: Locale) => { setLocaleState(l); try { localStorage.setItem('arqely_locale', l) } catch { /* ignore */ } }
  const t = (k: TKey) => dict[k]?.[locale === 'fr' ? 0 : 1] ?? k
  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>
}

export const useT = () => useContext(Ctx)

export const fmtMoney = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-BE' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
export const fmtDate = (d: string | null | undefined, locale: Locale, withTime = false) => {
  if (!d) return '—'
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-BE' : 'en-GB', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(d))
}
export const relTime = (d: string | null | undefined, locale: Locale) => {
  if (!d) return '—'
  const diff = (new Date(d).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}
