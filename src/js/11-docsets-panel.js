;(function () {
  'use strict'

  // Populates the docsets modal (#docsets-modal-root), on first open, from the aggregated
  // docsets.json (a flat per-docset listing the tabbed-nav extension generates alongside
  // tabs.json). The modal lists every component+version that's in the
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
  // there's only one) and a PDF link (only when docsets.json lists one) follows the selected version. The current page's component is marked
  // is-current.
  //
  // The toolbar's A-Z button and Group button switch between that flat list and a grouped view: one
  // headed section per group (docsets.json `group`, sections and rows both A-Z),
  // with docsets that have no group under "Other".
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
  var NAV_URL = sitePath + '/nav/docsets.json'
  var MANIFEST_URL = sitePath + '/local-manifest.json'
  var currentComponent = body.dataset.pageComponent || ''
  var currentVersion = body.dataset.pageVersion || ''
  var docsUrl = readDocsUrl()
  var localComponents = null // populated from manifest if available

  // Set at build time (page-no-local-manifest) for deploys - staging, prod -
  // that never serve this file. Skip the request rather than let it 404: a
  // failed fetch's console noise isn't suppressible from JS once issued.
  var skipLocalManifest = body.dataset.noLocalManifest === 'true'

  // Fetch docsets.json + local-manifest.json in parallel, once, the first time the
  // modal is opened - readers who never open it don't pay for the requests.
  // The manifest is optional (404 on prod) so its failure just means "treat
  // everything as local."
  var loaded = false

  function load () {
    if (loaded) return
    loaded = true
    Promise.all([
      fetchJson(NAV_URL).catch(function (err) {
        console.warn('[docsets-panel] docsets.json fetch failed:', err.message)
        return null
      }),
      skipLocalManifest ? Promise.resolve(null) : fetchJson(MANIFEST_URL).catch(function () { return null }),
    ]).then(function (results) {
      var docsets = results[0]
      var manifest = results[1]
      if (manifest && manifest.components) localComponents = manifest.components
      if (Array.isArray(docsets)) render(docsets)
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

  // The list sits under a toolbar (pinned below the modal title) holding the sort toggle (A-Z / Z-A by docset
  // title). Toggling reorders the existing rows rather than rebuilding them, so
  // open dropdowns and focus survive. The toolbar is where a future "view by
  // group" switch would go too.
  // TEMPORARY: until docsets set page-docset-group themselves, a docset whose
  // docsets.json `group` is empty is placed here by name. Delete once real groups arrive.
  var PLACEHOLDER_GROUPS = {
    'Get started': ['getting-started', 'aura', 'tutorials', 'desktop', 'browser', 'bloom-user-guide', 'data-importer'],
    'Query and develop': ['cypher-manual', 'cypher-builder', 'query-api', 'http-api', 'bolt', 'status-codes', 'neo4j-glossary'],
    'Drivers and APIs': ['java-manual', 'python-manual', 'javascript-manual', 'go-manual', 'dotnet-manual', 'java-reference'],
    Operations: ['operations-manual', 'ops-manager', 'upgrade-migration-guide', 'kerberos-add-on', 'cdc', 'plugin', 'apoc',
      'enterprise-studio'],
    'Graph analytics': ['graph-data-science', 'graph-data-science-client',
      'graph-intelligence-microsoft-fabric', 'snowflake-graph-analytics', 'gds-bigquery', 'virtual-graph'],
    Integrations: ['kafka', 'kafka-streams', 'spark', 'data-ingestion-guide', 'dataflow-bigquery', 'dataflow-google-cloud', 'neo4j-aws-glue', 'mcp'],
  }

  function placeholderGroup (name) {
    var found = ''
    Object.keys(PLACEHOLDER_GROUPS).forEach(function (g) {
      if (PLACEHOLDER_GROUPS[g].indexOf(name) !== -1) found = g
    })
    return found
  }

  var OTHER_GROUP = 'Other'

  function render (docsets) {
    var components = collectComponents(docsets)
    var names = Object.keys(components).sort(function (a, b) {
      return components[a].title.toLowerCase().localeCompare(components[b].title.toLowerCase())
    })
    var ul = document.createElement('ul')
    ul.className = 'components'
    var groupOf = {}
    var rows = names.map(function (name) {
      var row = renderComponent(name, components[name])
      groupOf[name] = components[name].group || placeholderGroup(name) || OTHER_GROUP
      row.dataset.name = name
      return row
    })
    // The container the list or the grouped sections go in; rebuilt on every change
    // by moving the same row elements, so open dropdowns and focus survive.
    var list = document.createElement('div')
    list.className = 'docsets-list'

    var toolbar = document.createElement('div')
    toolbar.className = 'docsets-toolbar'
    // Two joined buttons that are really two modes of one control: the A-Z / Z-A button
    // is the flat list, "Group" is the grouped view. Clicking Group enters the grouped
    // view; clicking the sort button while grouped returns to the flat list, and clicking
    // it again reverses the order.
    var modeSwitch = document.createElement('div')
    modeSwitch.className = 'view-switch'
    modeSwitch.setAttribute('role', 'group')
    modeSwitch.setAttribute('aria-label', 'Order docsets')
    var sortBtn = document.createElement('button')
    sortBtn.type = 'button'
    sortBtn.className = 'view-toggle sort-toggle'
    var sortLabel = document.createElement('span')
    var sortIcon = document.createElement('span')
    sortIcon.className = 'sort-icon'
    sortIcon.setAttribute('aria-hidden', 'true')
    sortBtn.appendChild(sortLabel)
    sortBtn.appendChild(sortIcon)
    var groupBtn = document.createElement('button')
    groupBtn.type = 'button'
    groupBtn.className = 'view-toggle'
    groupBtn.textContent = 'Group'
    modeSwitch.appendChild(sortBtn)
    modeSwitch.appendChild(groupBtn)
    toolbar.appendChild(modeSwitch)

    var descending = false
    var grouped = false
    function applyView () {
      sortBtn.classList.toggle('is-desc', descending)
      sortLabel.textContent = descending ? 'Sort Z-A' : 'Sort A-Z'
      sortBtn.setAttribute('aria-label', 'Sort docsets by title, currently ' + (descending ? 'Z to A' : 'A to Z'))
      groupBtn.setAttribute('aria-pressed', String(grouped))
      groupBtn.classList.toggle('is-active', grouped)
      sortBtn.setAttribute('aria-pressed', String(!grouped))
      sortBtn.classList.toggle('is-active', !grouped)
      var ordered = descending ? rows.slice().reverse() : rows
      list.innerHTML = ''
      if (!grouped) {
        ordered.forEach(function (row) { ul.appendChild(row) })
        list.appendChild(ul)
        return
      }
      var byGroup = {}
      ordered.forEach(function (row) {
        var g = groupOf[row.dataset.name]
        ;(byGroup[g] || (byGroup[g] = [])).push(row)
      })
      // The sort direction applies to the docsets inside each group; the group headings
      // themselves stay A-Z, with "Other" last.
      var groupNames = Object.keys(byGroup).filter(function (g) { return g !== OTHER_GROUP }).sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase())
      })
      if (byGroup[OTHER_GROUP]) groupNames.push(OTHER_GROUP)
      groupNames.forEach(function (g) {
        var section = document.createElement('section')
        section.className = 'docsets-group'
        var heading = document.createElement('h3')
        heading.className = 'docsets-group-title'
        heading.textContent = g
        var groupUl = document.createElement('ul')
        groupUl.className = 'components'
        byGroup[g].forEach(function (row) { groupUl.appendChild(row) })
        section.appendChild(heading)
        section.appendChild(groupUl)
        list.appendChild(section)
      })
    }
    sortBtn.addEventListener('click', function () {
      // From the grouped view this only leaves it; the order flips on the next click.
      if (grouped) grouped = false
      else descending = !descending
      applyView()
    })
    groupBtn.addEventListener('click', function () {
      grouped = true
      applyView()
    })
    applyView()

    // The toolbar lives in its own strip under the modal title, outside the scrolling
    // body, so it stays put while the list scrolls. Created here rather than in the page
    // template so pages built before this existed still get it.
    var toolbarRoot = document.getElementById('docsets-modal-toolbar')
    if (!toolbarRoot) {
      toolbarRoot = document.createElement('div')
      toolbarRoot.id = 'docsets-modal-toolbar'
      toolbarRoot.className = 'docsets-modal__toolbar'
      root.parentNode.insertBefore(toolbarRoot, root)
    }
    toolbarRoot.innerHTML = ''
    toolbarRoot.appendChild(toolbar)
    root.innerHTML = ''
    root.appendChild(list)
  }

  // Folds docsets.json ([{ name, title, versions: [{ version, latest, url, pdf }] }])
  // into a { component: { title, group, versions: { v: { latest, url, pdf } } } } map.
  function collectComponents (docsets) {
    var components = {}
    docsets.forEach(function (docset) {
      var versions = {}
      ;(docset.versions || []).forEach(function (v) {
        versions[v.version || ''] = { latest: !!v.latest, url: v.url || null, pdf: v.pdf || null }
      })
      components[docset.name] = { title: docset.title || docset.name, group: docset.group || '', versions: versions }
    })
    return components
  }

  // docsets.json URLs are publication URLs without the site-path prefix,
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

  // docsets.json only sets `pdf` when the file exists, so the link is only shown
  // then. Same base-URL rules as resolveHref.
  function pdfUrl (component, version, rawPdf) {
    var isLocal = !localComponents ||
      !!(localComponents[component] && localComponents[component].indexOf(version) !== -1)
    if (!isLocal && docsUrl) return docsUrl + rawPdf
    return prefixSitePath(rawPdf)
  }

  function createPdfLink (component, version, rawPdf) {
    var a = document.createElement('a')
    a.className = 'pdf-link docset-link'
    a.textContent = 'PDF'
    a.href = pdfUrl(component, version, rawPdf)
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
    if (entry.versions[v].pdf) row.appendChild(createPdfLink(name, v, entry.versions[v].pdf))
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
