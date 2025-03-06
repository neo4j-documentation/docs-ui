;(function () {
  'use strict'

  var sidebar = document.querySelector('aside.toc.sidebar')

  if (!sidebar) return
  if (document.querySelector('body.-toc')) return sidebar.parentNode.removeChild(sidebar)
  var levels = parseInt(sidebar.dataset.levels || 2)
  if (levels < 0) return sidebar.parentNode.removeChild(sidebar) // remove the sidebar if :page-toclevels: -1

  var article = document.querySelector('article.doc')
  var selectors = document.querySelector('.nav-container .selectors')
  var selectorsHeight = selectors ? selectors.getBoundingClientRect().height : 0
  var headingSelector = []
  for (var l = 0; l <= levels; l++) headingSelector.push(l ? '.sect' + l + '>h' + (l + 1) + '[id]' : 'h1[id].sect0')
  var headings = find(headingSelector.join(','), article)

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
  var list = headings.reduce(function (accum, heading) {
    var link = document.createElement('a')
    link.textContent = heading.textContent
    links[(link.href = '#' + heading.id)] = link
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
      // don't scroll page contents if cheat-sheet
      if (list.scrollHeight > list.offsetHeight && !document.querySelector('body.cheat-sheet')) {
        list.scrollTop = Math.max(0, activeLink.offsetTop + activeLink.offsetHeight - list.offsetHeight)
      }
      lastActiveFragment = activeFragment
    } else if (lastActiveFragment) {
      links[lastActiveFragment].classList.remove('is-active')
      lastActiveFragment = undefined
    }
  }

  function find (selector, from) {
    return [].slice.call((from || document).querySelectorAll(selector))
  }

  function getNumericStyleVal (el, prop) {
    return parseFloat(window.getComputedStyle(el)[prop])
  }
})()
