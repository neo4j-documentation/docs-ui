;(function () {
  'use strict'

  var kbSearchButton = document.getElementById('kb-search-button')
  if (kbSearchButton) {
    if (window.neo4jSearch) {
      if (typeof window.neo4jSearch.updateContext === 'function') {
        // Sow only Knowledge Base results by default
        window.neo4jSearch.updateContext({ name: 'kb', postTypes: ['Knowledge Base'] })
      }
      kbSearchButton.addEventListener('click', function (e) {
        e.stopPropagation()

        if (typeof window.neo4jSearch.openSearch === 'function') {
          window.neo4jSearch.openSearch()
        }
      })
    }
  }
})()
