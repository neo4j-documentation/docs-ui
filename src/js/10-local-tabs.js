;(function () {
  'use strict'

  // Local-mode tab decoration.
  //
  // When running against a local docs build (detected by the presence of a
  // /docs/local-manifest.json endpoint served by @neo4j-antora/tabbed-nav's
  // middleware), find which tabs have at least one component that was built
  // locally. For each such tab:
  //   - add a `has-local-content` class to the <li> so CSS can mark it visually
  //   - rewrite the <a href> to the first locally-built page in that tab, so
  //     clicking it lands somewhere useful instead of a tab root that wasn't
  //     built in this docset's preview
  //
  // Bails silently on prod/staging (the manifest endpoint 404s).

  var body = document.body
  if (!body) return

  var sitePath = body.dataset.sitePath || ''
  var MANIFEST_URL = sitePath + '/local-manifest.json'
  var NAV_URL = sitePath + '/nav/tabs.json'

  fetchJson(MANIFEST_URL)
    .then(function (manifest) {
      if (!manifest || !manifest.components || !manifest.components.length) return null
      return fetchJson(NAV_URL).then(function (tabs) {
        if (tabs) decorate(manifest.components, tabs)
      })
    })
    .catch(function () { /* not local mode, or fetch failed — leave tabs as-is */ })

  function fetchJson (url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    })
  }

  function findFirstUrl (items) {
    if (!items || !items.length) return null
    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      if (item.url) return item.url
      var deeper = findFirstUrl(item.items)
      if (deeper) return deeper
    }
    return null
  }

  // For a single tab, walk its components in tabIndex order (the order
  // Object.keys returns matches the order the consume stage sorted them in).
  // Return the URL of the first item in the first locally-built component.
  function firstLocalUrlForTab (tabData, localSet) {
    if (!tabData) return null
    var components = Object.keys(tabData)
    for (var i = 0; i < components.length; i++) {
      if (!localSet[components[i]]) continue
      var versions = tabData[components[i]]
      var versionKeys = Object.keys(versions)
      for (var v = 0; v < versionKeys.length; v++) {
        var url = findFirstUrl(versions[versionKeys[v]].items)
        if (url) return url
      }
    }
    return null
  }

  // tabs.json item.url is the page's pub.url (no site-path prefix), e.g.
  // "/operations-manual/install/index.html". Prefix with sitePath so the
  // link resolves to the served URL.
  function prefixSitePath (url) {
    if (!url) return ''
    var siteParts = sitePath.split('/').filter(Boolean)
    var urlParts = url.split('/').filter(Boolean)
    var stripCount = 0
    for (var i = 0; i < Math.min(siteParts.length, urlParts.length); i++) {
      if (urlParts[i] === siteParts[i]) stripCount++
      else break
    }
    if (stripCount > 0) urlParts.splice(0, stripCount)
    return '/' + siteParts.concat(urlParts).join('/')
  }

  function decorate (localComponents, allTabs) {
    var localSet = {}
    for (var i = 0; i < localComponents.length; i++) localSet[localComponents[i]] = true

    var lis = document.querySelectorAll('.category-tabs li[data-tab-id]')
    Array.prototype.forEach.call(lis, function (li) {
      var tabId = li.getAttribute('data-tab-id')
      var url = firstLocalUrlForTab(allTabs[tabId], localSet)
      if (!url) return
      li.classList.add('has-local-content')
      var a = li.querySelector('a')
      if (a) a.setAttribute('href', prefixSitePath(url))
    })
  }
})()
