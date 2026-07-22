'use strict'

// Recursively checks whether any item in a nav items array has the given URL.
// Used to determine whether to expand a componentHeader section.
function containsUrl (items, url) {
  if (!items || !Array.isArray(items)) return false
  for (const item of items) {
    if (item.url === url) return true
    if (item.items && containsUrl(item.items, url)) return true
  }
  return false
}

module.exports = containsUrl
