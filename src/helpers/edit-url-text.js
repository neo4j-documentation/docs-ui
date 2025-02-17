'use strict'

module.exports = (page) => {
  if (page.attributes && page.attributes['edit-url-text']) return page.attributes['edit-url-text']
  return (page.attributes && page.attributes.theme === 'docs') ? 'Raise an issue' : 'Edit this page'
}
