;(function () {
  'use strict'

  // Populates the docsets nav panel (#docsets-panel-root) from the aggregated
  // tabs.json. The panel lists every component+version that's in the
  // cross-docset nav — not just the ones built in this Antora run — so a
  // single-docset preview shows links to every other docset on the fleet.
  //
  // Each component renders as a row with the component title on top and a
  // chip per version below (alphabetical by component title; latest version
  // first within each component). The current page's component+version is
  // marked is-current so the panel can highlight it.

  var root = document.getElementById('docsets-panel-root')
  if (!root) return

  var body = document.body
  var sitePath = body.dataset.sitePath || ''
  var NAV_URL = sitePath + '/nav/tabs.json'
  var currentComponent = body.dataset.pageComponent || ''
  var currentVersion = body.dataset.pageVersion || ''

  fetch(NAV_URL, { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    })
    .then(render)
    .catch(function (err) {
      console.warn('[docsets-panel] fetch failed; panel will stay empty:', err.message)
    })

  function render (tabs) {
    var components = collectComponents(tabs)
    var names = Object.keys(components).sort(function (a, b) {
      return components[a].title.toLowerCase().localeCompare(components[b].title.toLowerCase())
    })
    var fragment = document.createDocumentFragment()
    names.forEach(function (name) {
      fragment.appendChild(renderComponent(name, components[name]))
    })
    root.innerHTML = ''
    root.appendChild(fragment)
  }

  // Walks every tab → component → version slot in tabs.json and folds them
  // into a flat { component: { title, versions: { v: { latest, url } } } }
  // map. A component can appear in multiple tabs; the first occurrence wins
  // for the title (they should agree). A version's URL is derived from the
  // first item in versionData.items that has a url, recursing into children
  // if necessary.
  function collectComponents (tabs) {
    var components = {}
    Object.keys(tabs).forEach(function (tabId) {
      var compMap = tabs[tabId]
      Object.keys(compMap).forEach(function (compName) {
        var entry = components[compName] || (components[compName] = { title: compName, versions: {} })
        var versions = compMap[compName]
        Object.keys(versions).forEach(function (v) {
          var vd = versions[v]
          if (entry.title === compName && vd.title) entry.title = vd.title
          if (!entry.versions[v]) {
            entry.versions[v] = {
              latest: !!vd.latest,
              url: findFirstUrl(vd.items),
            }
          } else if (vd.latest) {
            entry.versions[v].latest = true
          }
        })
      })
    })
    return components
  }

  function findFirstUrl (items) {
    if (!items || !items.length) return null
    for (var i = 0; i < items.length; i++) {
      if (items[i].url) return items[i].url
      var deeper = findFirstUrl(items[i].items)
      if (deeper) return deeper
    }
    return null
  }

  // tabs.json item URLs are publication URLs without the site-path prefix,
  // e.g. "/cypher-manual/25/foo.html". Prefix sitePath if not already there.
  function prefixSitePath (url) {
    if (!url) return ''
    if (!sitePath) return url
    if (url.indexOf(sitePath + '/') === 0) return url
    return sitePath + url
  }

  function renderComponent (name, entry) {
    var li = document.createElement('li')
    li.className = 'component'
    if (name === currentComponent) li.classList.add('is-current')

    var titleDiv = document.createElement('div')
    titleDiv.className = 'title'
    var titleText = document.createTextNode(entry.title)
    // No URL on the title itself — the version chips are the navigable
    // entries. (Antora's stock panel links the title to the docset's start
    // page, but we don't have that URL distinctly from version URLs here.)
    titleDiv.appendChild(titleText)
    li.appendChild(titleDiv)

    var versionKeys = Object.keys(entry.versions).sort(function (a, b) {
      if (entry.versions[a].latest && !entry.versions[b].latest) return -1
      if (!entry.versions[a].latest && entry.versions[b].latest) return 1
      return b.localeCompare(a)
    })
    var hasShowableVersion = versionKeys.some(function (v) { return v })
    if (versionKeys.length > 1 || hasShowableVersion) {
      var versionsUl = document.createElement('ul')
      versionsUl.className = 'versions'
      versionKeys.forEach(function (v) {
        var versionLi = document.createElement('li')
        versionLi.className = 'version'
        if (entry.versions[v].latest) versionLi.classList.add('is-latest')
        if (name === currentComponent && v === currentVersion) versionLi.classList.add('is-current')
        var a = document.createElement('a')
        a.href = prefixSitePath(entry.versions[v].url || '#')
        a.textContent = v || entry.title
        versionLi.appendChild(a)
        versionsUl.appendChild(versionLi)
      })
      li.appendChild(versionsUl)
    }
    return li
  }
})()
