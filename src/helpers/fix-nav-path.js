'use strict'

module.exports = (url, page, { data: { root } }) => {
  if (!url) return ''

  // Derive the site path prefix from the site URL (e.g. '/docs' or '/docs/sandbox/restructure/docs').
  // Falls back to '/docs' if the site URL isn't available.
  let sitePath = '/docs'
  try {
    const siteUrl = root && root.site && root.site.url
    if (siteUrl) sitePath = new URL(siteUrl).pathname.replace(/\/$/, '') || '/docs'
  } catch (e) {}

  const siteParts = sitePath.split('/').filter(Boolean)
  const urlParts = url.split('/').filter(Boolean)

  // Strip however many leading segments of the URL already match the site path prefix,
  // then prepend the full prefix. This handles URLs generated with a different site URL
  // (e.g. a JSON file written at generate time with localhost paths, consumed at staging time).
  let stripCount = 0
  for (let i = 0; i < Math.min(siteParts.length, urlParts.length); i++) {
    if (urlParts[i] === siteParts[i]) stripCount++
    else break
  }
  if (stripCount > 0) urlParts.splice(0, stripCount)

  return '/' + [...siteParts, ...urlParts].join('/')
}
