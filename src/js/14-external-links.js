;(function () {
  'use strict'
  const nonExternals = /neo4j\.[com|dev]/g
  document.querySelectorAll('.doc a[href^="http"], .doc a[target="_blank"]')
    .forEach(function (el) {
      if (document.location.hostname !== el.hostname && !el.hostname.match(nonExternals)) {
        el.classList.add('external')
      }
    })
})()
