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
  // The Group button in the title bar switches between that flat list and a grouped view: one
  // headed section per group (docsets.json `group`, sections and rows both A-Z),
  // with docsets that have no group under "Other".
  //
  // The modal itself (dialog, title, close button and list container) is
  // built here, not in the page template, so its markup and wording change for every page
  // at once instead of depending on when the page was built. The page only carries the
  // header toggle (#docsets-toggle); any modal an older template baked in is replaced.
  // This wires that toggle to open the <dialog> and the close button to dismiss it.

  var toggle = document.getElementById('docsets-toggle')
  if (!toggle) return

  var oldModal = document.getElementById('docsets-modal')
  if (oldModal) oldModal.remove()

  var modal = document.createElement('dialog')
  modal.id = 'docsets-modal'
  modal.className = 'docsets-modal'
  modal.setAttribute('aria-labelledby', 'docsets-modal-title')

  var modalHeader = document.createElement('header')
  modalHeader.className = 'docsets-modal__header'
  var modalTitle = document.createElement('h2')
  modalTitle.id = 'docsets-modal-title'
  modalTitle.textContent = 'All Neo4j documentation'
  var closeBtn = document.createElement('button')
  closeBtn.id = 'docsets-modal-close'
  closeBtn.className = 'docsets-modal__close'
  closeBtn.type = 'button'
  closeBtn.setAttribute('aria-label', 'Close')
  closeBtn.textContent = '\u00d7'
  // View option for the whole dialog, so it sits in the title bar; wired up once the list is
  // rendered (render() below)
  var groupToggle = document.createElement('button')
  groupToggle.className = 'docsets-modal__group'
  groupToggle.type = 'button'
  groupToggle.textContent = 'Group'
  groupToggle.setAttribute('aria-pressed', 'false')
  groupToggle.disabled = true
  var modalActions = document.createElement('div')
  modalActions.className = 'docsets-modal__actions'
  modalActions.appendChild(groupToggle)
  modalActions.appendChild(closeBtn)
  modalHeader.appendChild(modalTitle)
  modalHeader.appendChild(modalActions)

  var root = document.createElement('div')
  root.id = 'docsets-modal-root'
  root.className = 'docsets-modal__body'

  modal.appendChild(modalHeader)
  modal.appendChild(root)
  // Right after the toggle, where the template used to put it, so it inherits the same styles.
  toggle.insertAdjacentElement('afterend', modal)

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

  // The list sits under a header row (Docset, which sorts it A-Z / Z-A, and Versions), stuck to
  // the top of the scrolling body. Sorting and grouping reorder the existing rows rather than
  // rebuilding them, so open dropdowns and focus survive.
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

    // Column headings: "Docset" sorts the list (the same sort arrows as Needle's tables) and
    // "Versions" sits over the version controls.
    var columns = document.createElement('div')
    columns.className = 'docsets-columns'
    var sortBtn = document.createElement('button')
    sortBtn.type = 'button'
    sortBtn.className = 'sort-head'
    var sortLabel = document.createElement('span')
    sortLabel.textContent = 'Docset'
    var sortIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    sortIcon.setAttribute('viewBox', '0 0 24 24')
    sortIcon.setAttribute('fill', 'none')
    sortIcon.setAttribute('stroke', 'currentColor')
    sortIcon.setAttribute('stroke-width', '1.5')
    sortIcon.setAttribute('stroke-linecap', 'round')
    sortIcon.setAttribute('stroke-linejoin', 'round')
    sortIcon.setAttribute('aria-hidden', 'true')
    var sortPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    sortIcon.appendChild(sortPath)
    sortBtn.appendChild(sortLabel)
    sortBtn.appendChild(sortIcon)
    var versionsHead = document.createElement('span')
    versionsHead.className = 'docsets-columns-versions'
    versionsHead.textContent = 'Versions'
    columns.appendChild(sortBtn)
    columns.appendChild(versionsHead)

    var descending = false
    var grouped = false
    function applyView () {
      // Needle's table icons: bars with an up arrow for ascending, a down arrow for descending
      sortPath.setAttribute('d', descending
        ? 'M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25'
        : 'M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12')
      sortBtn.setAttribute('aria-label', 'Sort docsets by title, currently ' + (descending ? 'Z to A' : 'A to Z'))
      groupToggle.setAttribute('aria-pressed', String(grouped))
      groupToggle.classList.toggle('is-active', grouped)
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
      descending = !descending
      applyView()
    })
    groupToggle.addEventListener('click', function () {
      grouped = !grouped
      applyView()
    })
    groupToggle.disabled = false
    applyView()

    // The column headings are the first row of the scrolling body, stuck to its top (see the
    // CSS), so they are exactly as wide as the rows below, scrollbar and all.
    root.innerHTML = ''
    root.appendChild(columns)
    root.appendChild(list)
  }

  // Folds docsets.json ([{ name, title, versions: [{ version, latest, selectorText, url, pdf }] }])
  // into a { component: { title, group, versions: { v: { latest, selectorText, url, pdf } } } } map.
  function collectComponents (docsets) {
    var components = {}
    docsets.forEach(function (docset) {
      var versions = {}
      ;(docset.versions || []).forEach(function (v) {
        versions[v.version || ''] = { latest: !!v.latest, selectorText: v.selectorText, url: v.url || null, pdf: v.pdf || null }
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
    // entries: `<version> | HTML | PDF`. With one version, or none, that entry is shown
    // inline. With several, the same entry is shown for the default version (the page's
    // own, otherwise the latest), the whole of it styled as one select box with a chevron at
    // the end that opens the rest, so HTML and PDF are one click away. A single-version
    // row is the same entry without the box and chevron, in the same columns.
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
    // The default version's entry, styled as one select box (see docsets-modal.css), with the
    // chevron button that opens the list at its end. Clicking anywhere in the box that is
    // not a link opens it too.
    var head = renderVersionEntry(name, entry, defaultVersion, true)
    head.classList.add('version-dropdown-head')
    var trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.className = 'version-dropdown-trigger'
    trigger.setAttribute('aria-haspopup', 'true')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-label', entry.title + ': ' + versionKeys.length + ' versions')
    trigger.title = versionKeys.length + ' versions'
    var chevron = document.createElement('span')
    chevron.className = 'version-dropdown-chevron'
    chevron.setAttribute('aria-hidden', 'true')
    trigger.appendChild(chevron)
    // takes the place of the chevron's stand-in at the end of the entry
    head.replaceChild(trigger, head.querySelector('.version-slot'))
    head.addEventListener('click', function (e) {
      if (e.target.closest('a')) return
      // Stop the click reaching the document, which closes any open list
      e.stopPropagation()
      trigger.click()
    })
    dropdown.appendChild(head)

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
  // The text after the version, as in the page's version selector: "(Current)", "(LTS)" or
  // both, from docsets.json's selectorText. Falls back to "(Current)" for the latest version of
  // a docset that has not been built since selectorText existed.
  function versionMarker (versionData) {
    if (versionData.selectorText !== undefined) return versionData.selectorText
    return versionData.latest ? '(Current)' : ''
  }

  function renderVersionEntry (name, entry, v, showMarkers) {
    var row = document.createElement('div')
    row.className = 'version-entry'
    var label = document.createElement('span')
    label.className = 'version-name'
    label.textContent = v
    var marker = showMarkers ? versionMarker(entry.versions[v]) : ''
    if (v && marker) {
      // the same text the page's version selector shows after the version, e.g. (Current), (LTS)
      var tag = document.createElement('span')
      tag.className = 'version-tag'
      tag.textContent = marker
      label.appendChild(document.createTextNode(' '))
      label.appendChild(tag)
    }
    row.appendChild(label)
    var html = document.createElement('a')
    html.className = 'version-selector docset-link'
    html.textContent = 'HTML'
    html.href = resolveHref(name, v, entry.versions[v].url)
    row.appendChild(html)
    if (entry.versions[v].pdf) {
      row.appendChild(createPdfLink(name, v, entry.versions[v].pdf))
    } else {
      // An invisible copy of the PDF link where there is none, so HTML sits in the same place
      // as in rows that have one, with no widths to keep in step with the text
      var noPdf = document.createElement('span')
      noPdf.className = 'pdf-link docset-link is-placeholder'
      noPdf.setAttribute('aria-hidden', 'true')
      noPdf.textContent = 'PDF'
      row.appendChild(noPdf)
    }
    // The chevron's place at the end of the entry: empty here, the button in the one that
    // has several versions to choose from
    var slot = document.createElement('span')
    slot.className = 'version-slot'
    slot.setAttribute('aria-hidden', 'true')
    row.appendChild(slot)
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
