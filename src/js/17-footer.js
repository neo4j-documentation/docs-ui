;(function () {
  'use strict'

  // Runtime footer fragment injection.
  //
  // Each slot below is baked into the page with a fallback (empty for
  // #footer-links, the current trademark text for #footer-trademarks),
  // then replaced at load time with its own published fragment. That lets
  // either be changed centrally - republish one fragment + invalidate the
  // CDN - without republishing every page or cutting a docs-ui release.
  // The static logo + copyright-year/legal-links line stay baked only (no
  // fragment), since that's the one part of the footer that has to be
  // right even with JS off or the fetch failing.
  //
  // Graceful: on any failure (404 until a fragment is published, network
  // error, empty body) each slot's own baked fallback is left in place -
  // one fragment failing doesn't affect the other.

  // Served as a UI asset (see build.js), so resolve against the UI root path —
  // the same base css/js use — not the site path.
  var uiRootPath = (document.body && document.body.dataset.uiRootPath) || ''

  function injectFragment (slotId, fragmentName) {
    var slot = document.getElementById(slotId)
    if (!slot) return
    var fragmentUrl = uiRootPath + '/fragments/' + fragmentName

    fetch(fragmentUrl, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.text()
      })
      .then(function (html) {
        if (html && html.trim()) slot.innerHTML = html
      })
      .catch(function (err) {
        console.debug('[footer] keeping baked fallback for #' + slotId + ':', err.message)
      })
  }

  injectFragment('footer-links', 'footer-links.html')
  injectFragment('footer-trademarks', 'footer-trademarks.html')
})()
