import { cleanCode, convert } from './code'
import { createElement } from './dom'
import { forcedGraph } from './graph'
import { executeQuery, initSession } from './graphgist'

let graphGistSessionId

export function runnable (row, runText = 'Run Query', successCallback, errorCallback) {
  let driver
  var defaultDatabase = 'movies'
  var defaultBackend = 'neo4jlabs'
  var databasePrefix = 'database:'
  var backendPrefix = 'backend:'
  var modePrefix = 'mode:'
  var instantClass = 'instant'
  var graphClass = 'graph'

  var validModes = ['mode:read', 'mode:write']
  var maxRows = 100

  var initDriver = function () {
    if (!driver) {
      // TODO: Auth token to sandbox or Aura
      window.neo4jDatabaseUri = 'neo4j+s://demo.neo4jlabs.com:7687'
      window.neo4jDatabase = 'movies'
      driver = window.neo4j.driver(window.neo4jDatabaseUri, window.neo4j.auth.basic('movies', 'movies'))

      return driver.verifyConnectivity()
        .then(function () {
          return driver
        })
    }

    return Promise.resolve(driver)
  }

  const initGraphGistSession = async function () {
    if (!graphGistSessionId) {
      const initSessionResponse = await initSession()
      graphGistSessionId = initSessionResponse.data.getConsoleSessionId
    }
    return graphGistSessionId
  }

  const removeResults = function (content) {
    Array.from(content.querySelectorAll('.code-results'))
      .forEach(function (el) {
        content.removeChild(el)
      })
  }

  const renderResultsAsTable = function (res) {
    const headers = res.columns.map(function (key) {
      return createElement('th', '', [document.createTextNode(key)])
    })
    const tr = createElement('tr', '', headers)
    const thead = createElement('thead', '', [tr])

    const tbody = createElement('tbody', '',
      res.data.map(function (row, index) {
        return createElement('tr', 'row-' + index,
          // Each column
          res.columns.map(function (column) {
            let value = convert(row[column])

            if (typeof value !== 'string') {
              value = createElement('pre', '', [
                document.createTextNode(JSON.stringify(value, null, 2)),
              ])
            } else value = document.createTextNode(value)

            return createElement('td', column, [value])
          })
        )
      })
    )

    return createElement('table', 'code-result-table', [
      thead,
      tbody,
    ])
  }

  const renderResultsAsGraph = function (content, res) {
    const container = createElement('div', 'gram')

    content.appendChild(container)

    const replaceSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    replaceSvg.setAttribute('width', container.clientWidth)
    replaceSvg.setAttribute('height', container.clientHeight)

    // Append to container
    container.appendChild(replaceSvg)

    // filter by paths
    const activeNodes = new Set()
    for (const path of res.paths) {
      const keys = Object.keys(path)
      for (const key of keys) {
        const obj = path[key]
        const entries = Array.isArray(obj) ? obj : [obj]
        for (const entry of entries) {
          if (entry._labels) {
            activeNodes.add(JSON.stringify({ id: entry._id, labels: entry._labels }))
          }
        }
      }
    }
    const nodes = activeNodes && activeNodes.size > 0
      ? res.nodes.filter((node) => {
        return activeNodes.has(JSON.stringify({ id: node.id, labels: node.labels }))
      })
      : res.nodes
    const nodeIds = nodes.map((node) => node.id)
    const links = activeNodes && activeNodes.size > 0 && res.links.some((link) => link.selected)
      ? res.links.filter((link) => link.selected)
      : res.links.filter((link) => link.end && nodeIds.includes(link.end) && link.target && nodeIds.includes(link.target))

    // Wait 100ms so the svg element is rendered
    setTimeout(() => forcedGraph(replaceSvg, { nodes, links }), 100)
    return container
  }

  function prepareGraphData (res) {
    const data = {}
    if (res.visualization) {
      data.paths = res.json
      data.nodes = res.visualization.nodes
      const links = res.visualization.links
      data.links = links.map((link) => {
        // link.source is an array index (of the nodes array) but we expect a node id
        if (link.source) {
          link.source = link.start
        }
        // link.target is an array index (of the nodes array) but we expect a node id
        if (link.target) {
          link.target = link.end
        }
        return link
      })
    } else {
      const nodes = []
      const links = []
      res.records.forEach((row) => {
        row.keys.forEach((key) => {
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
      // TODO: Paths
      data.paths = []
      data.nodes = nodes
      data.links = links
    }
    return data
  }

  function prepareTableData (res) {
    const data = {}
    if (res.columns) {
      data.columns = res.columns
    }
    if (res.json) {
      data.data = res.json.slice(0, maxRows)
    }
    if (res.records) {
      data.columns = res.records[0].keys
      data.data = res.records.slice(0, maxRows).map(function (row) {
        return row.keys.reduce(function (acc, key) {
          acc[key] = convert(row.get(key))
          return acc
        }, {})
      })
    }
    return data
  }

  const renderResults = function (content, res, renderAsGraph) {
    // Default view
    var showGraph = content.parentNode.classList.contains(graphClass)

    if (renderAsGraph === undefined) {
      renderAsGraph = showGraph
    }

    removeResults(content)

    var container = createElement('div', 'code-result-container')

    let results
    if (renderAsGraph) {
      const data = prepareGraphData(res)
      results = renderResultsAsGraph(container, data)
    } else {
      const data = prepareTableData(res)
      if (data.columns && data.columns.length && data.data && data.data.length) {
        results = renderResultsAsTable(data)
      } else {
        // empty data, show raw result
        results = createElement('code', 'code-result-raw', createElement('pre', '', document.createTextNode(res.result)))
      }
    }

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

  const run = async function (mode, database, content, footer, runButton, loading, backend = 'neo4jlabs') {
    // Get Code
    // TODO: Parameters etc
    const input = cleanCode(content.querySelector('pre').innerText)

    if (input.trim() === '') return

    if (backend === 'neo4jlabs') {
      loading.innerHTML = 'Initialising Driver&hellip;'
      runButton.disabled = true

      if (window.mixpanel) {
        window.mixpanel.track('DOCS_CODE_RUN_EXAMPLE', {
          pathname: window.location.origin + window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          database,
          mode,
          language: 'cypher',
          code: input,
        })
      }

      initDriver()
        .then(function (driver) {
          loading.innerHTML = 'Running Query&hellip;'

          var session = driver.session({ mode: mode, database: database })
          var tx = session.beginTransaction()

          return tx.run(input)
            .then(function (res) {
              runButton.disabled = false
              loading.innerHTML = ''
              footer.classList.add('has-results')

              if (typeof successCallback === 'function') {
                successCallback({ cypher: input, results: res })
              }

              renderResults(content, res)
            })
            .catch(function (err) {
              runButton.disabled = false
              loading.innerHTML = ''
              footer.classList.add('has-results')

              if (typeof errorCallback === 'function') {
                errorCallback({ cypher: input, error: err })
              }

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
          runButton.disabled = false
          loading.innerHTML = ''
          footer.classList.add('has-results')

          if (typeof errorCallback === 'function') {
            errorCallback({ cypher: input, error: err })
          }

          if (window.mixpanel) {
            window.mixpanel.track('DOCS_CODE_RUN_ERROR', {
              pathname: window.location.origin + window.location.pathname,
              search: window.location.search,
              hash: window.location.hash,
              database,
              mode,
              code: input,
              message: err.message,
            })
          }

          renderError(content, err)
        })
    } else {
      loading.innerHTML = 'Initialising Session&hellip;'
      runButton.disabled = true

      try {
        const sessionId = await initGraphGistSession()
        loading.innerHTML = 'Running Query&hellip;'
        try {
          const executeQueryResponse = await executeQuery(input, sessionId)
          const res = JSON.parse(executeQueryResponse.data.queryConsole)

          runButton.disabled = false
          loading.innerHTML = ''
          footer.classList.add('has-results')

          if (res.error) {
            // query is invalid
            console.error('Unsuccessful query:', res.error)
            renderError(content, { message: res.error })
          } else {
            renderResults(content, res)
          }
        } catch (executeQueryError) {
          runButton.disabled = false
          loading.innerHTML = ''
          footer.classList.add('has-results')

          console.error('Error while executing query:', executeQueryError)
          renderError(content, executeQueryError)
        }
      } catch (error) {
        runButton.disabled = false
        loading.innerHTML = ''
        footer.classList.add('has-results')

        console.error('Something bad happened:', error)
        renderError(content, error)
      }
    }
  }

  var mode = 'READ'
  var database = defaultDatabase
  var backend = defaultBackend

  var content = row.querySelector('.content')
  var pre = content.querySelector('pre')

  var originalHTML = pre.innerHTML
  var originalText = cleanCode(pre.innerText)

  var loading = createElement('div', 'loading')

  const codeFooterElements = [
    loading,
    createElement('div', 'spacer'),
  ]

  const runButton = createElement('button', 'btn btn-run btn-primary', [document.createTextNode(runText)])

  if (!row.classList.contains('single')) {
    runButton.addEventListener('click', function () {
      run(mode, database, content, footer, runButton, loading, backend)
    })
    codeFooterElements.unshift(runButton)
  }

  var footer = createElement('div', 'code-footer', codeFooterElements)

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
    } else if (el.startsWith(backendPrefix)) {
      backend = el.replace(backendPrefix, '').toLowerCase()
    }
  })

  let callback = () => {}
  if (row.classList.contains(instantClass)) {
    callback = async () => run(mode, database, content, footer, runButton, loading, backend)
  }

  return {
    element: row,
    callback,
  }
}
