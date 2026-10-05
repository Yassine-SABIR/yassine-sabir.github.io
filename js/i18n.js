const STORAGE_KEY = 'yassine-portfolio-language';

const customTranslations = {
  en: {
    'custom.live.available': "Available for security roles",
    'custom.live.location': "Paris · Remote friendly",
    'custom.live.degree': "Double engineering degree",
    'custom.live.htb': "131 roots · #12 France (S6)",
    'custom.coverage.title': "Published writeup coverage",
    'custom.coverage.intro': "Breakdown of the documented reports by domain, target OS and difficulty.",
    'custom.projects.details': "View details",
    'custom.writeups.published': "writeups published · Hack The Box & CTF",
    'custom.writeups.sphere': "3D sphere",
    'custom.writeups.grid': "Quick grid",
    'custom.writeups.hint': "Scroll to spin the sphere, click a machine to open its report.",
    'custom.nav.home': 'Home',
    'custom.hero.headlinePrefix': 'Securing complex',
    'custom.hero.headlineWord': 'systems.',
    'custom.hero.journey': 'View my journey',
    'custom.profile.eyebrow': 'Profile',
    'custom.profile.text1': 'Cybersecurity engineer trained at Grenoble INP ESISAR and ENSIAS, focused on offensive security, digital forensics and resilient infrastructure.',
    'custom.profile.text2': 'I combine applied research, penetration testing and hands-on CTF practice to turn complex technical findings into concrete remediation plans.',
    'custom.skills.intro': 'From attack simulation to forensic investigation and infrastructure hardening.',
    'custom.htb.intro': "Offensive skills measured in real conditions on the reference platforms.",
    'custom.experience.intro': 'Applied research, penetration testing and secure product development.',
    'custom.projects.intro': 'Security engineering projects spanning infrastructure, protocol research and software.',
    'custom.writeups.intro': 'Structured reports covering exploitation, DFIR, SOC and malware-analysis challenges.',
    'custom.writeups.browse': 'Browse all writeups',
    'custom.writeups.open': 'Open writeup',
    'custom.education.double': 'Double engineering degree',
    'custom.education.engineering': 'Engineering degree',
    'custom.education.preparatory': 'Preparatory classes',
    'custom.contact.intro': 'Have a cybersecurity opportunity, research project or technical challenge? Let’s talk.',
    'custom.footer.description': 'Cybersecurity engineer focused on offensive security, industrial forensics and secure infrastructures.',
    'custom.footer.rights': 'All rights reserved.',
    "custom.contact.encrypted": "Private contact options",
    "custom.contact.encryptedText": "Download my public key and encrypt your message locally with any OpenPGP client before sending it. Downloading the key does not encrypt anything by itself.",
    "custom.contact.pgp": "Download public key (.asc)",
    "custom.secure.protonTitle": "Proton Mail",
    "custom.secure.pgpTitle": "OpenPGP",
    "custom.secure.protonText": "Write to sabir.yassine@proton.me. From another Proton Mail account the message is end-to-end encrypted automatically. From other providers it is only encrypted in transit (TLS) — use the OpenPGP option for end-to-end protection.",
    "custom.secure.protonAction": "Email sabir.yassine@proton.me",
    "custom.pgp.state.loading": "Checking public key…",
    "custom.pgp.state.verified": "Public key verified: valid OpenPGP key for sabir.yassine@proton.me, matching the pinned fingerprint.",
    "custom.pgp.state.unpinned": "Public key retrieved and parsed: valid OpenPGP key for sabir.yassine@proton.me. No fingerprint is pinned on this site yet, so check it independently.",
    "custom.pgp.state.mismatch": "Warning: the retrieved key does NOT match the pinned fingerprint. Do not use it; contact me through another channel.",
    "custom.pgp.state.invalid": "The retrieved key failed OpenPGP validation and must not be trusted.",
    "custom.pgp.state.unavailable": "The public key could not be retrieved right now. Use the keyserver link below and verify the fingerprint independently.",
    "custom.pgp.reason.format": "(not an ASCII-armored public key)",
    "custom.pgp.reason.parse": "(could not be parsed)",
    "custom.pgp.reason.private": "(a private key was served)",
    "custom.pgp.reason.identity": "(expected e-mail not found in the key)",
    "custom.pgp.reason.expired": "(revoked, expired or without an encryption key)",
    "custom.pgp.reason.fingerprint": "",
    "custom.pgp.reason.network": "",
    "custom.pgp.reason.library": "(OpenPGP library failed to load)",
    "custom.pgp.fingerprint": "Fingerprint",
    "custom.pgp.identity": "Identity",
    "custom.pgp.algorithm": "Algorithm",
    "custom.pgp.created": "Created",
    "custom.pgp.source": "Source",
    "custom.pgp.source.local": "this website (same origin)",
    "custom.pgp.copyFingerprint": "Copy fingerprint",
    "custom.pgp.keyserver": "View on Proton keyserver",
    "custom.newTab": "(opens in a new tab)",
    "custom.pgp.trustNote": "For strong protection against key substitution, confirm this fingerprint through an independent channel (e.g. in person or on a profile you trust). HTTPS alone cannot prove the key is mine.",
    "custom.pgp.encryptLabel": "Encrypt subject and message in my browser with OpenPGP before sending",
    "custom.pgp.encryptHelpOff": "Without this option the form is sent as plain text over HTTPS to a Google Apps Script and stored in a spreadsheet; it is not end-to-end encrypted.",
    "custom.pgp.encryptHelpOn": "Subject and message are encrypted on your device; only ciphertext is sent. Your name, e-mail and organization stay readable so I can reply.",
    "custom.form.notConfigured": "Form not configured. Please email me.",
    "custom.form.encrypting": "Encrypting in your browser…",
    "custom.form.sending": "Sending…",
    "custom.form.encryptFailed": "Encryption failed, so nothing was sent. Please email me instead.",
    "custom.form.sent": "Message submitted. If you do not hear back, email me directly.",
    "custom.form.sentEncrypted": "Encrypted message submitted (only ciphertext was sent). If you do not hear back, email me directly.",
    "custom.form.failed": "Sending failed. Please email me.",
    "custom.htb.challenges": "Challenges Solved",
    "custom.htb.challengesNote": "Hack The Box challenges completed end-to-end"
  },
  fr: {
    'custom.live.available': "Disponible pour des postes en sécurité",
    'custom.live.location': "Paris · Télétravail possible",
    'custom.live.degree': "Double diplôme d’ingénieur",
    'custom.live.htb': "131 roots · 12e en France (S6)",
    'custom.coverage.title': "Couverture des write-ups publiés",
    'custom.coverage.intro': "Répartition des rapports par domaine, OS cible et difficulté.",
    'custom.projects.details': "Voir les détails",
    'custom.writeups.published': "write-ups publiés · Hack The Box & CTF",
    'custom.writeups.sphere': "Sphère 3D",
    'custom.writeups.grid': "Grille rapide",
    'custom.writeups.hint': "Faites défiler pour tourner la sphère, cliquez sur une machine pour ouvrir son rapport.",
    'custom.nav.home': 'Accueil',
    'custom.hero.headlinePrefix': 'Sécuriser les systèmes',
    'custom.hero.headlineWord': 'complexes.',
    'custom.hero.journey': 'Voir mon parcours',
    'custom.profile.eyebrow': 'Profil',
    'custom.profile.text1': 'Ingénieur cybersécurité formé à Grenoble INP ESISAR et à l’ENSIAS, spécialisé en sécurité offensive, forensique numérique et infrastructures résilientes.',
    'custom.profile.text2': 'Je combine recherche appliquée, tests d’intrusion et pratique des CTF pour transformer des constats techniques complexes en plans de remédiation concrets.',
    'custom.skills.intro': 'De la simulation d’attaque à l’investigation forensique et au durcissement des infrastructures.',
    'custom.htb.intro': "Des compétences offensives mesurées en conditions réelles sur les plateformes de référence.",
    'custom.experience.intro': 'Recherche appliquée, tests d’intrusion et développement de solutions sécurisées.',
    'custom.projects.intro': 'Des projets d’ingénierie sécurité couvrant infrastructure, recherche protocolaire et logiciel.',
    'custom.writeups.intro': 'Des rapports structurés sur des challenges d’exploitation, DFIR, SOC et analyse de malware.',
    'custom.writeups.browse': 'Voir tous les write-ups',
    'custom.writeups.open': 'Ouvrir le writeup',
    'custom.education.double': 'Double diplôme d’ingénieur',
    'custom.education.engineering': 'Diplôme d’ingénieur',
    'custom.education.preparatory': 'Classes préparatoires',
    'custom.contact.intro': 'Une opportunité en cybersécurité, un projet de recherche ou un défi technique ? Échangeons.',
    'custom.footer.description': 'Ingénieur cybersécurité spécialisé en sécurité offensive, forensique industrielle et infrastructures sécurisées.',
    'custom.footer.rights': 'Tous droits réservés.',
    "custom.contact.encrypted": "Options de contact confidentielles",
    "custom.contact.encryptedText": "Téléchargez ma clé publique et chiffrez votre message localement avec n’importe quel client OpenPGP avant de l’envoyer. Télécharger la clé ne chiffre rien à lui seul.",
    "custom.contact.pgp": "Télécharger la clé publique (.asc)",
    "custom.secure.protonTitle": "Proton Mail",
    "custom.secure.pgpTitle": "OpenPGP",
    "custom.secure.protonText": "Écrivez à sabir.yassine@proton.me. Depuis un autre compte Proton Mail, le message est chiffré de bout en bout automatiquement. Depuis d’autres fournisseurs, il n’est chiffré qu’en transit (TLS) : utilisez l’option OpenPGP pour une protection de bout en bout.",
    "custom.secure.protonAction": "Écrire à sabir.yassine@proton.me",
    "custom.pgp.state.loading": "Vérification de la clé publique…",
    "custom.pgp.state.verified": "Clé publique vérifiée : clé OpenPGP valide pour sabir.yassine@proton.me, conforme à l’empreinte épinglée.",
    "custom.pgp.state.unpinned": "Clé publique récupérée et analysée : clé OpenPGP valide pour sabir.yassine@proton.me. Aucune empreinte n’est encore épinglée sur ce site, vérifiez-la de manière indépendante.",
    "custom.pgp.state.mismatch": "Attention : la clé récupérée NE correspond PAS à l’empreinte épinglée. Ne l’utilisez pas ; contactez-moi par un autre canal.",
    "custom.pgp.state.invalid": "La clé récupérée a échoué à la validation OpenPGP et ne doit pas être utilisée.",
    "custom.pgp.state.unavailable": "La clé publique est indisponible pour le moment. Utilisez le lien vers le serveur de clés et vérifiez l’empreinte de manière indépendante.",
    "custom.pgp.reason.format": "(pas une clé publique au format ASCII-armored)",
    "custom.pgp.reason.parse": "(analyse impossible)",
    "custom.pgp.reason.private": "(une clé privée a été servie)",
    "custom.pgp.reason.identity": "(adresse e-mail attendue absente de la clé)",
    "custom.pgp.reason.expired": "(révoquée, expirée ou sans clé de chiffrement)",
    "custom.pgp.reason.fingerprint": "",
    "custom.pgp.reason.network": "",
    "custom.pgp.reason.library": "(échec du chargement de la bibliothèque OpenPGP)",
    "custom.pgp.fingerprint": "Empreinte",
    "custom.pgp.identity": "Identité",
    "custom.pgp.algorithm": "Algorithme",
    "custom.pgp.created": "Créée le",
    "custom.pgp.source": "Source",
    "custom.pgp.source.local": "ce site (même origine)",
    "custom.pgp.copyFingerprint": "Copier l’empreinte",
    "custom.pgp.keyserver": "Voir sur le serveur de clés Proton",
    "custom.newTab": "(s’ouvre dans un nouvel onglet)",
    "custom.pgp.trustNote": "Pour une protection forte contre la substitution de clé, confirmez cette empreinte par un canal indépendant (en personne ou sur un profil de confiance). HTTPS seul ne prouve pas que la clé est la mienne.",
    "custom.pgp.encryptLabel": "Chiffrer l’objet et le message dans mon navigateur avec OpenPGP avant l’envoi",
    "custom.pgp.encryptHelpOff": "Sans cette option, le formulaire est envoyé en clair via HTTPS à un Google Apps Script et stocké dans une feuille de calcul ; il n’est pas chiffré de bout en bout.",
    "custom.pgp.encryptHelpOn": "L’objet et le message sont chiffrés sur votre appareil ; seul le texte chiffré est envoyé. Votre nom, e-mail et organisation restent lisibles pour que je puisse répondre.",
    "custom.form.notConfigured": "Formulaire non configuré. Écrivez-moi par e-mail.",
    "custom.form.encrypting": "Chiffrement dans votre navigateur…",
    "custom.form.sending": "Envoi en cours…",
    "custom.form.encryptFailed": "Le chiffrement a échoué : rien n’a été envoyé. Écrivez-moi par e-mail.",
    "custom.form.sent": "Message soumis. Sans réponse de ma part, écrivez-moi directement par e-mail.",
    "custom.form.sentEncrypted": "Message chiffré soumis (seul le texte chiffré a été envoyé). Sans réponse de ma part, écrivez-moi par e-mail.",
    "custom.form.failed": "Échec de l’envoi. Écrivez-moi par e-mail.",
    "custom.htb.challenges": "Challenges résolus",
    "custom.htb.challengesNote": "Challenges Hack The Box réalisés de bout en bout"
  }
};

// Active dictionary, readable by other modules for runtime strings.
let activeDictionary = {};
export const t = (key, fallback = '') => activeDictionary[key] ?? customTranslations.en[key] ?? fallback ?? key;

const getNested = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

export async function initI18n() {
  const button = document.querySelector('[data-language-toggle]');
  let translations = {};
  try {
    const response = await fetch('assets/i18n/translations.json', { cache: 'no-store' });
    if (response.ok) translations = await response.json();
  } catch (error) {
    console.warn('Translations unavailable:', error);
  }

  translations.en = { ...(translations.en || {}), ...customTranslations.en };
  translations.fr = { ...(translations.fr || {}), ...customTranslations.fr };

  let language = localStorage.getItem(STORAGE_KEY) || (navigator.language?.startsWith('fr') ? 'fr' : 'en');
  if (!['en', 'fr'].includes(language)) language = 'en';

  const translate = (lang) => {
    const dictionary = translations[lang] || {};
    activeDictionary = dictionary;
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const value = dictionary[element.dataset.i18n];
      if (typeof value === 'string' && value.trim()) {
        if (element.matches('.xp-card h3') && element.dataset.i18n.endsWith('.title')) {
          const parts = value.split(/\s+[–—]\s+/);
          element.replaceChildren();
          element.append(parts[0]);
          if (parts[1]) {
            const company = document.createElement('span');
            company.className = 'xp-company';
            company.textContent = ` – ${parts.slice(1).join(' – ')}`;
            element.append(company);
          }
        } else {
          element.textContent = value;
        }
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const value = dictionary[element.dataset.i18nPlaceholder];
      if (typeof value === 'string') element.placeholder = value;
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      const value = dictionary[element.dataset.i18nAriaLabel];
      if (typeof value === 'string') element.setAttribute('aria-label', value);
    });
    if (button) {
      button.textContent = lang === 'en' ? 'FR' : 'EN';
      button.setAttribute('aria-label', lang === 'en' ? 'Passer en français' : 'Switch to English');
    }
    const localizedTitle = dictionary['meta.title'];
    if (localizedTitle) document.title = localizedTitle;
    localStorage.setItem(STORAGE_KEY, lang);
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
  };

  button?.addEventListener('click', () => {
    language = language === 'en' ? 'fr' : 'en';
    translate(language);
  });
  translate(language);
}
