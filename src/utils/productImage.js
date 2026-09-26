// Centralizes "does this product have a real photo?" logic so ProductCard,
// ProductDetail, etc. never render a raw placeholder string like '#' as
// literal text on screen. Seed data intentionally has no real product
// photography (see seed.js's NO_IMAGE constant) — real photos come from
// store owners uploading their own via the product edit form.
const categoryIcons = {
  medicines: '💊',
  vitamins: '🍊',
  'personal-care': '🧴',
  'baby-care': '🍼',
  'diabetes-care': '🩸',
  'womens-care': '🌸',
  'mens-care': '🧔',
  'oral-care': '🪥',
  'skin-care': '✨',
  'hair-care': '💇',
  devices: '🌡️',
  ayurveda: '🌿',
  'first-aid': '🩹',
}

// A usable image URL, or null if this product has no real photo yet.
export function productImageUrl(product) {
  const first = product?.images?.[0] || product?.image
  return first && first.startsWith('http') ? first : null
}

// The emoji to show in place of a missing photo, based on category.
export function productIcon(product) {
  return categoryIcons[product?.category] || '💊'
}
