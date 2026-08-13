;(function () {
  'use strict'

  function find (selector, from) {
    return [].slice.call((from || document).querySelectorAll(selector))
  }

  function getNumericStyleVal (el, prop) {
    return parseFloat(window.getComputedStyle(el)[prop])
  }

  function setHeadingContent (el, heading) {
    var clone = heading.cloneNode(true)
    clone.querySelectorAll('div, a.anchor').forEach(function (c) { c.remove() })
    if (clone.querySelector('a')) el.textContent = clone.textContent
    else el.innerHTML = clone.innerHTML
  }

  function headingsIn (article, levels) {
    var headingSelector = []
    for (var l = 0; l <= levels; l++) headingSelector.push(l ? '.sect' + l + ':not(.discrete)>h' + (l + 1) + '[id]' : 'h1[id].sect0')
    return find(headingSelector.join(','), article)
  }

  if (document.body.classList.contains('cheat-sheet')) return buildCheatSheetNav()

  // ---------------------------------------------------------------------------
  // Normal pages: the right-side "Contents" panel, built from the page's own
  // headings. aside.toc.sidebar/toc-menu-placeholder come from toc.hbs.
  // ---------------------------------------------------------------------------

  var sidebar = document.querySelector('aside.toc.sidebar')

  if (!sidebar) return
  if (document.querySelector('body.-toc')) return sidebar.parentNode.removeChild(sidebar)
  var levels = parseInt(sidebar.dataset.levels || 2)
  if (levels < 0) return sidebar.parentNode.removeChild(sidebar) // remove the sidebar if :page-toclevels: -1

  var article = document.querySelector('article.doc')
  var selectors = document.querySelector('.nav-container .selectors')
  var selectorsHeight = selectors ? selectors.getBoundingClientRect().height : 0
  var headings = headingsIn(article, levels)

  var menu = sidebar.querySelector('.toc-menu-placeholder')
  if (!menu) (menu = document.createElement('div')).className = 'toc-menu-placeholder'
  var ad = document.querySelector('.toc-ad')

  // display an ad or nothing if there are no headings
  if (!(headings.length)) {
    if (!ad) return sidebar.parentNode.removeChild(sidebar) // remove sidebar if there is no ad
    return menu.parentNode.removeChild(menu) // remove toc menu if there are no headings but still display ad
  }

  var lastActiveFragment
  var links = {}

  function buildLink (heading) {
    var link = document.createElement('a')
    setHeadingContent(link, heading)
    links[(link.href = '#' + heading.id)] = link
    return link
  }

  var list = headings.reduce(function (accum, heading) {
    var link = buildLink(heading)
    link.className = 'contents-link'
    var listItem = document.createElement('li')
    listItem.dataset.level = parseInt(heading.nodeName.slice(1)) - 1
    listItem.appendChild(link)
    accum.appendChild(listItem)
    return accum
  }, document.createElement('ul'))

  if (document.querySelector('body.has-banner')) {
    document.querySelector('.toc-menu').style.top = 'calc(var(--toc-top) + var(--banner-height))'
  }

  var title = document.createElement('h2')
  title.textContent = sidebar.dataset.title || 'Contents'
  menu.appendChild(title)
  menu.appendChild(list)

  var startOfContent = !document.getElementById('toc') && article.querySelector('h1.page ~ :not(.is-before-toc)')
  if (startOfContent) {
    var embeddedToc = document.createElement('aside')
    embeddedToc.className = 'toc embedded'
    embeddedToc.appendChild(menu.cloneNode(true))
    startOfContent.parentNode.insertBefore(embeddedToc, startOfContent)
  }

  window.addEventListener('load', function () {
    onScroll()
    window.addEventListener('scroll', onScroll)
  })

  function onScroll () {
    var scrolledBy = window.pageYOffset
    var buffer = getNumericStyleVal(document.documentElement, 'fontSize') * 1.15
    var ceil = selectors ? article.offsetTop + (selectorsHeight * 1.15) : article.offsetTop
    if (scrolledBy && window.innerHeight + scrolledBy + 2 >= document.documentElement.scrollHeight) {
      lastActiveFragment = Array.isArray(lastActiveFragment) ? lastActiveFragment : Array(lastActiveFragment || 0)
      var activeFragments = []
      var lastIdx = headings.length - 1
      headings.forEach(function (heading, idx) {
        var fragment = '#' + heading.id
        if (idx === lastIdx || heading.getBoundingClientRect().top + getNumericStyleVal(heading, 'paddingTop') > ceil) {
          activeFragments.push(fragment)
          if (lastActiveFragment.indexOf(fragment) < 0) links[fragment].classList.add('is-active')
        } else if (~lastActiveFragment.indexOf(fragment)) {
          links[lastActiveFragment.shift()].classList.remove('is-active')
        }
      })
      list.scrollTop = list.scrollHeight - list.offsetHeight
      lastActiveFragment = activeFragments.length > 1 ? activeFragments : activeFragments[0]
      return
    }
    if (Array.isArray(lastActiveFragment)) {
      lastActiveFragment.forEach(function (fragment) {
        links[fragment].classList.remove('is-active')
      })
      lastActiveFragment = undefined
    }
    var activeFragment
    headings.some(function (heading) {
      if (heading.getBoundingClientRect().top + getNumericStyleVal(heading, 'paddingTop') - buffer > ceil) return true
      activeFragment = '#' + heading.id
    })
    if (activeFragment) {
      if (activeFragment === lastActiveFragment) return
      if (lastActiveFragment) links[lastActiveFragment].classList.remove('is-active')
      var activeLink = links[activeFragment]
      activeLink.classList.add('is-active')
      if (list.scrollHeight > list.offsetHeight) {
        list.scrollTop = Math.max(0, activeLink.offsetTop + activeLink.offsetHeight - list.offsetHeight)
      }
      lastActiveFragment = activeFragment
    } else if (lastActiveFragment) {
      links[lastActiveFragment].classList.remove('is-active')
      lastActiveFragment = undefined
    }
  }

  // ---------------------------------------------------------------------------
  // Cheat-sheet pages: there's no real docset nav worth showing (the content is
  // one long scrollable page, not a set of separate pages), so the heading-
  // derived TOC becomes the left nav instead - replacing #nav-root's server-
  // rendered content the same way 09-nav-fetch.js replaces it for tabbed pages.
  // Built with the same nav-item/docset-title/sidebar-link shape nav-tree.hbs
  // uses, so nav.css's styling applies directly and 01-nav.js's existing
  // toggle-click binding + activateCurrentPath logic - triggered by the same
  // nav:replaced event 09-nav-fetch.js dispatches - works on it unmodified.
  // ---------------------------------------------------------------------------

  function buildCheatSheetNav () {
    var navRoot = document.getElementById('nav-root')
    if (!navRoot) return

    // nav.css hides #nav-root by default whenever data-page-tabs is present at all
    // (even empty), revealing it only once .nav-ready is added - the same pattern
    // 09-nav-fetch.js uses for tabbed pages. Every exit path below must add it, or
    // the nav stays invisible.
    try {
      buildCheatSheetNavTree(navRoot)
    } finally {
      navRoot.classList.add('nav-ready')
    }
  }

  function buildCheatSheetNavTree (navRoot) {
    var article = document.querySelector('article.doc')
    if (!article) return

    var levels = parseInt(document.body.dataset.pageTocLevels || 2)
    if (levels < 0) return // :page-toclevels: -1 - leave the server-rendered nav as-is

    var headings = headingsIn(article, levels)
    if (!headings.length) return // nothing to show - leave the server-rendered nav as-is

    var lastActiveFragment
    var links = {}

    function buildLink (heading) {
      var link = document.createElement('a')
      setHeadingContent(link, heading)
      links[(link.href = '#' + heading.id)] = link
      return link
    }

    // Flat headings + heading level -> a real tree, via a stack of currently-open
    // ancestors (same shape groupFlatNavSections in index.js builds server-side
    // from a flat run of nav items, just keyed by numeric heading level instead
    // of a bold-heading marker).
    var root = { level: -1, children: [] }
    var stack = [root]
    headings.forEach(function (heading) {
      var level = parseInt(heading.nodeName.slice(1)) - 1
      var node = { heading: heading, level: level, children: [] }
      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop()
      stack[stack.length - 1].children.push(node)
      stack.push(node)
    })

    function renderNodes (nodes) {
      var ul = document.createElement('ul')
      ul.className = 'nav-list'
      nodes.forEach(function (node) {
        var hasChildren = node.children.length > 0
        var li = document.createElement('li')
        li.dataset.depth = node.level

        if (!hasChildren) {
          var link = buildLink(node.heading)
          link.className = 'sidebar-link'
          li.className = 'nav-item'
          li.appendChild(link)
          ul.appendChild(li)
          return
        }

        // A section title toggles open/closed exactly like a promoted docset
        // block - a non-link span, not itself a navigation target (01-nav.js
        // only binds its toggle click handler to .nav-item-toggle:not(a)).
        // Its own heading is kept reachable as the section's own first child
        // link instead, same self-link-as-first-child pattern index.js's
        // consumeNav uses for a promoted page that also has children.
        // Closed by default - opened below only along the path to whichever
        // heading matches the current URL hash, if any.
        li.className = 'nav-item docset-title'
        var toggle = document.createElement('span')
        toggle.className = 'nav-text nav-item-toggle'
        setHeadingContent(toggle, node.heading)
        li.appendChild(toggle)

        var childList = renderNodes(node.children)
        var selfLink = buildLink(node.heading)
        selfLink.className = 'sidebar-link'
        var selfLi = document.createElement('li')
        selfLi.className = 'nav-item nav-item-self-link'
        selfLi.dataset.depth = node.level + 1
        selfLi.appendChild(selfLink)
        childList.insertBefore(selfLi, childList.firstChild)
        li.appendChild(childList)

        ul.appendChild(li)
      })
      return ul
    }

    navRoot.innerHTML = ''

    // Once the nav's own tab/component title (nav-tree.hbs's docset-title
    // header) went away with the aggregated-nav restructure, there was
    // nothing showing which docset's cheat sheet this is once you've scrolled
    // past the top - reintroduced here, cheat-sheet-only, sticky above the
    // scrolling nav list. Reuses the page's own <h1> text rather than adding
    // new server-side plumbing just for this.
    var pageTitleHeading = document.querySelector('h1.page')
    if (pageTitleHeading) {
      var navTitle = document.createElement('div')
      navTitle.className = 'cheat-sheet-nav-title'
      navTitle.textContent = pageTitleHeading.textContent
      navRoot.appendChild(navTitle)
    }

    navRoot.appendChild(renderNodes(root.children))
    navRoot.dispatchEvent(new CustomEvent('nav:replaced', { bubbles: true }))

    // Open only the section containing whatever heading the URL hash points at
    // (e.g. #_finish) - every other section stays closed. 01-nav.js's own
    // hash-handling (onHashChange) binds once at initial page load, before this
    // nav exists, so it never sees these hash links - this is self-contained.
    var hashLink = links[window.location.hash]
    var ancestor = hashLink && hashLink.parentNode
    while (ancestor && ancestor !== navRoot) {
      if (ancestor.classList && ancestor.classList.contains('nav-item')) ancestor.classList.add('is-active')
      ancestor = ancestor.parentNode
    }

    window.addEventListener('load', function () {
      onScroll()
      window.addEventListener('scroll', onScroll)
    })

    function onScroll () {
      var scrolledBy = window.pageYOffset
      var buffer = getNumericStyleVal(document.documentElement, 'fontSize') * 1.15
      var ceil = article.offsetTop
      if (scrolledBy && window.innerHeight + scrolledBy + 2 >= document.documentElement.scrollHeight) {
        lastActiveFragment = Array.isArray(lastActiveFragment) ? lastActiveFragment : Array(lastActiveFragment || 0)
        var activeFragments = []
        var lastIdx = headings.length - 1
        headings.forEach(function (heading, idx) {
          var fragment = '#' + heading.id
          if (idx === lastIdx || heading.getBoundingClientRect().top + getNumericStyleVal(heading, 'paddingTop') > ceil) {
            activeFragments.push(fragment)
            if (lastActiveFragment.indexOf(fragment) < 0) links[fragment].classList.add('is-active')
          } else if (~lastActiveFragment.indexOf(fragment)) {
            links[lastActiveFragment.shift()].classList.remove('is-active')
          }
        })
        lastActiveFragment = activeFragments.length > 1 ? activeFragments : activeFragments[0]
        return
      }
      if (Array.isArray(lastActiveFragment)) {
        lastActiveFragment.forEach(function (fragment) {
          links[fragment].classList.remove('is-active')
        })
        lastActiveFragment = undefined
      }
      var activeFragment
      headings.some(function (heading) {
        if (heading.getBoundingClientRect().top + getNumericStyleVal(heading, 'paddingTop') - buffer > ceil) return true
        activeFragment = '#' + heading.id
      })
      if (activeFragment) {
        if (activeFragment === lastActiveFragment) return
        if (lastActiveFragment) links[lastActiveFragment].classList.remove('is-active')
        links[activeFragment].classList.add('is-active')
        lastActiveFragment = activeFragment
      } else if (lastActiveFragment) {
        links[lastActiveFragment].classList.remove('is-active')
        lastActiveFragment = undefined
      }
    }
  }
})()
