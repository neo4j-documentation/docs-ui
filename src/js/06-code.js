document.addEventListener('DOMContentLoaded', function () {
  var ignore = ['gram']

  var cleanCode = function (code) {
    var div = document.createElement('div')
    div.innerHTML = code

    Array.from(div.querySelectorAll('i.conum, b')).map(function (el) {
      div.removeChild(el)
    })

    var cleaner = document.createElement('textarea')
    cleaner.innerHTML = div.innerHTML

    return cleaner.value
  }

  var copyToClipboard = function (code) {
    var textarea = document.createElement('textarea')
    textarea.value = cleanCode(code)
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';

    document.body.appendChild(textarea)
    textarea.select()

    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  var addCodeHeader = function (pre) {
    var block = pre.querySelector('code')
    var div = pre.parentNode

    var code = block.innerHTML
    var language = block.hasAttribute('class') && block.getAttribute('class').match(/language-([a-z0-9-])+/)[0].replace('language-', '')

    if ( ignore.indexOf(language) > -1 ) return;

    var languageDiv = document.createElement('div')
    languageDiv.className = 'code-language'

    if ( language ) {
      languageDiv.innerHTML = language
    }

    var copyButton = createElement('button', 'btn btn-copy', [document.createTextNode('Copy to Clipboard')])
    copyButton.addEventListener('click', function (e) {
      e.preventDefault()
      copyToClipboard(code)
    })

    var children = [languageDiv, copyButton]


    if (language === "cypher") {
      var runButton = createElement('button', 'btn btn-run btn-primary', [document.createTextNode('Run in Browser')])
      runButton.addEventListener('click', function (e) {
        e.preventDefault()

        runButton.addEventListener("click", function (e) {
          e.preventDefault()

          window.location.href = 'neo4j-desktop://graphapps/neo4j-browser?cmd=edit&arg=' + encodeURIComponent(cleanCode(code))
        })
      })

      children.push(runButton)
    }

    var header = createElement('div', 'code-header', children)

    pre.className += ' has-header'
    div.insertBefore(header, pre)
  }

  var createElement = function (el, className, children) {
    var output = document.createElement(el)
    output.setAttribute('class', className)

    Array.isArray(children) && children.forEach(function (child) {
      output.appendChild(child)
    })

    return output
  }

  Array.from(document.querySelectorAll('.highlight'))
    .map(addCodeHeader)
})
