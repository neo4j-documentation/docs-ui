;(function () {
  'use strict'

  var SECT_CLASS_RX = /^sect(\d)$/

  var navContainer = document.querySelector('.nav-container')
  var navToggle = document.querySelector('.nav-toggle')

  if (navContainer && navToggle) {
    navToggle && navToggle.addEventListener('click', showNav)

    var menuPanel = navContainer.querySelector('[data-panel=menu]')
    if (!menuPanel) return
    var nav = navContainer.querySelector('.nav')

    var currentPageItem = menuPanel.querySelector('.is-current-page')
    var originalPageItem = currentPageItem
    if (currentPageItem) {
      activateCurrentPath(currentPageItem)
      scrollItemToMidpoint(menuPanel, currentPageItem.querySelector('.nav-link'))
    } else {
      menuPanel.scrollTop = 0
    }

    find(menuPanel, '.nav-item-toggle:not(a)').forEach(function (btn) {
      var li = btn.parentElement
      btn.addEventListener('click', toggleActive.bind(li))
      // don't let toggle clicks propagate
      btn.addEventListener('click', concealEvent)
      var navItemSpan = findNextElement(btn, '.nav-text')
      if (navItemSpan) {
        navItemSpan.style.cursor = 'pointer'
        navItemSpan.addEventListener('click', toggleActive.bind(li))
      }
    })

    nav.querySelector('.context') && nav.querySelector('.context').addEventListener('click', function () {
      var currentPanel = nav.querySelector('.is-active[data-panel]')
      var activatePanel = currentPanel.dataset.panel === 'menu' ? 'explore' : 'menu'
      currentPanel.classList.toggle('is-active')
      nav.querySelector('[data-panel=' + activatePanel + ']').classList.toggle('is-active')
    })

    // NOTE prevent text from being selected by double click
    menuPanel.addEventListener('mousedown', function (e) {
      if (e.detail > 1) e.preventDefault()
    })

    if (menuPanel && menuPanel.querySelector('.nav-link[href^="#"]')) {
      if (window.location.hash) onHashChange()
      window.addEventListener('hashchange', onHashChange)
    }
  }

  var versionSelector = document.querySelector('body:not(.cheat-sheet) .version-selector')
  if (versionSelector) {
    versionSelector.addEventListener('change', function (e) {
      const target = e.target

      const current = target.dataset.current
      const next = target.selectedOptions[0].dataset.version

      const url = target.value

      if (window.ga) {
        window.ga('send', 'event', 'version-select', 'From: ' + current + ';To:' + next + ';')
      }

      document.location.assign(url)
    })
  }

  function onHashChange () {
    var navLink
    var hash = window.location.hash
    if (hash) {
      if (hash.indexOf('%')) hash = decodeURIComponent(hash)
      navLink = menuPanel.querySelector('.nav-link[href="' + hash + '"]')
      if (!navLink) {
        var targetNode = document.getElementById(hash.slice(1))
        if (targetNode) {
          var current = targetNode
          var ceiling = document.querySelector('article.doc')
          while ((current = current.parentNode) && current !== ceiling) {
            var id = current.id
            // NOTE: look for section heading

            if (!id && (id = current.className && current.className.match(SECT_CLASS_RX))) id = (current.firstElementChild || {}).id
            if (id && (navLink = menuPanel.querySelector('.nav-link[href="#' + id + '"]'))) break
          }
        }
      }
    }
    var navItem
    if (navLink) {
      navItem = navLink.parentNode
    } else if (originalPageItem) {
      navLink = (navItem = originalPageItem).querySelector('.nav-link')
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
    scrollItemToMidpoint(menuPanel, navLink)
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
    var html = document.documentElement
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

  function scrollItemToMidpoint (panel, el) {
    var rect = panel.getBoundingClientRect()
    var effectiveHeight = rect.height
    var navStyle = window.getComputedStyle(nav)
    if (navStyle.position === 'sticky') effectiveHeight -= rect.top - parseFloat(navStyle.top)
    panel.scrollTop = Math.max(0, (el.getBoundingClientRect().height - effectiveHeight) * 0.5 + el.offsetTop)
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
