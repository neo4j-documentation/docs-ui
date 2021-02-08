import { cleanCode, convert } from './modules/code'
import { createElement } from './modules/dom'
import { forcedGraph } from './modules/graph'

document.addEventListener('DOMContentLoaded', function () {
  var driver
  var defaultDatabase = 'movies'
  var databasePrefix = 'database:'
  var modePrefix = 'mode:'
  var instantClass = 'instant'
  var graphClass = 'graph'

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

  var removeResults = function (content) {
    Array.from(content.querySelectorAll('.code-results'))
      .forEach(function (el) { content.removeChild(el) })
  }

  var renderResultsAsTable = function (res) {
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

    return createElement('table', 'code-result-table', [
      thead,
      tbody,
    ])
  }

  var renderResultsAsGraph = function (content, res) {
    var container = createElement('div', 'gram')

    content.appendChild(container)

    var replaceSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    replaceSvg.setAttribute('width', container.clientWidth)
    replaceSvg.setAttribute('height', container.clientHeight)

    // Append to container
    container.appendChild(replaceSvg)

    const nodes = []
    const links = []

    // TODO: Paths
    res.records.map((row) => {
      row.keys.map((key) => {
        const value = row.get(key)

        if (value.labels && nodes.findIndex((node) => node.id === value.identity.toNumber()) === -1) {
          nodes.push({
            id: value.identity.toNumber(),
            labels: value.labels,
            properties: value.properties,
          })
        } else if (value.type) {
          links.push({
            id: value.identity.toNumber(),
            source: value.start.toNumber(),
            target: value.end.toNumber(),
            type: value.type,
            properties: value.properties,
          })
        }
      })
    })

    // Wait 100ms so the svg element is rendered
    setTimeout(() => forcedGraph(replaceSvg, { nodes, links }), 100)
    return container
  }

  var renderResults = function (content, res, renderAsGraph) {
    // Default view
    var showGraph = content.parentNode.classList.contains(graphClass)

    if (renderAsGraph === undefined) {
      renderAsGraph = showGraph
    }

    removeResults(content)

    var container = createElement('div', 'code-result-container')

    var results = renderAsGraph
      ? renderResultsAsGraph(container, res)
      : renderResultsAsTable(res)

    container.appendChild(results)

    var close = createElement('button', 'btn btn-close', [document.createTextNode('Close Results')])

    close.addEventListener('click', function () {
      removeResults(content)
    })

    // Toggle Graph & Table view
    var viewToggle = null

    if (showGraph) {
      var graphButton = createElement('button', renderAsGraph ? 'code-result-toggle--current' : '', document.createTextNode('Graph'))

      graphButton.addEventListener('click', () => {
        renderResults(content, res, true)
      })

      var tableButton = createElement('button', renderAsGraph ? '' : 'code-result-toggle--current', document.createTextNode('Table'))

      tableButton.addEventListener('click', () => {
        renderResults(content, res, false)
      })

      viewToggle = createElement('div', 'code-result-toggle', [
        graphButton,
        tableButton,
      ])
    }

    var header = createElement('div', 'code-result-options', [
      createElement('div', 'code-result-header', [document.createTextNode('Results')]),
      createElement('div', 'spacer'),
      viewToggle,
      close,
    ])

    var output = createElement('div', 'code-results', [
      header,
      container,
    ])

    content.appendChild(output)
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
      loading,
      createElement('div', 'spacer'),
    ])

    content.appendChild(footer)

    content.addEventListener('input', function (e) {
      var reset = footer.querySelector('.btn-reset')

      if (cleanCode(content.querySelector('pre').innerText) !== originalText) {
        if (!reset) {
          reset = createElement('button', 'btn btn-reset', [
            document.createTextNode('Reset'),
          ])

          footer.appendChild(reset)

          // On click, reset HTML and remove button
          reset.addEventListener('click', function () {
            pre.innerHTML = originalHTML
            footer.removeChild(reset)
          })
        }
      } else {
        if (reset) {
          footer.removeChild(reset)
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
