;(function () {
  'use strict'

  // Render-time nav fetching.
  //
  // The page provides its own component+version nav as JSON in <script id="page-nav-data">.
  // The runtime fetch supplies the aggregate (latest of every other docset, all versions
  // of grouped docsets). We combine the two: the current component comes from the page
  // (correct for whatever version the user is on); everything else comes from the fetch
  // (always-fresh aggregate).

  // ---------------------------------------------------------------------------
  // Page context
  // ---------------------------------------------------------------------------

  var navRoot = document.getElementById('nav-root')
  if (!navRoot) return

  var body = document.body
  var pageContext = {
    url: body.dataset.pageUrl || '',
    component: body.dataset.pageComponent || '',
    version: body.dataset.pageVersion || '',
    tabs: body.dataset.pageTabs || '',
    tabsGroup: body.dataset.pageTabsGroup || '',
  }

  if (!pageContext.tabs) {
    console.debug('[nav-fetch] page has no tab; keeping build-time nav')
    return
  }

  var sitePath = (function () {
    var match = window.location.pathname.match(/^(\/[^/]+)\//)
    return match ? match[1] : ''
  })()

  var NAV_URL = sitePath + '/nav/tabs.json'

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  fetch(NAV_URL, { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    })
    .then(replaceNav)
    .catch(function (err) {
      console.warn('[nav-fetch] fetch failed; keeping build-time nav:', err.message)
    })

  // ---------------------------------------------------------------------------
  // Orchestration
  // ---------------------------------------------------------------------------

  function replaceNav (allTabs) {
    var tabData = allTabs[pageContext.tabs]
    if (!tabData) {
      console.warn('[nav-fetch] no data for tab "' + pageContext.tabs + '"; keeping build-time nav')
      return
    }

    // If the current component+version is present in the fetched data, that data
    // is already correctly tab-filtered — use it directly. Only fall back to
    // page-nav-data when the component+version isn't in the fetched data (e.g. a
    // non-current page of an ungrouped docset). For docs-home pages this matters:
    // page.navigation contains every module's content-nav mixed together, but
    // tabData['docs'][version] is correctly scoped to the current tab.
    var currentInTabData = !!(
      tabData[pageContext.component] &&
      tabData[pageContext.component][pageContext.version]
    )

    var fetchedHeaders
    var pageHeaders
    if (currentInTabData) {
      fetchedHeaders = buildHeadersFromTabData(tabData, null)
      pageHeaders = []
    } else {
      fetchedHeaders = buildHeadersFromTabData(tabData, pageContext.component)
      pageHeaders = buildHeadersFromPageNav(readPageNav())
    }

    var allHeaders = fetchedHeaders.concat(pageHeaders)
    if (!allHeaders.length) {
      console.warn('[nav-fetch] no nav data to render; keeping build-time nav')
      return
    }

    var combinedNav = aggregateNav(allHeaders, pageContext.tabsGroup, pageContext.version)
    if (!combinedNav.length) {
      console.warn('[nav-fetch] aggregation produced no nav; keeping build-time nav')
      return
    }

    var fragment = renderNavigation(combinedNav, 0)
    navRoot.innerHTML = ''
    navRoot.appendChild(fragment)

    navRoot.dispatchEvent(new CustomEvent('nav:replaced', { bubbles: true }))
    console.debug('[nav-fetch] nav replaced')
  }

  function readPageNav () {
    var script = document.getElementById('page-nav-data')
    if (!script) return null
    try {
      return JSON.parse(script.textContent)
    } catch (e) {
      console.warn('[nav-fetch] failed to parse page-nav-data:', e.message)
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // ComponentHeader construction. Mirrors the consume-mode logic in nav.js,
  // including the promoted/normal split.
  // ---------------------------------------------------------------------------

  function buildHeadersForVersion (component, version, versionData) {
    var headers = []
    var items = versionData.items || []
    var promoted = items.filter(function (item) { return item.navPromote })
    var normal = items.filter(function (item) {
      return !item.navPromote && (item.url || (item.items && item.items.length))
    })

    promoted.forEach(function (item) {
      var sectionTitle = item.content
        ? item.content.replace(/<[^>]+>/g, '').trim()
        : versionData.title
      headers.push({
        content: sectionTitle,
        tabIndex: item.tabIndex || versionData.tabIndex || 99999,
        component: component,
        componentVersion: version,
        componentTitle: sectionTitle,
        componentHeader: true,
        latest: versionData.latest,
        docsetGroup: versionData.docsetGroup,
        items: item.items || [],
      })
    })

    if (normal.length) {
      headers.push({
        content: versionData.title,
        tabIndex: versionData.tabIndex || 99999,
        component: component,
        componentVersion: version,
        componentTitle: versionData.title,
        componentHeader: true,
        latest: versionData.latest,
        docsetGroup: versionData.docsetGroup,
        items: normal,
      })
    }
    return headers
  }

  function buildHeadersFromTabData (tabData, excludeComponent) {
    var headers = []
    Object.keys(tabData).forEach(function (component) {
      if (excludeComponent && component === excludeComponent) return
      var versions = tabData[component]
      Object.keys(versions).forEach(function (version) {
        var subHeaders = buildHeadersForVersion(component, version, versions[version])
        subHeaders.forEach(function (h) { headers.push(h) })
      })
    })
    return headers
  }

  function buildHeadersFromPageNav (pageNav) {
    if (!pageNav || !pageNav.length || !pageNav[0] || !pageNav[0].items) return []
    var items = pageNav[0].items
    var sampleItem = items.find(function (i) { return i.componentTitle })
    if (!sampleItem) return []
    var versionData = {
      title: sampleItem.componentTitle,
      tabIndex: sampleItem.tabIndex || 99999,
      latest: false,
      items: items,
    }
    return buildHeadersForVersion(pageContext.component, pageContext.version, versionData)
  }

  // ---------------------------------------------------------------------------
  // Aggregate (tabOverview nesting, docset-group version selection, sort)
  // ---------------------------------------------------------------------------

  function aggregateNav (headerItems, pageGroup, pageVersion) {
    var overviewsByComponent = new Map()
    var trueHeaders = []
    headerItems.forEach(function (item) {
      if (item.tabOverview) {
        var key = item.component + '::' + item.componentVersion
        if (!overviewsByComponent.has(key)) overviewsByComponent.set(key, [])
        overviewsByComponent.get(key).push(item)
      } else {
        trueHeaders.push(item)
      }
    })

    var selectedGroupVersions = new Map()
    trueHeaders.forEach(function (item) {
      if (!item.docsetGroup) return
      var isExactMatch = pageGroup && item.docsetGroup === pageGroup && item.componentVersion === pageVersion
      var existing = selectedGroupVersions.get(item.component)
      if (!existing) {
        selectedGroupVersions.set(item.component, item)
      } else if (isExactMatch) {
        selectedGroupVersions.set(item.component, item)
      } else if (item.latest) {
        var existingIsExactMatch = pageGroup && existing.docsetGroup === pageGroup && existing.componentVersion === pageVersion
        if (!existingIsExactMatch) selectedGroupVersions.set(item.component, item)
      }
    })

    var byTabIndex = new Map()
    trueHeaders.forEach(function (item) {
      if (item.docsetGroup && selectedGroupVersions.get(item.component) !== item) return

      var key = item.component + '::' + item.componentVersion
      if (item.componentHeader && overviewsByComponent.has(key)) {
        item.items = overviewsByComponent.get(key).concat(item.items || [])
      }

      var idx = item.tabIndex || 0
      if (!byTabIndex.has(idx)) byTabIndex.set(idx, [])
      byTabIndex.get(idx).push(item)
    })

    var sortedIndices = Array.from(byTabIndex.keys()).sort(function (a, b) { return a - b })
    var out = []
    sortedIndices.forEach(function (idx) {
      byTabIndex.get(idx).forEach(function (item) { out.push(item) })
    })

    // Match the shape returned by docs-ui/src/helpers/nav-aggregate.js. The
    // template renders the root object as an outer <ul class="nav-list"><li
    // class="nav-item"> wrapper around all componentHeaders, and the CSS
    // depends on that nesting.
    return [{ items: out, root: true, order: 0 }]
  }

  // ---------------------------------------------------------------------------
  // URL helpers
  // ---------------------------------------------------------------------------

  function fixNavPath (url) {
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

  function containsUrl (items, url) {
    if (!items || !Array.isArray(items)) return false
    for (var i = 0; i < items.length; i++) {
      if (items[i].url === url) return true
      if (items[i].items && containsUrl(items[i].items, url)) return true
    }
    return false
  }

  function hasHrefAttr (content) {
    return typeof content === 'string' && content.indexOf('href=') > -1
  }

  // ---------------------------------------------------------------------------
  // DOM construction
  // ---------------------------------------------------------------------------

  function el (tag, attrs, children) {
    var node = document.createElement(tag)
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k]
        if (v == null || v === false) return
        if (k === 'className') node.className = v
        else if (k === 'innerHTML') node.innerHTML = v
        else node.setAttribute(k, v)
      })
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return
        if (typeof c === 'string') node.appendChild(document.createTextNode(c))
        else node.appendChild(c)
      })
    }
    return node
  }

  function renderNavigation (navigation, level) {
    var fragment = document.createDocumentFragment()
    navigation.forEach(function (item) {
      var rendered = renderItem(item, level)
      if (rendered) fragment.appendChild(rendered)
    })
    return fragment
  }

  function renderItem (item, level) {
    if (item.componentHeader) return renderComponentHeader(item, level)
    if (item.tabOverview) return null
    return renderRegularItem(item, level)
  }

  function renderComponentHeader (item, level) {
    var docsetListClass = 'nav-list docset-list'
    var isCurrentComponent = item.component === pageContext.component
    if (isCurrentComponent && item.componentVersion !== pageContext.version) {
      docsetListClass += ' hidden'
    }

    var children = []

    var overviews = (item.items || []).filter(function (ci) { return ci.tabOverview })
    overviews.forEach(function (ov) {
      var overviewClass = 'nav-item tab-overview'
      if (ov.url === pageContext.url) overviewClass += ' is-current-page'
      var overviewChildren = []
      if (ov.url) {
        var href = ov.urlType === 'internal' ? fixNavPath(ov.url) : ov.url
        overviewChildren.push(el('a', { className: 'nav-link', href: href }, 'Overview'))
      }
      children.push(el('li', {
        className: overviewClass,
        'data-tabs': ov.pageTabs,
        'data-depth': '2',
      }, overviewChildren))
    })

    var inner = (item.items || []).filter(function (ci) { return !ci.tabOverview })
    var titleClass = 'nav-item docset-title'
    if (containsUrl(inner, pageContext.url)) titleClass += ' is-active'

    var titleSpan = el('span', { className: 'nav-text nav-item-toggle' })
    titleSpan.innerHTML = item.componentTitle || ''
    var titleChildren = [
      titleSpan,
      el('ul', { className: 'nav-list' }, [renderNavigation(inner, (level || 0) + 1)]),
    ]
    children.push(el('li', {
      className: titleClass,
      'data-tabs': item.pageTabs,
      'data-depth': String(level || 0),
    }, titleChildren))

    return el('ul', {
      className: docsetListClass,
      'data-component': item.component,
      'data-version': item.componentVersion,
    }, children)
  }

  function renderRegularItem (item, level) {
    var liClass = 'nav-item'
    if (item.url === pageContext.url) liClass += ' is-current-page'

    var liChildren = []
    if (item.content) {
      if (item.url) {
        var anchorClass = 'nav-link'
        if (item.items && item.items.length) anchorClass += ' nav-item-toggle'
        var href = item.urlType === 'internal' ? fixNavPath(item.url) : item.url
        var a = el('a', {
          className: anchorClass,
          'data-depth': String(level || 0),
          href: href,
        })
        a.innerHTML = item.content
        liChildren.push(a)
      } else if (item.items && item.items.length) {
        var span = el('span', { className: 'nav-text nav-item-toggle' })
        span.innerHTML = item.content
        liChildren.push(span)
      } else if (hasHrefAttr(item.content)) {
        var raw = document.createElement('span')
        raw.innerHTML = item.content
        liChildren.push(raw)
      } else {
        var headerSpan = el('span', { className: 'nav-text nav-section-header' })
        headerSpan.innerHTML = item.content
        liChildren.push(headerSpan)
      }
    }

    if (item.items && item.items.length) {
      liChildren.push(renderNavigation(item.items, (level || 0) + 1))
    }

    return el('ul', {
      className: 'nav-list',
      'data-component': item.component,
      'data-version': item.componentVersion,
    }, [el('li', {
      className: liClass,
      'data-tabs': item.pageTabs,
      'data-module': item.module,
      'data-depth': String(level || 0),
    }, liChildren)])
  }
})()
