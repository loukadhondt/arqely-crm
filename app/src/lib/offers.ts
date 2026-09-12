export const offerFields = ['objective','deliverables','scope','monthly','excluded','client','acceptance','metrics'] as const
export type OfferCopy = { title: string } & Record<typeof offerFields[number], string>
export type Offer = { id: string; initialPrice: number | null; monthlyPrice: number | null; fr: OfferCopy; en: OfferCopy }
export const defaultOffers: Offer[] = [
  {
    "id": "website",
    "initialPrice": null,
    "monthlyPrice": null,
    "fr": {
      "title": "Site web",
      "objective": "Créer une présence professionnelle qui présente l’activité et transforme les visites en demandes de contact.",
      "deliverables": "Cadrage, arborescence, maquette, réalisation responsive, formulaire de contact, référencement technique de base, connexion du domaine et mise en ligne. Remise des accès et guide de prise en main.",
      "scope": "Base de forfait proposée : un site vitrine, jusqu’à 5 pages, une langue et 2 séries de retours regroupés. Textes et images fournis par le client. E-commerce, espace membre et fonctionnalités spécifiques à chiffrer séparément.",
      "monthly": "Option récurrente : suivi de disponibilité, maintenance adaptée à la plateforme, contrôle des formulaires et une petite mise à jour de contenu par mois, limitée à 30 minutes. Hébergement à préciser au devis.",
      "excluded": "Nom de domaine, licences et hébergement non inclus tant que le devis ne les mentionne pas. Pas de rédaction complète, traduction, shooting, nouvelle page ou refonte dans la maintenance.",
      "client": "Logo, identité, contenus validés, accès domaine/hébergement, coordonnées et textes légaux fournis ou validés par le client. Un interlocuteur regroupe les retours.",
      "acceptance": "Validation des pages convenues, affichage mobile/ordinateur, test du formulaire et des liens, puis accord avant publication. Le calendrier commence après réception des éléments.",
      "metrics": "Disponibilité, demandes issues du formulaire et taux de conversion si le suivi est configuré. Aucun volume de prospects ni classement garanti."
    },
    "en": {
      "title": "Website",
      "objective": "Build a professional presence that explains the business and converts visits into enquiries.",
      "deliverables": "Discovery, sitemap, design, responsive implementation, contact form, basic technical SEO, domain connection and launch. Access handover and quick-start guide.",
      "scope": "Proposed fixed scope: one brochure website, up to 5 pages, one language and 2 consolidated revision rounds. Client supplies text and images. E-commerce, member areas and custom features are scoped separately.",
      "monthly": "Recurring option: uptime monitoring, platform-appropriate maintenance, form checks and one small content update per month, capped at 30 minutes. Hosting arrangements specified in the quote.",
      "excluded": "Domain, licences and hosting excluded unless explicitly included in the quote. Maintenance excludes full copywriting, translation, photography, new pages and redesigns.",
      "client": "Logo, brand assets, approved content, domain/hosting access, contact details and client-approved legal text. One contact consolidates feedback.",
      "acceptance": "Approval of agreed pages, mobile/desktop checks, form and link tests, then sign-off before publication. Schedule starts once inputs are received.",
      "metrics": "Availability, form enquiries and conversion rate where tracking is configured. No guaranteed lead volume or ranking."
    }
  },
  {
    "id": "google_ads",
    "initialPrice": null,
    "monthlyPrice": null,
    "fr": {
      "title": "Google Ads",
      "objective": "Capter les recherches de personnes intéressées par les services du client et mesurer les demandes générées.",
      "deliverables": "Audit du compte, cadrage de la zone et du budget, recherche de mots-clés, exclusions, annonces Search, paramétrage et vérification du suivi des conversions.",
      "scope": "Base proposée : un compte Google Ads, une activité, une zone commerciale, jusqu’à 2 campagnes Search et 4 groupes d’annonces au total. Une langue. Autres formats sur chiffrage distinct.",
      "monthly": "Pilotage mensuel : contrôles hebdomadaires, analyse des termes de recherche, ajustement des enchères/budgets dans l’enveloppe validée, un test d’annonce par mois et bilan mensuel.",
      "excluded": "Budget publicitaire payé directement à Google. Création/refonte de landing page, flux Shopping, vidéo et outils tiers hors forfait. Aucun dépassement de budget convenu sans accord.",
      "client": "Compte détenu par le client, moyen de paiement, accès site/analytics, offre commerciale validée et définition de ce qui constitue un prospect qualifié.",
      "acceptance": "Validation des annonces et du budget avant diffusion ; test des conversions. Démarrage soumis aux validations et règles de la plateforme.",
      "metrics": "Dépenses, conversions mesurées, coût par demande et qualité des leads confirmée par le client. Le chiffre d’affaires nécessite un suivi des ventes ; aucun résultat garanti."
    },
    "en": {
      "title": "Google Ads",
      "objective": "Capture relevant search demand and measure resulting enquiries.",
      "deliverables": "Account audit, location and budget planning, keyword research, negative keywords, Search ads, conversion tracking setup and checks.",
      "scope": "Proposed scope: one Google Ads account, one business line, one target area, up to 2 Search campaigns and 4 ad groups in total. One language. Other formats quoted separately.",
      "monthly": "Monthly management: weekly checks, search-term review, bid/budget adjustments within approved spend, one ad test per month and monthly reporting.",
      "excluded": "Ad spend paid directly to Google. Landing-page creation/redesign, Shopping feeds, video and third-party tools excluded. No increase above agreed budget without approval.",
      "client": "Client-owned account, payment method, site/analytics access, approved commercial offer and agreed qualified-lead definition.",
      "acceptance": "Ads and budget approved before launch; conversion tests completed. Launch depends on platform approval and policies.",
      "metrics": "Spend, measured conversions, cost per enquiry and client-confirmed lead quality. Revenue requires sales tracking; outcomes are not guaranteed."
    }
  },
  {
    "id": "meta_ads",
    "initialPrice": null,
    "monthlyPrice": null,
    "fr": {
      "title": "Meta Ads",
      "objective": "Développer la demande sur Facebook et Instagram avec des campagnes et créations adaptées à l’offre du client.",
      "deliverables": "Audit Business Manager, vérification des accès, définition audiences/offre, configuration de campagnes et du suivi, adaptation de visuels fournis et rédaction des textes publicitaires.",
      "scope": "Base proposée : un compte, une offre, jusqu’à 2 campagnes et 4 ensembles de publicités au total ; 4 variations de créations statiques à partir des éléments fournis, une langue.",
      "monthly": "Contrôles hebdomadaires, optimisation audiences et diffusion, 2 nouvelles variations statiques par mois, suivi des demandes et rapport mensuel.",
      "excluded": "Budget publicitaire payé directement à Meta. Tournage, UGC, photographie, community management, réponses aux messages et création d’un site non inclus.",
      "client": "Accès au compte et aux pages, paiement actif, visuels exploitables avec droits, offre validée et équipe disponible pour répondre aux demandes.",
      "acceptance": "Validation des créations, audiences, budget et formulaire ou page de destination ; test du parcours avant activation.",
      "metrics": "Dépenses, coût par demande, taux de conversion et qualité des contacts. ROAS uniquement si achats/recettes correctement suivis. Aucun nombre de ventes garanti."
    },
    "en": {
      "title": "Meta Ads",
      "objective": "Generate demand on Facebook and Instagram with campaigns and creative matched to the client’s offer.",
      "deliverables": "Business Manager audit, access checks, audience/offer definition, campaign and tracking setup, adaptation of supplied assets and ad copywriting.",
      "scope": "Proposed scope: one account, one offer, up to 2 campaigns and 4 ad sets in total; 4 static creative variations from supplied assets, one language.",
      "monthly": "Weekly checks, audience/delivery optimisation, 2 new static variations per month, enquiry monitoring and monthly reporting.",
      "excluded": "Ad spend paid directly to Meta. Filming, UGC, photography, community management, inbox replies and website creation excluded.",
      "client": "Account/page access, active payment method, usable licensed assets, approved offer and someone available to handle enquiries.",
      "acceptance": "Approval of creative, audiences, budget and form or landing page; journey tested before activation.",
      "metrics": "Spend, cost per enquiry, conversion rate and contact quality. ROAS only when purchases/revenue are tracked correctly. No guaranteed sales volume."
    }
  },
  {
    "id": "ai_automation",
    "initialPrice": null,
    "monthlyPrice": null,
    "fr": {
      "title": "Automatisation IA",
      "objective": "Réduire une tâche répétitive grâce à un processus automatisé contrôlable, avec IA uniquement lorsqu’elle apporte une utilité.",
      "deliverables": "Cartographie du processus, règles métier, connexion des outils, configuration de l’automatisation, gestion des erreurs, tests sur exemples validés et documentation.",
      "scope": "Base proposée : un processus, jusqu’à 3 outils disposant d’API/connecteurs accessibles et 2 étapes utilisant l’IA. Exemples : qualifier une demande, préparer un brouillon ou mettre à jour un CRM. Volumes et exceptions à définir avant devis.",
      "monthly": "Contrôle des exécutions et erreurs, vérification mensuelle d’un échantillon de résultats et une modification mineure de règle par mois, limitée à 30 minutes.",
      "excluded": "Abonnements, consommation API/IA et SMS exclus. Nouveau processus, intégration sur mesure, migration massive et entraînement d’un modèle hors forfait. Aucun envoi externe autonome sans accord explicite.",
      "client": "Accès autorisés, données d’exemple, règles métier, volumes, outils et usages permis. Définir les données transmises aux fournisseurs, la conservation et les actions nécessitant une validation humaine.",
      "acceptance": "Scénarios de réussite et d’échec validés, reprise manuelle possible, journal d’exécution et validation humaine des sorties sensibles. Critères d’acceptation définis par processus.",
      "metrics": "Temps économisé mesuré, taux d’échec, corrections humaines nécessaires et coût par exécution. L’IA peut produire des erreurs ; aucun fonctionnement parfait promis."
    },
    "en": {
      "title": "AI automation",
      "objective": "Reduce a repetitive task through a controllable workflow, using AI only where useful.",
      "deliverables": "Process mapping, business rules, tool connections, workflow setup, error handling, tests against approved examples and documentation.",
      "scope": "Proposed scope: one workflow, up to 3 tools with accessible APIs/connectors and 2 AI steps. Examples: qualify an enquiry, prepare a draft or update a CRM. Volumes and exceptions agreed before quoting.",
      "monthly": "Run/error monitoring, monthly sample review and one minor rule adjustment per month, capped at 30 minutes.",
      "excluded": "Subscriptions, API/AI usage and SMS excluded. New workflows, custom integrations, bulk migrations and model training are separate. No autonomous external sending without explicit approval.",
      "client": "Authorised access, sample data, business rules, volumes, tools and permitted uses. Agree vendor data transfers, retention and actions requiring human approval.",
      "acceptance": "Approved success/failure scenarios, manual fallback, execution logs and human review for sensitive outputs. Acceptance criteria defined per workflow.",
      "metrics": "Measured time saved, failure rate, required human corrections and cost per run. AI can make mistakes; perfect operation is not promised."
    }
  },
  {
    "id": "branding",
    "initialPrice": null,
    "monthlyPrice": null,
    "fr": {
      "title": "Branding",
      "objective": "Construire une identité cohérente et reconnaissable pour l’activité du client.",
      "deliverables": "Atelier de positionnement, direction visuelle, logo principal et variantes, palette, typographies et mini-guide de marque. Exports adaptés au web et à l’impression.",
      "scope": "Base proposée : une marque, 2 pistes créatives puis développement d’une piste retenue, 2 séries de retours regroupés et guide jusqu’à 10 pages.",
      "monthly": "Option de continuité de marque : 2 adaptations mensuelles de supports existants à partir de textes fournis, une série de retours. Pas d’abonnement obligatoire si aucun besoin régulier.",
      "excluded": "Naming, dépôt de marque, recherche juridique, achat de polices, impression, packaging complexe, photo et vidéo hors forfait. Une nouvelle direction après validation demande un nouveau chiffrage.",
      "client": "Présentation de l’activité, public cible, concurrents, références et contraintes ; un décideur valide les étapes.",
      "acceptance": "Validation écrite de la piste retenue puis des fichiers finaux. Formats et droits d’utilisation définis au devis.",
      "metrics": "Livrables remis et cohérence des supports. Aucun impact commercial chiffré attribué au logo sans mesure."
    },
    "en": {
      "title": "Branding",
      "objective": "Build a consistent, recognisable identity for the client’s business.",
      "deliverables": "Positioning workshop, visual direction, primary logo and variants, palette, typography and mini brand guide. Web and print exports.",
      "scope": "Proposed scope: one brand, 2 creative directions then development of one chosen direction, 2 consolidated revision rounds and guide up to 10 pages.",
      "monthly": "Optional brand continuity: 2 monthly adaptations of existing assets using supplied copy, one revision round. No required subscription without recurring needs.",
      "excluded": "Naming, trademark registration, legal clearance, font purchases, printing, complex packaging, photography and video excluded. A new direction after approval requires a new quote.",
      "client": "Business description, audience, competitors, references and constraints; one decision maker approves milestones.",
      "acceptance": "Written approval of chosen direction and final files. Formats and usage rights specified in the quote.",
      "metrics": "Deliverables handed over and consistent application. No quantified commercial impact attributed to the logo without measurement."
    }
  },
  {
    "id": "apps",
    "initialPrice": null,
    "monthlyPrice": null,
    "fr": {
      "title": "Applications",
      "objective": "Créer une application qui répond à un besoin métier défini : portail client, outil interne, réservation ou service numérique.",
      "deliverables": "Cadrage fonctionnel, parcours, maquettes, développement, base de données si nécessaire, tests, déploiement et remise des accès/documentation.",
      "scope": "Base de forfait proposée : MVP web responsive jusqu’à 5 écrans principaux, une langue, un parcours métier et 2 rôles utilisateurs. Une intégration standard maximum. Application iOS/Android, paiement, temps réel ou migration à cadrer séparément.",
      "monthly": "Maintenance optionnelle : suivi technique, correctifs du périmètre livré et contrôle des sauvegardes si prévues. Évolutions sous forfait séparé avec liste de demandes et capacité mensuelle définies.",
      "excluded": "Hébergement, licences, consommation API et comptes stores exclus sauf mention explicite. Nouvelles fonctionnalités, support aux utilisateurs finaux et disponibilité 24/7 non inclus.",
      "client": "Référent métier, parcours prioritaires, exemples de données, accès aux outils et validation des droits/rôles. Plateforme, sécurité et données traitées définies avant chiffrage.",
      "acceptance": "Recette sur scénarios écrits, contrôle des droits d’accès, tests du parcours principal, traitement des anomalies bloquantes et validation avant production.",
      "metrics": "Utilisation, réussite des parcours, incidents et temps métier gagné. Délais et prix fixes après cadrage ; une app native complète n’est pas assimilée à ce MVP web."
    },
    "en": {
      "title": "Apps",
      "objective": "Build an application for a defined business need: client portal, internal tool, booking or digital service.",
      "deliverables": "Functional scoping, user journeys, designs, development, database if needed, testing, deployment and access/documentation handover.",
      "scope": "Proposed fixed scope: responsive web MVP with up to 5 main screens, one language, one business workflow and 2 user roles. At most one standard integration. iOS/Android, payments, real-time features and migration scoped separately.",
      "monthly": "Optional maintenance: technical monitoring, fixes within delivered scope and backup checks where included. Enhancements under a separate fixed package with agreed backlog and monthly capacity.",
      "excluded": "Hosting, licences, API usage and store accounts excluded unless stated. New features, end-user support and 24/7 availability excluded.",
      "client": "Business owner, priority journeys, sample data, tool access and role/permission approval. Platform, security and data handling agreed before quoting.",
      "acceptance": "Acceptance against written scenarios, access-control checks, core-journey tests, resolution of blocking issues and sign-off before production.",
      "metrics": "Usage, journey completion, incidents and business time saved. Fixed price and timeline follow scoping; a full native app is not equivalent to this web MVP."
    }
  }
]
export function validOffer(value: unknown, id: string): value is Offer {
 if (!value || typeof value !== 'object') return false
 const x = value as Offer
 return x.id === id && [x.initialPrice,x.monthlyPrice].every(v => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0)) && [x.fr,x.en].every(c => c && ['title',...offerFields].every(k => typeof c[k as keyof OfferCopy] === 'string' && c[k as keyof OfferCopy].trim().length > 0))
}
