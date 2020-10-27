'use strict'

module.exports = (url, { data: { root } }) => {
  const { contentCatalog } = root
  const pages = contentCatalog.getPages().filter((page) => page.pub && page.pub.url === url)
  if (pages) {
    return pages[0]
  }
  return undefined
}
