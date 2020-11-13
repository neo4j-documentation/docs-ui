'use strict'

module.exports = ({ data: { root } }) => {
  const { contentCatalog } = root
  const values = contentCatalog.getPages()
    .filter((page) =>
      page.src.component === 'kb' &&
      page.asciidoc &&
      page.asciidoc.attributes &&
      page.asciidoc.attributes.category &&
      page.src.basename !== 'index.adoc'
    )
    .map((page) => page.asciidoc.attributes.category.trim().split(',').map((value) => value.trim().toLowerCase()))
    .reduce((acc, val) => acc.concat(val), []) // equivalent to ".flat()" which is only available in Node 11+
    .sort()
  const counts = {}
  values.forEach((value) => {
    counts[value] = counts[value] ? counts[value] + 1 : 1
  })
  return Object.keys(counts).map((key) => ({ name: key, count: counts[key] }))
}
