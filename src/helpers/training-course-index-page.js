'use strict'

module.exports = (componentName, { data: { root } }) => {
  const { contentCatalog } = root
  return contentCatalog.getPages().filter((page) => page.asciidoc &&
    page.asciidoc.attributes &&
    page.asciidoc.attributes['page-type'] === 'training-course-index' &&
    page.src &&
    page.src.component === componentName)[0]
}
