'use strict'

module.exports = (page, componentName) => {
  let version = page.version
  if (version === '3.5') {
    version = '1.7' // Driver version 1.7 corresponds to Neo4j version 3.5
  }
  if (page.attributes && page.attributes.theme === 'docs') {
    if (['4.1', '4.0', '1.7'].includes(version)) {
      return `/docs/driver-manual/${version}`
    }
    // explicitly check the version to make sure that the driver manual page exists
    if (['4.2'].includes(version)) {
      return `/docs/${componentName}/${version}`
    }
  }
  return `/docs/${componentName}/current`
}
