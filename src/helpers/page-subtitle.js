'use strict'

module.exports = (page) => {
  if (page.layout === 'landing' || page.layout === 'training-enrollment') {
    // since the component title and the page title are often the same, we use 'Neo4j Graph Data Platform' to avoid redundancy.
    return ' - Neo4j Graph Data Platform'
  }
  if (page && page.component && page.component.title) {
    return ` - ${page.component.title}`
  }
  return ''
}
