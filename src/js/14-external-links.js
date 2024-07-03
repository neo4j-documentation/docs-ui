// external links
// link:https://example.com[text^] - add class external and aria-label (already has target="_blank")
// link:https://example.com[text] - do nothing
// links to other docs pages are not external
// link:https://neo4j.com/docs/...[] - do nothing
// link:{neo4j-docs-bas-uri}/...[] - do nothing

;(function () {
  'use strict'
  const nonExternals = /neo4j\.[com|dev]/g
  document.querySelectorAll('.doc a[href^="http"], .doc a[target="_blank"]')
    .forEach(function (el) {
      if (document.location.hostname !== el.hostname && !el.hostname.match(nonExternals)) {
        el.classList.add('external')
        el.setAttribute('aria-label', 'Link label (opens in new tab)')
      }

      if (el.target === '_blank') {
        el.setAttribute('aria-label', 'Link label (opens in new tab)')
      }
    })
})()
