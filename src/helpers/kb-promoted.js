'use strict'

module.exports = ({ data: { root } }) => {
  const { contentCatalog } = root
  return contentCatalog.getPages().filter((page) =>
    page.asciidoc &&
    page.asciidoc.attributes &&
    page.asciidoc.attributes.promoted == 'true')
}
