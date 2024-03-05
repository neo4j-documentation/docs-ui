// external links
// link:https://example.com[text^] - add class external and aria-label (already has target="_blank")
// link:https://example.com[text] - do nothing
// links to other docs pages are not external
// link:https://neo4j.com/docs/...[] - do nothing
// link:{neo4j-docs-bas-uri}/...[] - do nothing

;(function () {
  'use strict'

  // open all non neo4j.com/docs links in a new tab
  // document.querySelectorAll('.doc a[href^="http"]')
  //   .forEach(function (el) {
  //     if (!el.href.includes('neo4j.com/docs')) {
  //       // el.setAttribute('target', '_blank');
  //       // el.classList.add('external')
  //     }
  //   })

  // add class and aria-label to all links that open in a new tab
  document.querySelectorAll('.doc a[target="_blank"]')
    .forEach(function (el) {
      el.classList.add('external')
      el.setAttribute('aria-label', 'Link label (opens in new tab)')
    })
})()
