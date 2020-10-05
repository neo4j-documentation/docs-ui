'use strict'

module.exports = ({ data: { root } }) => {
  const { contentCatalog } = root
  return contentCatalog.getPages()
    .filter((page) =>
      page.src.component === 'kb' &&
      page.src.basename === 'tags.adoc'
    )[0]
}
