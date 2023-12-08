;(function () {
  'use strict'

  document.querySelectorAll('.doc a[href^="http"], .doc a[target="_blank"]')
    .forEach(function (el) {
      el.classList.add('external')
      el.setAttribute('aria-label', 'Link label (opens in new tab)')
    })
})()
