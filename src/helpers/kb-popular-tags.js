'use strict'

module.exports = (category, { data: { root } }) => {
  const { contentCatalog } = root
  const values = contentCatalog.getPages()
    .filter((page) =>
      page.src.component === 'kb' &&
      page.asciidoc &&
      page.asciidoc.attributes &&
      page.asciidoc.attributes.tags &&
      (typeof category === 'undefined' || page.asciidoc.attributes.category === category) &&
      page.src.basename !== 'index.adoc'
    )
    .map((page) => page.asciidoc.attributes.tags.trim().split(',').map((value) => value.trim().toLowerCase()))
    .flat()
    .sort()
  const counts = {}
  values.forEach((value) => {
    counts[value] = counts[value] ? counts[value] + 1 : 1
  })
  const sorted = Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a)
  )
  const keys = Object.keys(sorted)
  return keys.splice(0, Math.min(keys.length, 5)).map((key) => ({ name: key, count: counts[key] }))
}
