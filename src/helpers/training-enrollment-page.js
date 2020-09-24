'use strict'

module.exports = (componentName, { data: { root } }) => {
  const { contentCatalog } = root
  return contentCatalog.getPages().filter((page) =>
    page.src.component === componentName &&
    page.src.basename === 'enrollment.adoc'
  )[0]
}
