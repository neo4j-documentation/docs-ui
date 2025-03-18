// The canonical URL for a page has already been calculated by Antora
// and is available in the page object a page.canonicalUrl
// if the canonical URL for a page is in the current version of the component
// we want to modify the canonical by replacing that version with 'current'
// we can allow for a page attribute to be set to override 'current'

// if the version is ~ there is no version in the path - we return the canonical URL as is
// if there's only one version of the page, there is no page.latest - we use page.version

'use strict'

module.exports = (page) => {
  const versionToReplace = page.latest ? page.latest.version : page.version
  if (!versionToReplace) return page.canonicalUrl
  const re = new RegExp(`/${versionToReplace}/`)
  const latestVersionPath = `/${(page.attributes['latest-version-path'] || 'current')}/`
  return page.canonicalUrl.replace(re, latestVersionPath)
}
