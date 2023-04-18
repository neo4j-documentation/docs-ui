import { createElement } from './modules/dom'

const prodMatrix = {
  'auradb-free': 'aura-dbf',
  'auradb-professional': 'aura-dbp',
  'auradb-enterprise': 'aura-dbe',
  'aurads-professional': 'aura-dsp',
  'aurads-enterprise': 'aura-dse',
  'neo4j-community': 'neo4j-ce',
  'neo4j-enterprise': 'neo4j-ee',
}

document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('body.cheat-sheet')) return

  // const curURL = new URL('https://development.neo4j.dev/docs/cypher-cheat-sheet/4.1/auradb-free/')
  const curURL = document.location
  const selectionFromPath = getSelectionFromPath(curURL)

  if (selectionFromPath) {
    updateSelectorFromProduct(selectionFromPath)
  } else {
    const queryString = window.location.search
    const selectionFromProduct = getSelectionFromProduct(queryString)
    if (selectionFromProduct) {
      updateSelectorFromProduct(selectionFromProduct)
    }
  }

  const csSelector = '#cheat-sheet-selector'
  const cs = document.querySelector(csSelector)
  cs.dataset.current = cs.options[cs.selectedIndex].value

  if (!cs) return

  // get all the cheat-sheet selector values from the select
  const optionMap = [...cs.options].map((o) => ({
    value: o.value,
    text: o.dataset.label,
    hidden: o.hidden,
  }))

  const optionNames = [...cs.options].reduce(function (f, o) {
    f.push(o.value)
    return f
  }, []).sort()

  const visibleOptionNames = [...cs.options].reduce(function (f, o) {
    if (!o.hidden) f.push(o.value)
    return f
  }, []).sort()

  const hiddenOptionNames = [...cs.options].reduce(function (f, o) {
    if (o.hidden) f.push(o.value)
    return f
  }, []).sort()

  const defaultClasses = ['exampleblock', 'sect2', 'sect1']

  // get list of classes for each example codeblock and section
  document.querySelectorAll(defaultClasses.map((c) => '.' + c)).forEach((el) => {
    if (el.classList.contains('hidden')) return

    // get an array of classes on the element
    const classes = [...el.classList]

    // remove defaultClasses to get an array of classes that could be labels
    const labels = classes.filter(function (obj) {
      return defaultClasses.indexOf(obj) === -1
    }).sort()

    // get an array of classes that match the select options
    const matches = optionNames.filter(function (obj) {
      return labels.indexOf(obj) !== -1
    }).sort()

    const outofscope = labels.filter(function (obj) {
      return optionNames.indexOf(obj) === -1
    }).sort()

    const selectable = visibleOptionNames.filter(function (obj) {
      return labels.indexOf(obj) !== -1
    }).sort()

    const notSelectable = hiddenOptionNames.filter(function (obj) {
      return labels.indexOf(obj) !== -1
    }).sort()

    // always visible: has no labels from the 'visible' options list or all the labels in the 'visible' options list
    // never visible: has no labels from the 'visible' list, and one or more labels not in the all options list

    // remove out of scope classes
    outofscope.forEach((label) => { el.classList.remove(label) })

    // remove the sections that don't apply to this cheat sheet
    if (selectable.length === 0 && outofscope.length > 0) {
      el.remove()
    } else {
      // make entries always visible if they have nothing selectable and nothing out of scope
      if (selectable.length === 0 || selectable.toString() === visibleOptionNames.toString()) el.classList.add('cs-all')
    }

    // add labels where appropriate
    let labelsToAdd = notSelectable
    if (selectable.toString() !== visibleOptionNames.toString()) labelsToAdd = labelsToAdd.concat(selectable)

    if (labelsToAdd && matches.length > 0) {
      labelsToAdd.sort().forEach((label) => {
        addLabel(el, label)
      })
    }
  })

  // if we've removed elements we need to clean the toc by removing entries for those elements
  cleanToc()

  function addLabel (el, match) {
    const div = createElement('div', 'paragraph')
    // if (el.classList.contains('sect2')) div.classList.add('page-labels')
    if (el.classList.contains('exampleblock')) div.classList.add('labels')
    else div.classList.add('page-labels')
    const p = createElement('p')
    const span = createElement('span', `label label--${match}`)
    const text = optionMap.find((label) => label.value === match).text
    span.textContent = text
    p.appendChild(span)
    // if there is a label div, add the new label
    const labelsDiv = el.firstElementChild.querySelector('div.labels')
    if (labelsDiv) {
      labelsDiv.append(p)
    } else {
      div.appendChild(p)
      el.firstElementChild.appendChild(div)
    }
  }

  // hide labels for versions that are not available in the select box
  document.querySelectorAll('span.label').forEach((el) => {
    const labelClass = [...el.classList].filter((c) => c.startsWith('label--')).toString().replace('label--', '').trim()
    if (!optionNames.includes(labelClass)) {
      el.remove()
    }
  })

  // toggle for default cheat sheet selection
  const selected = cs.selectedIndex

  var versionSelector = document.querySelector('body.cheat-sheet .version-selector')
  if (versionSelector) {
    versionSelector.addEventListener('change', function (e) {
      const target = e.target

      const selectedProduct = cs.selectedIndex
      const current = target.dataset.current
      const next = target.selectedOptions[0].dataset.version
      let newUrl
      if (selectionFromPath) {
        const re = new RegExp(`/${current}/`)
        newUrl = document.URL.replace(re, `/${next}/`)
      } else {
        newUrl = `${target.value}?product=${cs.options[selectedProduct].value}`
      }

      if (window.ga) {
        window.ga('send', 'event', 'version-select', 'From: ' + current + ';To:' + next + ';')
      }

      document.location.replace(newUrl)
    })
  }

  toggleExamples(cs.options[selected].value)

  // hide and unhide sections when the selection is changed
  cs.addEventListener('change', function (e) {
    e.stopPropagation()

    // if we're using a proxied path, just load the new url
    if (selectionFromPath) {
      // get the new url
      const currentProd = Object.keys(prodMatrix).find((key) => prodMatrix[key] === e.target.dataset.current)
      const newProd = Object.keys(prodMatrix).find((key) => prodMatrix[key] === e.target.value)
      const newURL = curURL.href.replace(currentProd, newProd)
      document.location.replace(newURL)
    } else {
      // reset everything
      clearHidden()
      // fake a scroll event to trigger feedback scroll event
      window.scrollTo(window.scrollX, window.scrollY + 1)
      // hide content according to the new selection
      toggleExamples(e.target.value)
      // fake a scroll event to trigger feedback scroll event
      window.scrollTo(window.scrollX, window.scrollY - 1)
    }
  })
})

function clearHidden () {
  document.querySelectorAll('.toc-menu .hidden, .content .sect1.hidden, .content .sect2.hidden, .content .exampleblock.hidden').forEach((el) => {
    el.classList.remove('hidden')
  })
}

function toggleExamples (value) {
  // hide headers
  document.querySelectorAll(`div.sect1:not(.cs-all, .${value})`).forEach((el) => {
    el.classList.toggle('hidden')
  })

  // hide sections
  document.querySelectorAll(`div.sect2:not(.cs-all, .${value})`).forEach((el) => {
    el.classList.toggle('hidden')
  })

  // hide individual examples
  document.querySelectorAll(`div.exampleblock:not(.cs-all, .${value})`).forEach((el) => {
    el.classList.toggle('hidden')
  })

  // hide sections or headers where all the children are hidden
  const hideableSections = ['div.sect1', 'div.sect2', 'div.exampleblock']
  while (hideableSections.length >= 2) {
    const child = hideableSections.pop()
    const parent = hideableSections[hideableSections.length - 1]
    hideContent(child, parent)
  }

  // hide toc entries
  hideTocEntries()
}

// hide any empty parent sections
function hideContent (child, parent) {
  document.querySelectorAll(`${parent}:not(.hidden)`).forEach((el) => {
    // count the children and hidden children
    const sects = el.querySelectorAll(child).length
    const hidden = el.querySelectorAll(`${child}.hidden`).length

    // if all children are hidden, hide the parent and its toc entry
    // if not, unhide the parent and its toc entry
    if (hidden === sects) {
      el.classList.add('hidden')
    } else {
      el.classList.remove('hidden')
    }
  })
}

// hide entries from the TOC
function hideTocEntries () {
  document.querySelectorAll('div.sect1.hidden, div.sect1.hidden div.sect2, div.sect2.hidden').forEach((el) => {
    const id = el.firstElementChild.id
    const tocEntry = document.querySelector(`.toc-menu a[href="#${id}"]`)
    if (tocEntry) {
      tocEntry.closest('li').classList.toggle('hidden')
    }
  })
}

// remove toc entries for removed sections
function cleanToc () {
  document.querySelectorAll('.toc-menu a').forEach((li) => {
    if (document.querySelector(li.hash) === null) li.remove()
  })
}

function updateSelectorFromProduct (product) {
  // set the default for the product
  const productSelector = document.getElementById('cheat-sheet-selector')
  const productSelectorOptions = productSelector.options

  // change selected value in options list
  let match = false
  for (const option of productSelectorOptions) {
    if (option.label === decodeURIComponent(product) || option.value === decodeURIComponent(product)) {
      productSelector.selectedIndex = option.index
      match = true
    }
  }
  if (!match) {
    // display some html to say that the url params are not right?
  }
}

const stripTrailingSlash = (str) => {
  return str.endsWith('/') ? str.slice(0, -1) : str
}

function getSelectionFromProduct (queryString) {
  const urlParams = new URLSearchParams(queryString)
  if (urlParams.has('product')) {
    const queryProduct = urlParams.get('product')
    if (Object.values(prodMatrix).includes(queryProduct)) {
      return queryProduct
    }
  }
}

function getSelectionFromPath (pageURL) {
  const pathArr = stripTrailingSlash(pageURL.pathname).split('/')
  if (pathArr[0] === '') pathArr.shift()
  const values = pathArr.slice(pathArr.indexOf('cypher-cheat-sheet'))
  values.shift()
  // the first item in values should be a version number
  // the second item in values should be the product
  const pathProduct = values[1]
  if (!pathProduct) return
  // parse pathProduct to match something you could select in the product dropdown
  if (Object.keys(prodMatrix).includes(pathProduct)) {
    return prodMatrix[pathProduct]
  }
}
