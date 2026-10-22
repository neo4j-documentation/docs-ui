;(function () {
  'use strict'

  var SECT_CLASS_RX = /^sect(\d)$/

  var navContainer = document.querySelector('.nav-container')
  var navToggle = document.querySelector('.nav-toggle')
  var menuPanel
  var nav
  var currentPageItem
  var originalPageItem
  // Set once the reader scrolls the nav themselves, so a later automatic scroll (the tree
  // being rebuilt, fonts loading) doesn't pull it out from under them.
  var userScrolledNav = false

  // Where in the panel the reader clicked a nav link just before this page loaded. A click
  // is a full page load, so the panel would otherwise start again from the top; keeping the
  // clicked link where it was means the nav doesn't move when you use it. Expires quickly
  // so a later visit to the same page isn't affected.
  var CLICK_ANCHOR_KEY = 'nav-click-anchor'
  var clickAnchor = readClickAnchor()

  // The nav sections that were open when the reader left the previous page, kept for the
  // browser tab and only brought back within the top-level block they are reading. Every page load rebuilds the nav with only the current path open, so
  // without this the section holding the page you came from collapses as soon as you click
  // a link in another one, and getting back means finding and reopening it. What was open
  // on screen is what comes back.
  var OPEN_SECTIONS_KEY = 'nav-open-sections'
  // Whether to bring those back on this page load (see arrivedByLink).
  var restoreSections = arrivedByLink()

  if (navContainer && navToggle) {
    navToggle && navToggle.addEventListener('click', showNav)

    menuPanel = navContainer.querySelector('[data-panel=menu]')
    if (!menuPanel) return
    nav = navContainer.querySelector('.nav')

    initNavTree()

    // The runtime nav fetcher (09-nav-fetch.js) replaces #nav-root's contents
    // and dispatches this event. Re-run the init against the new DOM so the
    // current-page highlight, ancestor-active classes, and toggle handlers
    // get applied to the new nodes.
    document.addEventListener('nav:replaced', initNavTree)

    nav.querySelector('.context') && nav.querySelector('.context').addEventListener('click', function () {
      var currentPanel = nav.querySelector('.is-active[data-panel]')
      var activatePanel = currentPanel.dataset.panel === 'menu' ? 'docsets' : 'menu'
      currentPanel.classList.toggle('is-active')
      nav.querySelector('[data-panel=' + activatePanel + ']').classList.toggle('is-active')
    })

    // NOTE prevent text from being selected by double click
    menuPanel.addEventListener('mousedown', function (e) {
      if (e.detail > 1) e.preventDefault()
    })

    window.addEventListener('pagehide', rememberOpenSections)

    menuPanel.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a.sidebar-link')
      if (!link || !link.pathname) return
      try {
        window.sessionStorage.setItem(CLICK_ANCHOR_KEY, JSON.stringify({
          path: link.pathname,
          offset: link.getBoundingClientRect().top - menuPanel.getBoundingClientRect().top,
          time: Date.now(),
        }))
      } catch (err) {}
    })

    ;['wheel', 'touchstart', 'keydown'].forEach(function (type) {
      menuPanel.addEventListener(type, function () { userScrolledNav = true }, { passive: true })
    })

    if (menuPanel && menuPanel.querySelector('.sidebar-link[href^="#"]')) {
      if (window.location.hash) onHashChange()
      window.addEventListener('hashchange', onHashChange)
    }
  }

  initVersionDropdown(document.querySelector('body:not(.cheat-sheet) .version-dropdown-trigger'))

  // Navigation is just a plain <a href> now, so no click handling is needed for
  // that - only the open/close toggle, since this replaces a native <select>'s
  // built-in dropdown. The version links themselves carry class="version-selector"
  // so they get picked up by whatever already tracks <a> clicks elsewhere on the
  // page - a native <select>'s <option> clicks couldn't be observed that way.
  function initVersionDropdown (trigger) {
    if (!trigger) return
    var dropdown = trigger.closest('.version-dropdown')
    var label = trigger.querySelector('.version-dropdown-trigger-label')
    var current = dropdown.querySelector('.is-current .version-selector')
    if (label && current) label.textContent = current.textContent.trim()

    function close () {
      dropdown.classList.remove('is-active')
      trigger.setAttribute('aria-expanded', 'false')
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation()
      if (dropdown.classList.contains('is-active')) close()
      else {
        dropdown.classList.add('is-active')
        trigger.setAttribute('aria-expanded', 'true')
      }
    })

    document.addEventListener('click', function (e) {
      if (dropdown.classList.contains('is-active') && !dropdown.contains(e.target)) close()
    })

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dropdown.classList.contains('is-active')) close()
    })
  }

  function onHashChange () {
    var navLink
    var hash = window.location.hash
    if (hash) {
      if (hash.indexOf('%')) hash = decodeURIComponent(hash)
      navLink = menuPanel.querySelector('.sidebar-link[href="' + hash + '"]')
      if (!navLink) {
        var targetNode = document.getElementById(hash.slice(1))
        if (targetNode) {
          var current = targetNode
          var ceiling = document.querySelector('article.doc')
          while ((current = current.parentNode) && current !== ceiling) {
            var id = current.id
            // NOTE: look for section heading

            if (!id && (id = current.className && current.className.match(SECT_CLASS_RX))) id = (current.firstElementChild || {}).id
            if (id && (navLink = menuPanel.querySelector('.sidebar-link[href="#' + id + '"]'))) break
          }
        }
      }
    }
    var navItem
    if (navLink) {
      navItem = navLink.parentNode
    } else if (originalPageItem) {
      navLink = (navItem = originalPageItem).querySelector('.sidebar-link')
    } else {
      return
    }
    if (navItem === currentPageItem) return
    find(menuPanel, '.nav-item.is-active').forEach(function (el) {
      el.classList.remove('is-active', 'is-current-path', 'is-current-page')
    })
    navItem.classList.add('is-current-page')
    currentPageItem = navItem
    activateCurrentPath(navItem)
    scrollItemIntoContext(menuPanel, navLink)
  }

  function initNavTree () {
    currentPageItem = menuPanel.querySelector('.is-current-page')
    originalPageItem = currentPageItem
    restoreOpenSections()
    if (currentPageItem) {
      activateCurrentPath(currentPageItem)
      var currentLink = currentPageItem.querySelector('.sidebar-link')
      // Skipped when the reader has already scrolled the nav (this also runs again when
      // the fetched nav replaces the baked one). Run once more when fonts have loaded,
      // since they change line heights and so the positions measured here.
      var scrollToCurrent = function () {
        if (userScrolledNav) return
        if (clickAnchor && currentLink && currentLink.pathname === clickAnchor.path) {
          anchorLinkAt(menuPanel, currentLink, clickAnchor.offset)
        } else {
          scrollItemIntoContext(menuPanel, currentLink)
        }
      }
      scrollToCurrent()
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(scrollToCurrent)
    } else {
      // No current-page item — e.g. a tab overview page, whose own nav entry is
      // hidden. Open the current component's docset block (marked is-active by
      // component+version match) so all its section headers are visible. If that
      // component has no block here (its only content was the overview, now
      // suppressed), just open the outer wrapper so the remaining docset headers
      // are still visible. Without this the wrapper stays collapsed and the nav
      // disappears.
      var activeDocset = menuPanel.querySelector('.docset-title.is-active')
      if (activeDocset) {
        activateCurrentPath(activeDocset)
      } else {
        // If the tab has exactly one top-level section (docset block), open it by
        // default — helpful in local single-docset previews. (Overview-only blocks
        // are already suppressed, so they don't count.) Otherwise just open the
        // outer wrapper so all section headers show with nothing expanded.
        var docsets = find(menuPanel, '.docset-title')
        if (docsets.length === 1) {
          activateCurrentPath(docsets[0])
        } else {
          var navWrapper = menuPanel.querySelector('.nav-menu > .nav-list > .nav-item')
          if (navWrapper) navWrapper.classList.add('is-active')
          else menuPanel.scrollTop = 0
        }
      }
    }

    find(menuPanel, '.nav-item-toggle:not(a)').forEach(function (btn) {
      // Usually the immediate parent, but a toggle that sits alongside its own link
      // (.nav-item-link-toggle) is nested one level deeper, inside a .nav-item-row -
      // closest() finds the actual .nav-item li either way.
      var li = btn.closest('.nav-item')
      btn.addEventListener('click', toggleActive.bind(li))
      // don't let toggle clicks propagate
      btn.addEventListener('click', concealEvent)
      var navItemSpan = findNextElement(btn, '.nav-text')
      if (navItemSpan) {
        navItemSpan.style.cursor = 'pointer'
        navItemSpan.addEventListener('click', toggleActive.bind(li))
      }
    })
  }

  function activateCurrentPath (navItem) {
    var ancestorClasses
    var ancestor = navItem.parentNode
    while (!(ancestorClasses = ancestor.classList).contains('nav-menu')) {
      if (ancestor.tagName === 'LI' && ancestorClasses.contains('nav-item')) {
        ancestorClasses.add('is-active', 'is-current-path')
      }
      ancestor = ancestor.parentNode
    }
    navItem.classList.add('is-active')
  }

  function toggleActive () {
    this.classList.toggle('is-active')
    // scroll the menu if the open section is hidden by the footer
    var thisBottom = this.getBoundingClientRect().bottom
    var footerTop = document.querySelector('footer').getBoundingClientRect().top
    if (thisBottom > footerTop) this.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function showNav (e) {
    if (navToggle.classList.contains('is-active')) return hideNav(e)
    var html = document.documentElement.querySelector('main.article')
    html.classList.add('is-clipped--nav')
    navToggle.classList.add('is-active')
    navContainer.classList.add('is-active')
    html.addEventListener('click', hideNav)
    concealEvent(e)
  }

  function hideNav (e) {
    var html = document.documentElement
    html.classList.remove('is-clipped--nav')
    navToggle.classList.remove('is-active')
    navContainer.classList.remove('is-active')
    html.removeEventListener('click', hideNav)
    concealEvent(e)
  }

  // NOTE don't let event get picked up by window click listener
  function concealEvent (e) {
    e.stopPropagation()
  }

  // The outermost item in the tree containing li: the top-level block of the tab. That is
  // a whole docset, or one promoted section of it (a docset can be split into many).
  function topLevelItem (li) {
    var top = null
    for (var node = li; node && node !== menuPanel; node = node.parentNode) {
      if (node.tagName === 'LI' && node.classList.contains('nav-item')) top = node
    }
    return top
  }

  function itemLabel (li) {
    var label = li.querySelector(':scope > .nav-text, :scope > .nav-item-row > a, :scope > a')
    return label ? label.textContent.trim() : ''
  }

  // Identifies a top-level block across page loads: its component and version plus its label.
  function blockKey (top) {
    return (top.dataset.component || '') + '@' + (top.dataset.version || '') + '|' + itemLabel(top)
  }

  // Identifies a section across page loads: its top-level block plus the labels of the
  // sections between that and it. The tree has no ids of its own.
  function sectionKey (li) {
    var labels = []
    for (var node = li; node && node !== menuPanel; node = node.parentNode) {
      if (node.tagName === 'LI' && node.classList.contains('nav-item')) labels.unshift(itemLabel(node))
    }
    var top = topLevelItem(li)
    return (top.dataset.component || '') + '@' + (top.dataset.version || '') + '|' + labels.join('>')
  }

  // Called as the page is left. Replaces the remembered set with what is open now, so the
  // current path (open by default, not toggled by hand) is kept too.
  function rememberOpenSections () {
    try {
      var open = find(menuPanel, '.nav-item.is-active')
        .filter(function (li) { return li.querySelector(':scope > .nav-list') })
        .map(sectionKey)
      window.sessionStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(open.slice(-500)))
    } catch (err) {}
  }

  // Reloading the page, or opening it directly (typed URL, bookmark, a link from another
  // site), starts the nav clean with only the current path open, which is also how a reader
  // closes everything. Following a link on this site, or going back and forward, keeps the
  // open sections.
  function arrivedByLink () {
    var entry = window.performance && window.performance.getEntriesByType &&
      window.performance.getEntriesByType('navigation')[0]
    var type = entry ? entry.type : 'navigate'
    if (type === 'reload') return false
    if (type === 'back_forward') return true
    try {
      return !!document.referrer && new URL(document.referrer).origin === window.location.origin
    } catch (err) {
      return false
    }
  }

  function restoreOpenSections () {
    if (!restoreSections) return
    // Only inside the top-level block the reader is in: sections opened in other blocks
    // collapse again when they leave them, so the nav can't grow into one huge tree across a
    // tab (where, say, a whole promoted docset is dozens of top-level blocks).
    var here = currentPageItem || menuPanel.querySelector('.docset-title.is-active')
    var block = here && topLevelItem(here)
    if (!block) return
    var blockId = blockKey(block)
    var open
    try {
      open = JSON.parse(window.sessionStorage.getItem(OPEN_SECTIONS_KEY))
    } catch (err) {}
    if (!open || !open.length) return
    var wanted = {}
    open.forEach(function (key) {
      if (key === blockId || key.indexOf(blockId + '>') === 0) wanted[key] = true
    })
    find(menuPanel, '.nav-item').forEach(function (li) {
      if (li.querySelector(':scope > .nav-list') && wanted[sectionKey(li)]) li.classList.add('is-active')
    })
  }

  function readClickAnchor () {
    try {
      var saved = JSON.parse(window.sessionStorage.getItem(CLICK_ANCHOR_KEY))
      window.sessionStorage.removeItem(CLICK_ANCHOR_KEY)
      if (saved && Date.now() - saved.time < 10000) return saved
    } catch (err) {}
    return null
  }

  // Scrolls the panel so the link sits `offset` px below the panel's top, where it was
  // when it was clicked on the previous page.
  function anchorLinkAt (panel, el, offset) {
    var top = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop
    panel.scrollTop = Math.max(0, Math.min(top - offset, panel.scrollHeight - panel.clientHeight))
    // If the link still isn't fully in view (the tree came out a different height, or the
    // position was clamped), fall back to putting it in context.
    var panelRect = panel.getBoundingClientRect()
    var rect = el.getBoundingClientRect()
    var visible = rect.top >= panelRect.top && rect.bottom <= panelRect.bottom
    console.debug('[nav-scroll]', {
      rule: visible ? 'clicked in the nav: link kept where it was' : 'clicked in the nav, but not in view: using context rule',
      offset: Math.round(offset),
      scrollTop: Math.round(panel.scrollTop),
    })
    if (!visible) scrollItemIntoContext(panel, el)
  }

  // Scrolls the nav panel so the current page's link is visible with its context.
  // Positions are measured against the panel's own rectangle, not offsetTop, which is
  // relative to the nearest positioned ancestor (every .nav-item is position: relative)
  // and so says nothing useful about where a nested link is in the scrolled content.
  //   - If a whole section containing the page fits in the panel, show the largest such
  //     section from its top, so its heading, the page and its siblings are all in view.
  //   - Otherwise put the link about 38% down the panel, with siblings above and below.
  function scrollItemIntoContext (panel, el) {
    var panelRect = panel.getBoundingClientRect()
    var viewHeight = panel.clientHeight
    var navStyle = window.getComputedStyle(nav)
    // a sticky nav that hasn't reached its stuck position is partly below the header
    if (navStyle.position === 'sticky') viewHeight -= Math.max(0, panelRect.top - parseFloat(navStyle.top))
    var pad = 8
    var contentTop = function (node) {
      return node.getBoundingClientRect().top - panelRect.top + panel.scrollTop
    }
    var elTop = contentTop(el)
    var target = elTop - viewHeight * 0.38
    var section = null
    // walking outwards, sections only get taller, so the last one that fits is the largest
    for (var node = el.parentNode; node && node !== panel; node = node.parentNode) {
      if (node.tagName === 'LI' && node.classList.contains('nav-item') &&
        node.getBoundingClientRect().height <= viewHeight - pad * 2) section = node
    }
    if (section) target = contentTop(section) - pad
    panel.scrollTop = Math.max(0, Math.min(target, panel.scrollHeight - panel.clientHeight))
    // Visible in the browser console at the Verbose level: which rule applied and why.
    console.debug('[nav-scroll]', {
      rule: section ? 'section fits: shown from its top' : 'no section fits: link placed 38% down',
      section: section ? (section.querySelector('.nav-text, .sidebar-link') || section).textContent.trim().slice(0, 60) : null,
      sectionHeight: section ? Math.round(section.getBoundingClientRect().height) : null,
      panelHeight: Math.round(viewHeight),
      linkTop: Math.round(elTop),
      scrollTop: Math.round(panel.scrollTop),
    })
  }

  function find (from, selector) {
    return [].slice.call(from.querySelectorAll(selector))
  }

  function findNextElement (from, selector) {
    var el = from.nextElementSibling
    if (!el) return
    return selector ? el[el.matches ? 'matches' : 'msMatchesSelector'](selector) && el : el
  }

  // Remove clipped nav
  function removeClippedNav () {
    var html = document.querySelector('html')
    if (window.innerWidth >= 1024 && html.classList.contains('is-clipped--nav')) {
      html.classList.remove('is-clipped--nav')
    }
  }

  window.addEventListener('resize', removeClippedNav)
})()
