document.addEventListener('DOMContentLoaded', function () {
  var driver
  var defaultDatabase = 'movies'
  var databasePrefix = 'database:'
  var modePrefix = 'mode:'
  var instantClass = 'instant'

  var validModes = ['mode:read', 'mode:write']
  var maxRows = 100

  // Add contenteditable attribute to editable code blocks (Experimental)
  document.querySelectorAll('.editable')
    .forEach(function (el) {
      el.querySelectorAll('code').forEach(function (el) {
        el.contentEditable = true
      })
    })

  // Runnable Cypher blocks (Experimental)
  var runnable = Array.from(document.querySelectorAll('.runnable'))

  if (!runnable.length || !window.neo4j) return

  var initDriver = function () {
    if (!driver) {
      // TODO: Auth token to sandbox or Aura
      window.neo4jDatabaseUri = 'neo4j+s://demo.neo4jlabs.com:7687'
      window.neo4jDatabase = 'movies'
      driver = window.neo4j.driver(window.neo4jDatabaseUri, window.neo4j.auth.basic('movies', 'movies'))

      return driver.verifyConnectivity()
        .then(function () { return driver })
    }

    return Promise.resolve(driver)
  }

  // TODO: Share this across other functions
  var createElement = function (el, className, children) {
    var output = document.createElement(el)
    output.setAttribute('class', className)

    Array.isArray(children) && children.forEach(function (child) {
      output.appendChild(child)
    })

    return output
  }
  var cleanCode = function (code, language) {
    var div = document.createElement('div')
    div.innerHTML = code

    Array.from(div.querySelectorAll('i.conum, b')).map(function (el) {
      div.removeChild(el)
    })

    var cleaner = document.createElement('textarea')
    var input = div.innerHTML

    if (language === 'bash' || language === 'sh' || language === 'shell' || language === 'console') {
      input = window.neo4jDocs.copyableCommand(input)
    }

    cleaner.innerHTML = input
    return cleaner.value
  }

  // Convert value from native
  var convert = function (value) {
    if (Array.isArray(value)) {
      return value.map(function (item) { return convert(item) })
    } else if (window.neo4j.isInt(value)) {
      return value.toNumber()
    } else if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(Object.keys(value).map(function (key) {
        return [key, convert(value[key])]
      }))
    }

    return value
  }

  var removeResults = function (content) {
    Array.from(content.querySelectorAll('.code-results'))
      .forEach(function (el) { content.removeChild(el) })
  }

  var renderResults = function (content, res) {
    removeResults(content)

    var headers = res.records[0].keys.map(function (key) {
      return createElement('th', '', [document.createTextNode(key)])
    })
    var tr = createElement('tr', '', headers)
    var thead = createElement('thead', '', [tr])

    var tbody = createElement('tbody', '',
      // Max First 100 Rows
      res.records.slice(0, maxRows).map(function (row, index) {
        return createElement('tr', 'row-' + index,
          // Each column
          row.keys.map(function (key) {
            var value = convert(row.get(key))

            if (typeof value !== 'string') {
              value = createElement('pre', '', [
                document.createTextNode(JSON.stringify(value, null, 2)),
              ])
            } else value = document.createTextNode(value)

            return createElement('td', key, [value])
          })
        )
      })
    )

    var table = createElement('table', 'code-result-table', [
      thead,
      tbody,
    ])

    var container = createElement('div', 'code-result-container', [table])

    var close = createElement('button', 'btn btn-close', [document.createTextNode('Close Results')])

    close.addEventListener('click', function() { removeResults(content) })

    // TODO: Toggle table and graph
    var header = createElement('div', 'code-result-options', [
      createElement('div', 'code-result-header', [document.createTextNode('Results')]),
      createElement('div', 'spacer'),
      close,
    ])

    var results = createElement('div', 'code-results', [
      header,
      container,
    ])

    content.appendChild(results)
  }

  var renderError = function (content, err) {
    removeResults(content)

    var error = createElement('div', 'code-results', [
      createElement('div', 'code-result-options', [
        createElement('div', 'code-result-header', [
          document.createTextNode('Error'),
        ]),
      ]),
      createElement('pre', 'error', [
        document.createTextNode(err.message),
      ]),
    ])

    content.appendChild(error)
  }

  var run = function (mode, database, content, footer, button, loading) {
    // Get Code
    // TODO: Parameters etc
    var input = cleanCode(content.querySelector('pre').innerText)

    loading.innerHTML = 'Initialising Driver&hellip;'
    button.disabled = true

    initDriver()
      .then(function (driver) {
        loading.innerHTML = 'Running Query&hellip;'

        var session = driver.session({ mode: mode, database: database })
        var tx = session.beginTransaction()

        return tx.run(input)
          .then(function (res) {
            button.disabled = false
            loading.innerHTML = ''
            footer.classList.add('has-results')

            renderResults(content, res)
          })
          .catch(function (err) {
            button.disabled = false
            loading.innerHTML = ''
            footer.classList.add('has-results')

            renderError(content, err)
          })
          .then(function () {
            return tx.rollback()
          })
          .then(function () {
            return session.close()
          })
      })
      .catch(function (err) {
        button.disabled = false
        loading.innerHTML = ''
        footer.classList.add('has-results')

        renderError(content, err)
      })
  }

  runnable.map(function (row) {
    var mode = 'READ'
    var database = defaultDatabase

    var content = row.querySelector('.content')
    var pre = content.querySelector('pre')

    var originalHTML = pre.innerHTML
    var originalText = cleanCode(pre.innerText)

    var button = createElement('button', 'btn btn-run btn-primary', [document.createTextNode('Run Example')])
    var loading = createElement('div', 'loading')

    var footer = createElement('div', 'code-footer', [
        button,
        createElement('div', 'spacer')
    ])

    content.appendChild(footer)

    content.addEventListener('input', function(e) {
        var reset = footer.querySelector('.btn-reset')

        if ( cleanCode(content.querySelector('pre').innerText) !== originalText ) {
            if ( !reset ) {
                reset = createElement('button', 'btn btn-reset', [
                    document.createTextNode('Reset')
                ])

                footer.appendChild(reset)

                // On click, reset HTML and remove button
                reset.addEventListener('click', function() {
                    pre.innerHTML = originalHTML
                    footer.removeChild(reset)
                })
            }
        }
        else {
            if ( reset ) {
                footer.removeChild( reset )
            }
        }
    })

    row.classList.forEach(function (el) {
      if (el.startsWith(databasePrefix)) {
        database = el.replace(databasePrefix, '')
      } else if (el.startsWith(modePrefix) && validModes.indexOf(el.toLowerCase()) > -1) {
        mode = el.replace(modePrefix, '').toUpperCase()
      }
    })

    button.addEventListener('click', function () {
      run(mode, database, content, footer, button, loading)
    })

    if (row.classList.contains(instantClass)) {
      run(mode, database, content, footer, button, loading)
    }
  })
})
