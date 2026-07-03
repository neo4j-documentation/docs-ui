;(function () {
  'use strict'

  // Populates the docsets modal (#docsets-modal-root) from the aggregated
  // tabs.json. The modal lists every component+version that's in the
  // cross-docset nav — not just the ones built in this Antora run — so a
  // single-docset preview shows links to every other docset on the fleet.
  //
  // Per-chip URL resolution:
  //   - Component IS in the local manifest → use the local URL (works in one
  //     click against this build).
  //   - Component is NOT in the local manifest → use DOCS_URL + path so the
  //     click goes straight to the published version rather than bouncing
  //     through the not-built-here fallback.
  //   - No manifest available (typical on production publishes where the flag
  //     isn't set) → use the local URL for everything; on prod that IS the
  //     published location, so this works out.
  //
  // Each component renders as a row with the component title on top and a
  // chip per version below (alphabetical by component title; latest version
  // first within each component). The current page's component+version is
  // marked is-current so the modal can highlight it.
  //
  // Also wires the header toggle (#docsets-toggle) to open the <dialog> and
  // the close button to dismiss it.

  var root = document.getElementById('docsets-modal-root')
  var modal = document.getElementById('docsets-modal')
  var toggle = document.getElementById('docsets-toggle')
  var closeBtn = document.getElementById('docsets-modal-close')
  if (!root || !modal || !toggle) return

  toggle.addEventListener('click', function () {
    if (typeof modal.showModal === 'function') modal.showModal()
    else modal.setAttribute('open', '')
  })
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      if (typeof modal.close === 'function') modal.close()
      else modal.removeAttribute('open')
    })
  }
  modal.addEventListener('click', function (event) {
    if (event.target === modal && typeof modal.close === 'function') modal.close()
  })

  var body = document.body
  var sitePath = body.dataset.sitePath || ''
  var NAV_URL = sitePath + '/nav/tabs.json'
  var MANIFEST_URL = sitePath + '/local-manifest.json'
  var currentComponent = body.dataset.pageComponent || ''
  var currentVersion = body.dataset.pageVersion || ''
  var docsUrl = readDocsUrl()
  var localComponents = null // populated from manifest if available

  // Fetch tabs.json + local-manifest.json in parallel; manifest is optional
  // (404 on prod) so its failure just means "treat everything as local."
  Promise.all([
    fetchJson(NAV_URL).catch(function (err) {
      console.warn('[docsets-panel] tabs.json fetch failed:', err.message)
      return null
    }),
    fetchJson(MANIFEST_URL).catch(function () { return null }),
  ]).then(function (results) {
    var tabs = results[0]
    var manifest = results[1]
    if (manifest && manifest.components) localComponents = manifest.components
    if (tabs) render(tabs)
  })

  function fetchJson (url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    })
  }

  function readDocsUrl () {
    var meta = document.querySelector('meta[name="docs-url"]')
    var raw = meta ? meta.getAttribute('content') : null
    return raw ? raw.replace(/\/+$/, '') : null
  }

  function render (tabs) {
    var components = collectComponents(tabs)
    var names = Object.keys(components).sort(function (a, b) {
      return components[a].title.toLowerCase().localeCompare(components[b].title.toLowerCase())
    })
    var ul = document.createElement('ul')
    ul.className = 'components'
    names.forEach(function (name) {
      ul.appendChild(renderComponent(name, components[name]))
    })
    root.innerHTML = ''
    root.appendChild(ul)
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

  // Resolve a (component, version, rawUrl) tuple to the right href:
  //   - Locally built → local URL (with sitePath prefix).
  //   - Not locally built, DOCS_URL set → docs URL + raw path.
  //   - Otherwise → local URL (covers prod, where local == published).
  function resolveHref (component, version, rawUrl) {
    if (!rawUrl) return '#'
    var isLocal = !localComponents
      ? true
      : !!(localComponents[component] &&
           localComponents[component].indexOf(version) !== -1)
    if (isLocal) return prefixSitePath(rawUrl)
    if (docsUrl) return docsUrl + rawUrl
    return prefixSitePath(rawUrl)
  }

  function renderComponent (name, entry) {
    var li = document.createElement('li')
    li.className = 'component'
    if (name === currentComponent) li.classList.add('is-current')

    var versionKeys = Object.keys(entry.versions).sort(function (a, b) {
      if (entry.versions[a].latest && !entry.versions[b].latest) return -1
      if (!entry.versions[a].latest && entry.versions[b].latest) return 1
      return b.localeCompare(a)
    })
    var hasShowableVersion = versionKeys.some(function (v) { return v })

    var titleDiv = document.createElement('div')
    titleDiv.className = 'title'
    li.appendChild(titleDiv)

    // Unversioned docset (single empty-string version, e.g. aura): there are
    // no version chips to click, so make the title itself the link to the
    // docset's first page.
    if (!hasShowableVersion) {
      var uv = versionKeys[0] || ''
      var slot = entry.versions[uv]
      if (name === currentComponent) titleDiv.classList.add('is-current')
      var titleLink = document.createElement('a')
      titleLink.href = resolveHref(name, uv, slot && slot.url)
      titleLink.textContent = entry.title
      titleDiv.appendChild(titleLink)
      return li
    }

    titleDiv.appendChild(document.createTextNode(entry.title))

    var versionsUl = document.createElement('ul')
    versionsUl.className = 'versions'
    versionKeys.forEach(function (v) {
      var versionLi = document.createElement('li')
      versionLi.className = 'version'
      if (entry.versions[v].latest) versionLi.classList.add('is-latest')
      if (name === currentComponent && v === currentVersion) versionLi.classList.add('is-current')
      var a = document.createElement('a')
      a.href = resolveHref(name, v, entry.versions[v].url)
      a.textContent = v || entry.title
      versionLi.appendChild(a)
      versionsUl.appendChild(versionLi)
    })
    li.appendChild(versionsUl)
    return li
  }
})()
