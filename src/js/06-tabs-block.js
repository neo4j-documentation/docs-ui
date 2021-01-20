// Code functions

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
      default:
        cased = capitalizeFirstLetter(lang)
    }
    return cased
  }

  var createElement = function (el, className, children) {
    var output = document.createElement(el)
    output.setAttribute('class', className)

    Array.isArray(children) && children.forEach(function (child) {
      if (child) output.appendChild(child)
    })

    return output
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

    var bodyRect = document.body.getBoundingClientRect().top
    var elementRect = tab.getBoundingClientRect().top
    var elementPosition = elementRect - bodyRect
    var offsetPosition = elementPosition - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })

    if (sessionStorageAvailable) {
      window.sessionStorage.setItem('code_example_language', lang)
    }
  }

  //
  // Tabbed sections in the drivers manual
  //

  var defaultLang = 'dotnet'
  var langList = ['dotnet', 'go', 'java', 'javascript', 'python', 'mutate', 'stats', 'stream', 'train', 'write']

  var currentLanguage = defaultLang
  if (sessionStorageAvailable) {
    var searchParams = new URLSearchParams(window.location.search)
    var languageFromParams = searchParams.get('language')
    if (languageFromParams && langList.includes(languageFromParams.toLocaleLowerCase())) {
      currentLanguage = languageFromParams.toLocaleLowerCase()
      window.sessionStorage.setItem('code_example_language', currentLanguage)
    } else {
      var storedLanguage = window.sessionStorage.getItem('code_example_language')
      if (storedLanguage && langList.includes(storedLanguage)) {
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

      // add sections for each language from driver manual html output format
      langList.forEach(function (lang) {
        tab.querySelectorAll('.include-with-' + lang).forEach(function (block) {
          block.setAttribute('data-title', lang)
          block.setAttribute('data-lang', lang)
          elements.push(block)
        })
      })

      // Don't do anything if there's only one tab
      if (elements.length < 1) {
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
})
