window.__APP_CONFIG__ = {
  contactSheetEndpoint: 'https://script.google.com/macros/s/AKfycbxVSTp_FyKs_jZFF9mTkOCFo9Dgw5iUDFoQKT0E9kuYjgtdn0dNfXFrzea7N33Exqfn/exec',
  pgp: {
    // Identity that must appear in a user ID of the key.
    email: 'sabir.yassine@proton.me',
    // Pinned fingerprint (40 hex chars, spaces optional). Set it ONLY after checking it
    // yourself, e.g. `gpg --show-keys --with-fingerprint key.asc` on the key exported from
    // Proton (Settings → Encryption and keys). When set, any other key is rejected.
    fingerprint: 'E479 D123 884F D099 F066  8020 5E8E 8351 2E5C BD56',
    // Tried in order. A same-origin copy (assets/keys/…) avoids third-party/CORS issues;
    // the Proton keyserver is the fallback. Relative paths stay valid in production.
    sources: [
      'assets/keys/sabir.yassine.asc',
      'https://api.protonmail.ch/pks/lookup?op=get&search=sabir.yassine@proton.me'
    ]
  },
  // Optional per-project links shown in the project modal, e.g. { terrapin: { github: 'https://github.com/…' } }.
  projectLinks: {}
};
