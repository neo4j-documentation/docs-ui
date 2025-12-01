'use strict'

module.exports = (url, page, { data: { root } }) => {
 
  const urlParts = url.split('/').filter(e => e)

  console.log(urlParts)

  // add docs as the first item if it is missing
  if (urlParts[0] !== 'docs') {
    urlParts.unshift('docs')
  }

  const resolvedUrl = '/' + urlParts.join('/')
  
  console.log(resolvedUrl)
  
  return resolvedUrl 
  
}