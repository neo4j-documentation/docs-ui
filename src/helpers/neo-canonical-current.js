// The canonical URL for a page has already been calculated by Antora
// and is available in the page object a page.canonicalUrl
// if the canonical URL for a page is in the current version of the component
// we want to modify the canonical by replacing that version with 'current'
// we can allow for a page attribute to be set to override 'current'

// if there's only one version of the page, there is no page.latest
// if the version is ~ there is no version in the path
// if both of these are true, we return the canonical URL as is

'use strict'

module.exports = (page) => {
  if (!page.latest && !page.version) return page.canonicalUrl
  const versionToReplace = page.latest ? page.latest.version : page.version
  const re = new RegExp(`/${versionToReplace}/`)
  const latestVersionPath = `/${(page.attributes['latest-version-path'] || 'current')}/`
  return page.canonicalUrl.replace(re, latestVersionPath)
}
