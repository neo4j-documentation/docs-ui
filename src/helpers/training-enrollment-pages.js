'use strict'

module.exports = ({ data: { root } }) => {
  const { contentCatalog } = root
  return contentCatalog.getPages().filter((page) =>
    page.src.basename === 'enrollment.adoc' &&
    page.asciidoc &&
    page.asciidoc.attributes &&
    typeof page.asciidoc.attributes['page-course-hidden'] === 'undefined'
  )
}
