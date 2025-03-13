// The canonical URL for a page has already been calculated by Antora
// and is available in the page object a page.canonicalUrl
// if the canonical URL for a page is in the current version of the component
// we want to modify the canonical by replacing that version with 'current'
// we can allow for a page attribute to be set to override 'current'

'use strict'

module.exports = (page) => {
  if (!page.latest) return page.canonicalUrl
  const re = new RegExp(`/${page.latest.version}/`)
  const latestVersionPath = `/${(page.attributes['latest-version-path'] || 'current')}/`
  return page.canonicalUrl.replace(re, latestVersionPath)
}
