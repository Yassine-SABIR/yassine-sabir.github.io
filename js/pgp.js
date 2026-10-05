// OpenPGP contact channel.
//
// Security model (keep this accurate if you change the code):
// - The site only ever handles the recipient's PUBLIC key. No private key exists
//   anywhere in this codebase, and nothing here asks a visitor for one.
// - The key is retrieved from the sources in config (same-origin copy first,
//   then the Proton keyserver), parsed with OpenPGP.js and checked: public-only,
//   expected e-mail in a user ID, primary key valid (not revoked/expired) and an
//   encryption-capable (sub)key present.
// - If the site owner pinned a fingerprint in config, the retrieved key must
//   match it exactly. A pin only proves the key matches what the site says;
//   it is not protection against someone who controls the site itself, so the
//   UI tells visitors to verify the fingerprint through an independent channel.
// - Encryption happens in the browser with the validated key; only ciphertext is
//   returned to callers. On any failure we fail closed (no plaintext fallback).

import { t } from './i18n.js';

const LIB_URL = new URL('../assets/vendor/openpgp/openpgp.min.mjs', import.meta.url).href;
const ARMOR_HEADER = '-----BEGIN PGP PUBLIC KEY BLOCK-----';

const config = () => window.__APP_CONFIG__?.pgp || {};
const normalizeFingerprint = (value = '') => value.replace(/[^0-9a-f]/gi, '').toUpperCase();
// Full fingerprint in groups of 4 (gpg style, extra gap at the midpoint). Never truncated.
export const formatFingerprint = (fp) => {
  const groups = fp.match(/.{1,4}/g) || [];
  const half = Math.ceil(groups.length / 2);
  return `${groups.slice(0, half).join(' ')}  ${groups.slice(half).join(' ')}`.trim();
};

let libraryPromise;
const loadLibrary = () => {
  libraryPromise ??= import(LIB_URL);
  return libraryPromise;
};

/**
 * Result shape:
 *  { state: 'verified' | 'unpinned' | 'mismatch' | 'invalid' | 'unavailable',
 *    key?, armored?, fingerprint?, userIds?, created?, algorithm?, source?, reason? }
 * Only 'verified' and 'unpinned' carry a usable key.
 */
let keyPromise;
export function loadRecipientKey() {
  keyPromise ??= resolveKey();
  return keyPromise;
}

async function resolveKey() {
  const { email = '', fingerprint: pinned = '', sources = [] } = config();
  const expectedEmail = email.trim().toLowerCase();
  const pin = normalizeFingerprint(pinned);
  let openpgp;
  try {
    openpgp = await loadLibrary();
  } catch (error) {
    return { state: 'unavailable', reason: 'library' };
  }

  let lastFailure = { state: 'unavailable', reason: 'network' };
  for (const source of sources) {
    let armored;
    try {
      // Same-origin paths are resolved relative to the page; remote ones must be HTTPS.
      const url = new URL(source, document.baseURI);
      if (url.origin !== location.origin && url.protocol !== 'https:') continue;
      const response = await fetch(url, { credentials: 'omit', cache: 'no-cache', redirect: 'error' });
      if (!response.ok) continue;
      armored = (await response.text()).trim();
    } catch (error) {
      continue; // network error or CORS refusal: try the next source
    }

    const result = await validate(openpgp, armored, expectedEmail, pin);
    result.source = source;
    if (result.state === 'verified' || result.state === 'unpinned') return result;
    // A key that was retrieved but failed validation is more important than "unavailable".
    lastFailure = result;
    if (result.state === 'mismatch') return result;
  }
  return lastFailure;
}

async function validate(openpgp, armored, expectedEmail, pin) {
  if (!armored.startsWith(ARMOR_HEADER) || armored.includes('PRIVATE KEY BLOCK')) {
    return { state: 'invalid', reason: 'format' };
  }
  let key;
  try {
    key = await openpgp.readKey({ armoredKey: armored });
  } catch (error) {
    return { state: 'invalid', reason: 'parse' };
  }
  if (key.isPrivate()) return { state: 'invalid', reason: 'private' };

  const userIds = key.getUserIDs();
  const emails = key.users.map((user) => user.userID?.email?.toLowerCase()).filter(Boolean);
  if (expectedEmail && !emails.includes(expectedEmail)) return { state: 'invalid', reason: 'identity' };

  try {
    await key.verifyPrimaryKey(); // throws when revoked, expired or self-signature invalid
    await key.getEncryptionKey(); // throws when no valid encryption-capable key exists
  } catch (error) {
    return { state: 'invalid', reason: 'expired' };
  }

  const fingerprint = key.getFingerprint().toUpperCase();
  if (pin && fingerprint !== pin) return { state: 'mismatch', reason: 'fingerprint' };

  const { algorithm, bits, curve } = key.getAlgorithmInfo();
  return {
    state: pin ? 'verified' : 'unpinned',
    key,
    armored,
    fingerprint,
    userIds,
    created: key.getCreationTime(),
    algorithm: curve ? `${algorithm} (${curve})` : bits ? `${algorithm} ${bits}` : algorithm
  };
}

/** Encrypt text for the recipient. Throws (never returns plaintext) on failure. */
export async function encryptForRecipient(text) {
  const result = await loadRecipientKey();
  if (!result.key) throw new Error(`PGP key not usable: ${result.state}`);
  const openpgp = await loadLibrary();
  const message = await openpgp.createMessage({ text });
  const armored = await openpgp.encrypt({ message, encryptionKeys: result.key, format: 'armored' });
  if (typeof armored !== 'string' || !armored.startsWith('-----BEGIN PGP MESSAGE-----')) throw new Error('Unexpected ciphertext');
  return armored;
}

/* ---------------------------------------------------------------- UI ---- */

const STATE_ICONS = {
  loading: 'fa-solid fa-circle-notch fa-spin',
  verified: 'fa-solid fa-circle-check',
  unpinned: 'fa-solid fa-circle-info',
  mismatch: 'fa-solid fa-triangle-exclamation',
  invalid: 'fa-solid fa-triangle-exclamation',
  unavailable: 'fa-solid fa-plug-circle-xmark'
};

export function initPgpChannel() {
  const root = document.querySelector('[data-secure-channel]');
  if (!root) return;
  const status = root.querySelector('[data-pgp-status]');
  const details = root.querySelector('[data-pgp-details]');
  const download = root.querySelector('[data-pgp-download]');
  const copyFp = root.querySelector('[data-pgp-copy-fingerprint]');
  const keyserver = root.querySelector('[data-pgp-keyserver]');
  let current = { state: 'loading' };

  const keyserverUrl = (config().sources || []).find((s) => /^https:/.test(s));
  if (keyserver && keyserverUrl) keyserver.href = keyserverUrl;

  const render = () => {
    const { state } = current;
    root.dataset.pgpState = state;
    status.dataset.state = state;
    const reason = current.reason ? ` ${t(`custom.pgp.reason.${current.reason}`)}` : '';
    status.innerHTML = '';
    const icon = document.createElement('i');
    icon.className = STATE_ICONS[state];
    icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = `${t(`custom.pgp.state.${state}`)}${reason}`.trim();
    status.append(icon, text);

    const usable = state === 'verified' || state === 'unpinned';
    details.hidden = !usable;
    download.disabled = !usable;
    download.setAttribute('aria-disabled', String(!usable));
    if (usable) {
      details.querySelector('[data-pgp-fp]').textContent = formatFingerprint(current.fingerprint);
      details.querySelector('[data-pgp-uid]').textContent = current.userIds.join(', ');
      details.querySelector('[data-pgp-algo]').textContent = current.algorithm;
      details.querySelector('[data-pgp-created]').textContent = current.created.toISOString().slice(0, 10);
      details.querySelector('[data-pgp-source]').textContent = new URL(current.source, document.baseURI).host === location.host
        ? t('custom.pgp.source.local') : new URL(current.source).host;
    }
    document.dispatchEvent(new CustomEvent('pgp:state', { detail: current }));
  };

  // Download the exact bytes that were validated (works for cross-origin sources,
  // unlike the HTML download attribute).
  download.addEventListener('click', () => {
    if (!current.armored) return;
    const blob = new Blob([`${current.armored}\n`], { type: 'application/pgp-keys' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sabir.yassine-${current.fingerprint.slice(-16)}.asc`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  copyFp?.addEventListener('click', async () => {
    if (!current.fingerprint) return;
    try {
      await navigator.clipboard.writeText(formatFingerprint(current.fingerprint));
      copyFp.dataset.copied = 'true';
      setTimeout(() => delete copyFp.dataset.copied, 1500);
    } catch { /* clipboard unavailable: the fingerprint stays selectable */ }
  });

  document.addEventListener('languagechange', render);
  render();

  // Lazy: load the library and key only when the contact section approaches.
  const start = () => loadRecipientKey().then((result) => { current = result; render(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); start(); }
    }, { rootMargin: '600px 0px' });
    observer.observe(root.closest('section') || root);
  } else {
    start();
  }
}
