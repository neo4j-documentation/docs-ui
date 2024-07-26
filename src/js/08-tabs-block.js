// Code functions
import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  function capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  var casedLang = function (lang) {
    var cased
    switch (lang) {
      case 'csharp':
      case 'dotnet':
        cased = 'C#'
        break
      case 'javascript':
        cased = 'JavaScript'
        break
      case 'mutate':
      case 'stats':
      case 'stream':
      case 'train':
      case 'write':
        cased = capitalizeFirstLetter(lang) + ' mode'
        break
      case 'macos':
        cased = 'macOS'
        break
      default:
        cased = capitalizeFirstLetter(lang.replaceAll('-', ' '))
    }
    return cased
  }

  var targetActive = 'tabbed-target--active'
  var tabActive = 'tabbed-tab--active'
  var sessionStorageAvailable = typeof window.sessionStorage !== 'undefined' &&
    typeof window.sessionStorage.getItem === 'function' &&
    typeof window.sessionStorage.setItem === 'function'

  var switchTab = function (e) {
    var tab = e.target
    var lang = tab.dataset.lang
    var title = tab.dataset.title
    // Switch Tabs
    var targetTabs = document.querySelectorAll('.tabbed-target[data-title="' + title + '"]')
    targetTabs.forEach(function (target) {
      target.parentElement.querySelectorAll('.' + targetActive)
        .forEach(function (el) {
          el.classList.remove(targetActive)
        })

      target.classList.add(targetActive)

      target.parentElement.parentElement.querySelectorAll('.' + tabActive)
        .forEach(function (el) {
          el.classList.remove(tabActive)
        })

      target.parentElement.parentElement.querySelectorAll('.tabbed-tab[data-title="' + title + '"]')
        .forEach(function (el) {
          el.classList.add(tabActive)
        })
    })

    var toolbarOffset = 0
    var toolbar = document.querySelector('.toolbar')
    if (toolbar.offsetHeight) {
      toolbarOffset = toolbar.offsetHeight
    }
    var offset = document.querySelector('.navbar').offsetHeight + toolbarOffset + 20

    var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    var bodyRect = document.body.getBoundingClientRect().top
    var elementRect = tab.getBoundingClientRect().top
    var elementPosition = elementRect - bodyRect
    var offsetPosition = elementPosition - offset - vh / 5

    window.scrollTo({
      top: offsetPosition, // center clicked tab to a fifth of viewport height
      behavior: 'smooth'
    })

    if (sessionStorageAvailable) {
      window.sessionStorage.setItem('code_example_language', lang)
    }

    if (window.mixpanel) {
      window.mixpanel.track('DOCS_TAB_CHANGE', {
        pathname: window.location.origin + window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        language: lang,
        title,
      })
    }
  }

  //
  // Tabbed sections
  //

  var gdsModes = ['train', 'stream', 'stats', 'mutate', 'write']
  var tabsList = []
  var tabMarker = 'include-with-'
  document.querySelectorAll('[class*="' + tabMarker + '"]').forEach(function (tab) {
    tab.classList.forEach(function (tabClass) {
      var tabbable = tabClass.replace(tabMarker, '')
      if (tabClass.startsWith(tabMarker) && tabsList.indexOf(tabbable) === -1) tabsList.push(tabbable)
    })
  })

  var defaultLang = 'dotnet'

  var currentLanguage = defaultLang
  if (sessionStorageAvailable) {
    var searchParams = new URLSearchParams(window.location.search)
    var languageFromParams = searchParams.get('language')
    if (languageFromParams && tabsList.includes(languageFromParams.toLocaleLowerCase())) {
      currentLanguage = languageFromParams.toLocaleLowerCase()
      window.sessionStorage.setItem('code_example_language', currentLanguage)
    } else {
      var storedLanguage = window.sessionStorage.getItem('code_example_language')
      if (storedLanguage && tabsList.includes(storedLanguage)) {
        currentLanguage = storedLanguage
      }
    }
  }

  Array.from(document.querySelectorAll('.tabbed-example'))
    .forEach(function (tab) {
      var tabsTitle = tab.querySelector('.title')
      var originalTab = tab
      var parent = tab.parentElement

      // Build an array of elements
      var elements = []
      var showSingle = false

      // add sections for each language from driver manual html output format
      tabsList.forEach(function (lang) {
        tab.querySelectorAll('.include-with-' + lang).forEach(function (block) {
          block.setAttribute('data-title', lang)
          block.setAttribute('data-lang', lang)
          elements.push(block)
          if (gdsModes.includes(lang)) showSingle = true
        })
      })

      // Don't do anything if there's only one tab
      if (elements.length <= 1 && !showSingle) {
        return
      }

      var tabbedContainer = createElement('div', 'tabbed-container', [])
      var tabbedParent = createElement('div', 'tabbed', [tabbedContainer])

      if (tabsTitle) {
        parent.insertBefore(tabsTitle, originalTab)
      }
      parent.insertBefore(tabbedParent, originalTab)

      // Build up tabs
      var tabs = elements.map(function (element) {
        var lang = element.getAttribute('data-lang')
        var tabText = casedLang(lang)
        var tabElement = createElement('li', 'tabbed-tab', [document.createTextNode(tabText)])

        element.dataset.title = tabText
        element.dataset.lang = lang
        tabElement.dataset.title = tabText
        tabElement.dataset.lang = lang

        if (lang === currentLanguage) tabElement.classList.add(tabActive)
        tabElement.addEventListener('click', switchTab)

        return tabElement
      })

      // Remove elements from parent and add to tab container
      var activeAdded = false
      elements.forEach(function (element) {
        tabbedContainer.appendChild(element)
        element.classList.add('tabbed-target')
        if (element.getAttribute('data-lang') === currentLanguage) {
          element.classList.add('tabbed-target--active')
          activeAdded = true
        }
      })

      if (!activeAdded) {
        // get the data-lang of the first tab
        var setLang = elements[0].getAttribute('data-lang')
        // add active to matching tabs and targets
        var elIndex = 0
        elements.forEach(function (element) {
          if (element.getAttribute('data-lang') === setLang) {
            element.classList.add('tabbed-target--active')
            tabs[elIndex].classList.add('tabbed-tab--active')
          }
          elIndex++
        })
      }

      tabbedParent.insertBefore(createElement('ul', 'tabbed-tabs', tabs), tabbedContainer)

      parent.removeChild(originalTab)
    })

  //
  // Make active tab based on url hash
  //
  function decodeFragment (hash) {
    return hash && (~hash.indexOf('%') ? decodeURIComponent(hash) : hash).slice(1)
  }

  var fragment, target, langSelection, scrollTo
  if ((fragment = decodeFragment(window.location.hash)) &&
      (target = document.getElementById(fragment)) &&
      (langSelection = target.getAttribute('data-lang')) &&
      (scrollTo = target.closest('.tabbed').querySelector(`[data-lang=${langSelection}]`))) {
    switchTab({
      target: scrollTo,
    })
  }
})
