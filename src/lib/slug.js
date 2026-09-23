// Turns a Vietnamese full name into a safe login username (no diacritics, no spaces).
// Login accounts are backed by a synthesized email (username@september.internal), and
// email addresses can't contain spaces or accented characters — so this keeps admins
// from ever typing something the auth system will reject.
export function slugifyUsername(input) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.')
}

// Applied on every keystroke in the username field so it's impossible to type
// something invalid in the first place.
export function sanitizeUsernameChars(input) {
  return input.toLowerCase().replace(/[^a-z0-9._-]/g, '')
}

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/
