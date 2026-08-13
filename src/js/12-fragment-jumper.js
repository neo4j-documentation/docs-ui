;(function () {
  'use strict'

  var toolbar = document.querySelector('.toolbar')
  var headerNavigationBar = document.querySelector('header > .navbar')

  function decodeFragment (hash) {
    return hash && (~hash.indexOf('%') ? decodeURIComponent(hash) : hash).slice(1)
  }

  function jumpToAnchor (e) {
    if (e) {
      window.location.hash = '#' + this.id
      e.preventDefault()
    }
    // .toolbar is position: sticky and should never sit above the fixed navbar,
    // but on some layouts (e.g. cheat-sheet) its sticky containment breaks and
    // it scrolls away with the page instead of staying pinned - its .bottom then
    // goes deeply negative the further down the page you've scrolled, which
    // this formula subtracts, overshooting the scroll target by that same
    // growing amount. The navbar itself (position: fixed, always at the very
    // top) is a reliable floor: never use an offset smaller than its own.
    var navbarBottom = headerNavigationBar ? headerNavigationBar.getBoundingClientRect().bottom : 0
    var toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : navbarBottom
    var topOffset = Math.max(toolbarBottom, navbarBottom)
    var target = this
    var tabs
    if ((tabs = target.closest('.tabbed'))) {
      target = tabs
    }
    // getBoundingClientRect + pageYOffset gives the absolute position directly,
    // unlike manually walking the offsetParent chain (the previous approach) -
    // that walk double-counts an ancestor's offsetTop whenever an intermediate
    // element's offsetParent resolves back to the same positioned ancestor
    // (e.g. a flex-heavy layout with several unpositioned wrapper divs in a
    // row), overshooting the scroll target.
    var absoluteTop = target.getBoundingClientRect().top + window.pageYOffset

    // Eyeballed/measured (getBoundingClientRect diffs against a reference nav
    // element), not derived from any layout constant - cheat-sheet lines up
    // against .cheat-sheet-nav-title, normal pages against a docset-title span.
    const offsetCorrect = document.body.classList.contains('cheat-sheet') ? 8 : 12.84
    window.scrollTo(0, absoluteTop - (topOffset + offsetCorrect))
  }

  window.addEventListener('load', function jumpOnLoad (e) {
    var fragment, target
    if ((fragment = decodeFragment(window.location.hash)) && (target = document.getElementById(fragment))) {
      jumpToAnchor.bind(target)()
      setTimeout(jumpToAnchor.bind(target), 0)
    }
    window.removeEventListener('load', jumpOnLoad)
  })

  Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (el) {
    var fragment, target
    if ((fragment = decodeFragment(el.hash)) && (target = document.getElementById(fragment))) {
      el.addEventListener('click', jumpToAnchor.bind(target))
    }
  })
})()
