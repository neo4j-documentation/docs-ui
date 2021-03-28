export function cleanCode (code, language) {
  var div = document.createElement('div')
  div.innerHTML = code

  Array.from(div.querySelectorAll('i.conum, b')).map(function (el) {
    div.removeChild(el)
  })

  var cleaner = document.createElement('textarea')
  var input = div.innerHTML

  if (language === 'bash' || language === 'sh' || language === 'shell' || language === 'console') {
    input = window.neo4jDocs.copyableCommand(input)
  }

  cleaner.innerHTML = input
  return cleaner.value
}

// Convert value from Neo4j Driver to native
export function convert (value) {
  if (Array.isArray(value)) {
    return value.map(function (item) { return convert(item) })
  } else if (window.neo4j && typeof window.neo4j.isInt === 'function' && window.neo4j.isInt(value)) {
    return value.toNumber()
  } else if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.keys(value).map(function (key) {
      return [key, convert(value[key])]
    }))
  }

  return value
}
