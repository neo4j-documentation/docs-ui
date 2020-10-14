'use strict'

module.exports = (category, { data: { root } }) => {
  const { contentCatalog } = root
  return contentCatalog.getPages()
    .filter((page) =>
      page.src.component === 'kb' &&
      page.asciidoc.attributes &&
      page.asciidoc.attributes['page-layout'] === 'kb-category' &&
      page.asciidoc.attributes['page-category'] === category
    )[0]
}
