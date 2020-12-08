'use strict'

module.exports = (page, componentName) => {
  let version = page.version
  if (version === '3.5') {
    version = '1.7' // Driver version 1.7 corresponds to Neo4j version 3.5
  }
  if (page.attributes && page.attributes.theme === 'docs' && ['4.1', '4.0', '1.7'].includes(version)) {
    return `/docs/driver-manual/${version}`
  }
  return `/docs/${componentName}/${version}`
}
