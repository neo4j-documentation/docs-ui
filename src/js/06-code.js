// Code functions
import { createElement } from './modules/dom'

;(function () {
  var commandContinuationRx = /\\\s*$/
  var copyableCommand = function (input) {
    var result = input
    if (input.startsWith('$ ')) {
      var lines = result.split('\n')
      var currentCommand = ''
      var commands = []
      var commandContinuationFound = false
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        if (!commandContinuationFound && !line.startsWith('$ ')) {
          // ignore, command output
        } else {
          if (commandContinuationFound) {
            currentCommand += '\n' + line
          } else if (line.startsWith('$ ')) {
            currentCommand = line.substr(2, line.length)
          }
          commandContinuationFound = line.match(commandContinuationRx)
          if (!commandContinuationFound) {
            commands.push(currentCommand)
          }
        }
      }
      result = commands.join('; ')
    }
    return result
  }
  window.neo4jDocs = {
    copyableCommand: copyableCommand,
  }
})()

document.addEventListener('DOMContentLoaded', function () {
  var ignore = ['gram']

  var cleanCode = function (code, language) {
    var input = code

    if (language === 'bash' || language === 'sh' || language === 'shell' || language === 'console') {
      input = window.neo4jDocs.copyableCommand(input)
    }

    return input
  }

  var copyToClipboard = function (code, language) {
    var textarea = document.createElement('textarea')
    textarea.value = cleanCode(code, language)
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'

    document.body.appendChild(textarea)
    textarea.select()

    document.execCommand('copy')
    document.body.removeChild(textarea)

    if (window.mixpanel) {
      window.mixpanel.track('DOCS_CODE_COPY', {
        pathname: window.location.origin + window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        language,
        code: textarea.value,
      })
    }
  }

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
      default:
        cased = capitalizeFirstLetter(lang)
    }
    return cased
  }

  var addCodeHeader = function (pre) {
    var block = pre.querySelector('code')
    var code = block.innerText

    var div = pre.parentNode
    var listingBlock = div.parentNode

    var addCopyButton = !listingBlock.classList.contains('nocopy')

    // if (listingBlock.classList.contains('noheader')) return

    var language = block.hasAttribute('class') &&
      block.getAttribute('class').match(/language-([a-z0-9-])+/i)[0].replace('language-', '')

    if (language && ignore.indexOf(language.toLowerCase()) > -1) return

    var headerDivs = []

    var originalTitle = div.parentNode.querySelector('.title')

    // if (!originalTitle)  return

    listingBlock.classList.add('has-header')

    if (originalTitle) {
      listingBlock.classList.add('has-title')
      var titleDiv = document.createElement('div')
      titleDiv.className = 'code-title'
      titleDiv.innerHTML = originalTitle.innerHTML
      originalTitle.style.display = 'none'
      headerDivs.push(titleDiv)
    }

    if (addCopyButton) {
      var copyButton = createElement('span', 'btn btn-copy fa fa-copy')

      var successText = createElement('span', 'btn', [document.createTextNode('Copied!')])
      var copySuccess = createElement('div', 'copy-success hidden', successText)

      copyButton.addEventListener('click', function (e) {
        e.preventDefault()
        copyToClipboard(code, language)

        var button = e.target
        var text = button.innerHTML

        // button.classList.remove('fa-copy')
        // button.classList.add('fa-check')
        copySuccess.classList.remove('hidden')
        copySuccess.closest('.content').querySelector('code').classList.add('copied')

        setTimeout(function () {
          button.innerHTML = text
          button.style.width = ''
          // button.classList.remove('fa-check')
          // button.classList.add('fa-copy')
          copySuccess.classList.add('hidden')
          copySuccess.closest('.content').querySelector('code').classList.remove('copied')
        }, 1000)
      })

      var inset = createElement('div', 'code-inset', copyButton)
      if (language !== 'none' && language) inset.dataset.lang = casedLang(language)

      inset.appendChild(copySuccess)

      // if (originalTitle) {
      //   div.insertBefore(inset, pre)
      // } else {
      //   pre.appendChild(inset)
      // }

      // pre.appendChild(inset)

      headerDivs.push(inset)
    }

    var header = createElement('div', 'code-header', headerDivs)
    div.insertBefore(header, pre)
  }

  // Apply Code Headers
  document.querySelectorAll('.highlight')
    .forEach(addCodeHeader)

  // Collapse/Expand long blocks
  var codeMaxLines = 15
  var codeTolerance = 5 // if block is shorter than codeMaxLines+codeTolerance, it won't be collapsed
  var codeBlocks = document.getElementsByClassName('highlight')
  if (!codeBlocks[0]) return
  var codeLineHeight = parseFloat(window.getComputedStyle(
    codeBlocks[0], null)
    .getPropertyValue('line-height')) //line-height property value (in px) in code blocks
  var codeMaxHeight = codeLineHeight * codeMaxLines
  var maskImage = 'linear-gradient(to bottom, black 0px, transparent ' +
                   (codeMaxHeight + 100) + 'px)'

  var codeBlockLinesNum = function (code) {
    var paddingTop = parseFloat(window.getComputedStyle(code, null).getPropertyValue('padding-top'))
    var paddingBottom = parseFloat(window.getComputedStyle(code, null).getPropertyValue('padding-bottom'))
    var height = code.clientHeight - paddingTop - paddingBottom
    var lines = Math.ceil(height / codeLineHeight)
    var hiddenLines = Math.ceil(lines - codeMaxLines)
    return { lines: lines, hiddenLines: hiddenLines }
  }

  var expandCodeBlock = function (e) {
    e.preventDefault()

    var pre = e.target.closest('pre')
    var code = pre.querySelector('code')
    var showMore = pre.querySelector('div.show-more')

    pre.style.maxHeight = pre.scrollHeight + 'px'
    pre.style.overflow = ''
    pre.style.cursor = ''
    code.style.webkitMaskImage = ''
    code.style.maskImage = ''
    pre.removeChild(showMore)
  }

  // Collapse long blocks on load
  var collapseCodeBlock = function (pre) {
    var dotContent = pre.parentNode
    var listingBlock = dotContent.parentNode
    var code = pre.querySelector('code')

    if (!listingBlock.classList.contains('nocollapse') &&
        pre.offsetHeight > (codeMaxLines + codeTolerance) * codeLineHeight) {
      pre.style.maxHeight = codeMaxHeight + 'px'
      pre.style.overflow = 'hidden'
      pre.style.cursor = 'grab'
      code.style.webkitMaskImage = maskImage
      code.style.maskImage = maskImage

      var showMore = createElement('div', 'show-more')
      pre.addEventListener('click', expandCodeBlock)
      var showMoreLink = createElement('a')
      var blockLines = codeBlockLinesNum(code)
      showMoreLink.innerHTML = 'View all (' + blockLines.hiddenLines + ' more lines)'
      pre.appendChild(showMore)
      showMore.appendChild(showMoreLink)
    }
  }

  // Apply collapseCodeBlock
  document.querySelectorAll('.highlight')
    .forEach(collapseCodeBlock)

  // Tagged examples
  var targetActive = 'tabbed-target--active'
  var tabActive = 'tabbed-tab--active'

  var switchTab = function (e) {
    var tab = e.target
    var title = tab.innerHTML
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
  }

  // Tabbed code
  Array.from(document.querySelectorAll('.tabs'))
    .forEach(function (tab) {
      var originalTab = tab
      var parent = tab.parentElement

      // Build an array of elements
      var elements = [tab]

      // Loop through the next sibling until it doesn't contain a <code> tag
      while (tab) {
        var nextTab = tab.nextElementSibling

        if (nextTab && !nextTab.classList.contains('sect2') && nextTab.querySelector('code')) {
          elements.push(nextTab)

          tab = nextTab
        } else {
          tab = false
        }
      }

      // Don't do anything if there's only one tab
      if (elements.length <= 1) {
        return
      }

      var tabbedContainer = createElement('div', 'tabbed-container', [])
      var tabbedParent = createElement('div', 'tabbed', [tabbedContainer])

      parent.insertBefore(tabbedParent, originalTab)

      // Build up tabs
      var tabs = elements.map(function (element) {
        var title = element.querySelector('.title')
        var codeLanguage = element.querySelector('.code-language')
        var text
        if (title) {
          text = title.innerHTML
        } else if (codeLanguage) {
          text = codeLanguage.innerHTML
        }

        var tabElement = createElement('li', 'tabbed-tab', [document.createTextNode(text)])
        element.dataset.title = text
        tabElement.dataset.title = text

        tabElement.addEventListener('click', switchTab)

        return tabElement
      })

      tabs[0].classList.add('tabbed-tab--active')

      tabbedParent.insertBefore(createElement('ul', 'tabbed-tabs', tabs), tabbedContainer)

      // Remove elements from parent and add to tab container
      elements.forEach(function (element) {
        parent.removeChild(element)
        tabbedContainer.appendChild(element)

        element.classList.add('tabbed-target')
      })

      elements[0].classList.add('tabbed-target--active')
    })
})
