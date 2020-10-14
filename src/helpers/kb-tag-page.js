'use strict'

module.exports = (tag, { data: { root } }) => {
  const { contentCatalog } = root
  return contentCatalog.getPages()
    .filter((page) =>
      page.src.component === 'kb' &&
      page.asciidoc.attributes &&
      page.asciidoc.attributes['page-layout'] === 'kb-tag' &&
      page.asciidoc.attributes['page-tag'] === tag
    )[0]
}
