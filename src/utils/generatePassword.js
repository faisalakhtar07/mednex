// Generates a random password meeting the spec's policy (min 8 chars, upper,
// lower, number, special) entirely client-side using the Web Crypto API —
// no network round trip needed for a "click and get a password" button.
// Ambiguous-looking characters (0/O, 1/I/l) are excluded so a copied
// password is easy to read back and retype if needed.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const DIGITS = '23456789'
const SPECIAL = '!@#$%^&*'
const ALL = UPPER + LOWER + DIGITS + SPECIAL

function randomChar(set) {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return set[bytes[0] % set.length]
}

export function generatePassword(length = 12) {
  const len = Math.max(8, length)
  // Guarantee at least one of each required category, then fill the rest.
  const required = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SPECIAL)]
  const rest = Array.from({ length: len - required.length }, () => randomChar(ALL))
  const chars = [...required, ...rest]

  // Fisher-Yates shuffle so the required characters aren't always up front.
  for (let i = chars.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1)
    crypto.getRandomValues(bytes)
    const j = bytes[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
