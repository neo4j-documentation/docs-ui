'use strict'

module.exports = ({ data: { root } }) => {
  const { contentCatalog } = root
  const values = contentCatalog.getPages().filter((page) =>
    page.asciidoc &&
    page.asciidoc.attributes &&
    page.asciidoc.attributes.tags &&
    page.src.basename !== 'index.adoc').map((page) => {
    return page.asciidoc.attributes.tags.trim().split(',').map((value) => value.trim().toLowerCase())
  }).flat().sort()
  const counts = {}
  values.forEach((value) => {
    counts[value] = counts[value] ? counts[value] + 1 : 1
  })
  return Object.keys(counts).map((key) => ({ name: key, count: counts[key] }))
}
