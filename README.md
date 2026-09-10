# Arqely CRM (ex-Neomove)

CRM interne bilingue FR/EN pour l'équipe Arqely, relié au site https://neomove.ai.

## Ce qui est déjà en place (rien à installer côté backend)

| Élément | Où |
|---|---|
| Base de données Postgres + Auth | Projet Supabase **arqely-crm** (`nbzudemlcxfanfysexna`, Francfort) |
| Webhook leads entrants | Edge Function `inbound-lead` (déployée) |
| Schéma SQL (référence) | `supabase/migrations/0001_schema.sql` |
| Code du webhook (référence) | `supabase/functions/inbound-lead/index.ts` |
| Application web | `app/` (React + Vite + Tailwind) |

Modules : Tableau de bord (aperçu des choses à faire), Contacts, Entreprises, Pipeline Kanban (drag & drop),
Tâches, Projets & abonnements (MRR, renouvellements), Paramètres (équipe, webhooks, catalogue de services, journal des leads).

## 1. Déployer l'application (5 min)

Le dossier `app/` est une SPA statique. Le plus simple : **Vercel** ou **Netlify** (gratuit).

```bash
cd app
cp .env.example .env        # clés déjà renseignées (clé publique, sans risque)
npm install
npm run build               # génère app/dist
```

- **Vercel** : importer le dossier `app` (ou le repo Git), framework « Vite », variables d'env `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (valeurs dans `.env.example`). `vercel.json` gère le routage.
- **Netlify** : build `npm run build`, publish `dist`. `public/_redirects` gère le routage.
- En local : `npm run dev` → http://localhost:5173

Ensuite, dans Supabase → Authentication → URL Configuration : **Site URL** = l'URL de votre CRM (ex. `https://crm.arqely.com`) pour que les emails de confirmation redirigent au bon endroit.
Optionnel : Authentication → Providers → Email → désactiver « Confirm email » pour éviter l'étape de confirmation.

## 2. Créer les comptes de l'équipe

1. Le **premier** compte créé (page « Créer un compte ») devient automatiquement *owner* et actif.
2. Louka et Yasin créent ensuite leur compte → ils apparaissent « Inactif » dans *Paramètres → Équipe* ; cliquez **Activer**.
3. Dans *Paramètres → Intégrations*, choisissez le **responsable par défaut** des nouveaux leads.

## 3. Relier le site neomove.ai

Toutes les URLs (avec jeton secret) sont affichées dans **Paramètres → Intégrations site web** avec un bouton *Copier*.

### Formulaire Framer
Framer → sélectionner le formulaire → panneau de droite → **Webhook** → coller l'URL `…?source=framer&token=…`.
Champs reconnus (insensibles à la casse) : Name / First name / Last name, Email, Phone, Business / Company, Website, City, Message.
→ crée l'entreprise + le contact, ouvre une affaire dans « Nouveau lead », ajoute une activité « Formulaire site web » et une tâche « Rappeler le lead » (échéance +24 h).

### Audit gratuit cal.com
cal.com → Settings → Developer → **Webhooks** → New webhook → Subscriber URL = `…?source=calcom&token=…`, événements **Booking Created** et **Booking Rescheduled**.
→ crée/complète le contact, place l'affaire dans « Audit planifié », activité « Audit gratuit réservé » avec date + lien visio, tâche « Préparer l'audit » (priorité haute, échéance = heure du RDV).

### Emails contact@neomove.ai
Via Zapier (ou Make) : déclencheur **Gmail – New Email** (boîte contact@) → action **Webhooks by Zapier – POST**, Payload type *json*, URL `…?source=email&token=…`, données : `from` = From, `subject` = Subject, `text` = Body Plain.
→ rattache l'email au contact existant (ou en crée un), activité « Email » et tâche « Répondre à l'email ».
Astuce : filtrez dans Zapier les emails internes (@neomove.ai / @arqely.*) pour ne pas créer de faux leads.

### Test rapide
```bash
curl -X POST "URL_FRAMER" -H "Content-Type: application/json" \
  -d '{"Name":"Test Client","Email":"test@example.com","Business":"Boulangerie Test","Message":"Bonjour"}'
```
Le lead apparaît dans *Contacts* et *Pipeline* ; le résultat est visible dans *Paramètres → Journal des leads entrants*.

## 4. Renommage Neomove → Arqely
L'application est déjà nommée Arqely. Quand le domaine change, il suffit de mettre à jour :
- les libellés des intégrations (`app/src/lib/i18n.tsx`, clés `framer_hook`, `email_hook`),
- la *Site URL* dans Supabase Auth.

## Sécurité
- RLS activé sur toutes les tables : seuls les comptes **activés** de l'équipe lisent/écrivent.
- Le webhook exige le jeton secret (régénérable dans Paramètres) ; un mauvais jeton = 401.
- La clé `VITE_SUPABASE_ANON_KEY` est publique par conception (protégée par RLS).
