;(function () {
  'use strict'

  // Runtime footer-links injection.
  //
  // The footer's link columns are baked into the page as a fallback (see
  // footer-links.hbs), then replaced at load time with a published
  // footer-links.html fragment. That lets the link columns be changed centrally
  // — republish one fragment + invalidate the CDN — without republishing every
  // page. The static logo + copyright columns stay baked, so no-JS and first
  // paint always have the essentials (copyright, legal links).
  //
  // Graceful: on any failure (404 until the fragment is published, network
  // error, empty body) the baked fallback columns are left in place.

  var slot = document.getElementById('footer-links')
  if (!slot) return

  // Served as a UI asset (see build.js), so resolve against the UI root path —
  // the same base css/js use — not the site path.
  var uiRootPath = (document.body && document.body.dataset.uiRootPath) || ''
  var FRAGMENT_URL = uiRootPath + '/fragments/footer-links.html'

  fetch(FRAGMENT_URL, { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.text()
    })
    .then(function (html) {
      if (html && html.trim()) slot.innerHTML = html
    })
    .catch(function (err) {
      console.debug('[footer] keeping baked fallback links:', err.message)
    })
})()
