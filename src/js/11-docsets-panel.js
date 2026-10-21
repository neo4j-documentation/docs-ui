;(function () {
  'use strict'

  // Populates the docsets modal (#docsets-modal-root), on first open, from the aggregated
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
  // Each component renders as one row in a single-column list (alphabetical by
  // component title): the title links to the selected version's first page, a
  // <select> picks the version (latest first, preselected; a plain label when
  // there's only one) and a PDF link follows the selected version (see pdfUrl). The current page's component is marked
  // is-current.
  //
  // Also wires the header toggle (#docsets-toggle) to open the <dialog> and
  // the close button to dismiss it.

  var root = document.getElementById('docsets-modal-root')
  var modal = document.getElementById('docsets-modal')
  var toggle = document.getElementById('docsets-toggle')
  var closeBtn = document.getElementById('docsets-modal-close')
  if (!root || !modal || !toggle) return

  toggle.addEventListener('click', function () {
    load()
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

  // Set at build time (page-no-local-manifest) for deploys - staging, prod -
  // that never serve this file. Skip the request rather than let it 404: a
  // failed fetch's console noise isn't suppressible from JS once issued.
  var skipLocalManifest = body.dataset.noLocalManifest === 'true'

  // Fetch tabs.json + local-manifest.json in parallel, once, the first time the
  // modal is opened - readers who never open it don't pay for the requests.
  // The manifest is optional (404 on prod) so its failure just means "treat
  // everything as local."
  var loaded = false

  function load () {
    if (loaded) return
    loaded = true
    Promise.all([
      fetchJson(NAV_URL).catch(function (err) {
        console.warn('[docsets-panel] tabs.json fetch failed:', err.message)
        return null
      }),
      skipLocalManifest ? Promise.resolve(null) : fetchJson(MANIFEST_URL).catch(function () { return null }),
    ]).then(function (results) {
      var tabs = results[0]
      var manifest = results[1]
      if (manifest && manifest.components) localComponents = manifest.components
      if (tabs) render(tabs)
    })
  }

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
          } else {
            if (vd.latest) entry.versions[v].latest = true
            // A component can appear in several tabs (e.g. a driver shows up in
            // both drivers-apis and the provisional-tab). The first occurrence may
            // have no linkable item — provisional entries often don't — which would
            // leave the chip pointing at '#'. Backfill the URL from any later tab
            // that does have one.
            if (!entry.versions[v].url) entry.versions[v].url = findFirstUrl(vd.items)
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

  // A version's PDF lives at <component>[/<version>]/neo4j-<component>[-<version>].pdf
  // - the version segment is omitted for unversioned docsets. Same base-URL rules
  // as resolveHref. Every docset is assumed to build a PDF, so the link is always
  // shown.
  function pdfUrl (component, version) {
    var path = '/' + component + (version ? '/' + version : '') +
      '/neo4j-' + component + (version ? '-' + version : '') + '.pdf'
    var isLocal = !localComponents ||
      !!(localComponents[component] && localComponents[component].indexOf(version) !== -1)
    if (!isLocal && docsUrl) return docsUrl + path
    return prefixSitePath(path)
  }

  function createPdfLink (component, version) {
    var a = document.createElement('a')
    a.className = 'pdf-link docset-link'
    a.textContent = 'PDF'
    a.href = pdfUrl(component, version)
    return a
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
    // The title is plain text. Every way into a docset lives in the version
    // entries: `<version> | HTML | PDF`. With several versions they sit in a
    // dropdown (same markup/classes as the page's version dropdown); with one
    // version, or none, the single entry is shown inline.
    var titleDiv = document.createElement('div')
    titleDiv.className = 'title'
    titleDiv.textContent = entry.title
    li.appendChild(titleDiv)

    var controls = document.createElement('div')
    controls.className = 'controls'
    li.appendChild(controls)

    if (versionKeys.length === 1) {
      var inline = renderVersionEntry(name, entry, versionKeys[0], false)
      inline.classList.add('is-inline')
      controls.appendChild(inline)
      return li
    }

    var defaultVersion = (name === currentComponent && entry.versions[currentVersion]) ? currentVersion : versionKeys[0]
    var dropdown = document.createElement('div')
    dropdown.className = 'dropdown version-dropdown'
    var trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.className = 'version-dropdown-trigger dropdown-styles'
    trigger.setAttribute('aria-haspopup', 'true')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-label', entry.title + ' versions')
    var triggerLabel = document.createElement('span')
    triggerLabel.className = 'version-dropdown-trigger-label'
    triggerLabel.textContent = defaultVersion + (entry.versions[defaultVersion].latest ? ' (latest)' : '')
    trigger.appendChild(triggerLabel)
    dropdown.appendChild(trigger)

    var list = document.createElement('ul')
    list.className = 'version-dropdown-list'
    versionKeys.forEach(function (v) {
      var item = document.createElement('li')
      if (name === currentComponent && v === currentVersion) item.classList.add('is-current')
      item.appendChild(renderVersionEntry(name, entry, v, true))
      list.appendChild(item)
    })
    dropdown.appendChild(list)
    controls.appendChild(dropdown)

    trigger.addEventListener('click', function (e) {
      e.stopPropagation()
      var wasActive = dropdown.classList.contains('is-active')
      closeDropdowns()
      if (!wasActive) {
        dropdown.classList.add('is-active')
        trigger.setAttribute('aria-expanded', 'true')
      }
    })
    return li
  }

  // `<version> | HTML | PDF` - the version name is plain text, HTML and PDF are
  // the two links. An unversioned docset has no version name to show.
  function renderVersionEntry (name, entry, v, showLatest) {
    var row = document.createElement('div')
    row.className = 'version-entry'
    var label = document.createElement('span')
    label.className = 'version-name'
    label.textContent = v ? v + (showLatest && entry.versions[v].latest ? ' (latest)' : '') : ''
    if (v) row.appendChild(label)
    var html = document.createElement('a')
    html.className = 'version-selector docset-link'
    html.textContent = 'HTML'
    html.href = resolveHref(name, v, entry.versions[v].url)
    row.appendChild(html)
    row.appendChild(createPdfLink(name, v))
    return row
  }

  function closeDropdowns () {
    root.querySelectorAll('.version-dropdown.is-active').forEach(function (d) {
      d.classList.remove('is-active')
      d.querySelector('.version-dropdown-trigger').setAttribute('aria-expanded', 'false')
    })
  }

  document.addEventListener('click', closeDropdowns)
  modal.addEventListener('close', closeDropdowns)
  modal.addEventListener('keydown', function (e) {
    // Escape closes an open version list first; only a second Escape closes the dialog.
    if (e.key === 'Escape' && root.querySelector('.version-dropdown.is-active')) {
      e.preventDefault()
      closeDropdowns()
    }
  })
})()
