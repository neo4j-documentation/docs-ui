import { createElement } from './modules/dom'

const selectorOptions = document.querySelectorAll('[id^=cheat-sheet-selector-] option')

const optionMap = [...selectorOptions].map((o) => ({
  value: o.value,
  text: o.dataset.label,
  class: o.dataset.class,
  labelType: o.dataset.labelType,
  default: o.dataset.defaultValue,
  labelOnly: o.hidden,
  selected: o.selected,
  inScope: true,
}))

// TODO construct prodMatrix from optionMap?
const prodMatrix = {
  'auradb-free': 'aura-dbf',
  'auradb-professional': 'aura-dbp',
  'auradb-dedicated': 'aura-dbe',
  'auradb-critical': 'aura-dbc',
  'aurads-professional': 'aura-dsp',
  'aurads-enterprise': 'aura-dse',
  'neo4j-community': 'neo4j-ce',
  'neo4j-enterprise': 'neo4j-ee',
}

// get the default product from optionMap
const defaultProdArray = optionMap.find((prod) => prod.default === 'true')

// display for 'all' products unless a differnt value is specified via attributes in source
let defaultProd
if (defaultProdArray && optionMap) {
  defaultProd = defaultProdArray ? defaultProdArray.value : optionMap[0].value
} else {
  defaultProd = 'all'
}
const defaultClasses = ['exampleblock', 'sect2', 'sect1']

document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('body.cheat-sheet')) return

  const selectionFromPath = fixURL()

  const curURL = document.location

  if (selectionFromPath) {
    updateSelectorFromProduct(selectionFromPath)
    updateMetaFromProduct(selectionFromPath, curURL)
  }

  const queryString = document.location.search
  const urlParams = new URLSearchParams(queryString)

  if (urlParams.has('sid')) {
    const scrollToSection = checkHashVariations(urlParams.get('sid'))
    if (scrollToSection) {
      document.location.hash = scrollToSection
    }
    document.location.replace(document.location.href.replace(document.location.search, ''))
  }

  // check for a checkbox to display or hide labels
  const labelShow = document.querySelector('#products-highlight')
  if (labelShow) {
    labelShow.addEventListener('click', function (c) {
      c.stopPropagation()
      toggleLabels(c.target.checked)
    })
  }

  const optionNames = [...selectorOptions].reduce(function (f, o) {
    f.push(o.value)
    return f
  }, []).sort()

  const hiddenOptionNames = [...selectorOptions].reduce(function (f, o) {
    if (o.hidden) f.push(o.value)
    return f
  }, []).sort()

  // get list of classes for each example codeblock and section
  document.querySelectorAll(defaultClasses.map((c) => '.' + c)).forEach((el) => {
    if (el.classList.contains('hidden')) return

    // get an array of classes on the element
    const elClasses = removeDefaultClasses([...el.classList])

    // console.log(`classes on the element: ${elClasses}`)

    // get an array of classes that match the select options
    let labelsToAdd = optionNames.filter(function (obj) {
      return elClasses.indexOf(obj) !== -1
    }).sort()

    // add unknown products to hidden classes list
    if (elClasses.length !== 0 && labelsToAdd.length === 0) {
      elClasses.forEach((l) => {
        if (hiddenOptionNames.indexOf(l) === -1 && Object.values(prodMatrix).includes(l)) {
          hiddenOptionNames.push(l)
          optionMap.push({
            value: l,
            text: l,
            class: l,
            labelType: 'products',
            inScope: false,
          })
        }
      })
      return
    }

    const allLabels = Object.values(prodMatrix)
    let availableOn = true
    const difference = allLabels.filter((l) => !labelsToAdd.includes(l))
    if (difference && difference.length <= 2) {
      labelsToAdd = difference
      availableOn = false
    }

    if (labelsToAdd && labelsToAdd.length > 0) {
      labelsToAdd.forEach((label) => {
        if (label !== 'all') {
          addLabel(el, label, availableOn)
        }
      })
    }
  })

  // if we've removed elements we need to clean the toc by removing entries for those elements
  cleanToc()

  function addLabel (el, match, availableOn) {
    const div = createElement('div', 'paragraph')
    let labelType = 'labels'

    // need to get what 'group' the label belongs to

    const group = [...new Set(optionMap.filter(function (f) {
      return f.value === match
    }).map((obj) => obj.labelType))]

    let addCLassToChildren = true
    if (el.classList.contains('exampleblock')) {
      if (el.closest('.sect2').classList.contains(match)) return
      div.classList.add('labels')
      addCLassToChildren = false
    } else {
      if (el.classList.contains('sect2') && el.closest('.sect1').classList.contains(match)) return
      div.classList.add('page-labels')
      labelType = 'page-labels'
    }
    const p = createElement('p')
    const span = createElement('span', `label label--${match} group--${group}`)

    let text = getProductFromOptionMap(match)
    if (!availableOn) {
      text = 'Not available on ' + text
      span.classList.add('not-available')
    }
    span.textContent = text
    p.appendChild(span)

    // if there is a label div, add the new label
    // if no label div yet, add this label to the new div and insert the new div
    // note: where it is inserted depends on whether it is a labels div or page-labels div
    const labelsDiv = (labelType === 'labels') ? el.firstElementChild.querySelector(`div.${labelType}`) : el.querySelector(`div.${labelType}`)
    if (labelsDiv) {
      labelsDiv.append(p)
    } else {
      div.appendChild(p)
      if (labelType === 'labels') {
        el.firstElementChild.prepend(div)
      } else {
        el.firstElementChild.after(div) // for a page label we assume that the first child is h2 or h3
      }
    }
    if (addCLassToChildren) {
      el.querySelectorAll('.sect2, .exampleblock').forEach((child) => {
        child.classList.add(match)
      })
    }
  }

  // hide labels for versions that are not available in the select box
  document.querySelectorAll('span.label').forEach((el) => {
    const labelClass = [...el.classList].filter((c) => c.startsWith('label--')).toString().replace('label--', '').trim()
    if (!optionNames.includes(labelClass)) {
      el.remove()
    }
  })

  const prodSelectorID = '#cheat-sheet-selector-products'
  const prodSelector = document.querySelector(prodSelectorID)
  prodSelector.dataset.current = prodSelector.options[prodSelector.selectedIndex].value

  var versionSelector = document.querySelector('body.cheat-sheet .version-selector')

  prodSelector.addEventListener('change', function (e) {
    e.stopPropagation()

    // if localhost
    if (curURL.host.indexOf('localhost') !== -1) {
      setVisibility(hiddenOptionNames, e.target.value === 'all')
      return
    }

    const currentProd = (e.target.dataset.current === 'all') ? 'all' : Object.keys(prodMatrix).find((key) => prodMatrix[key] === e.target.dataset.current)
    // console.log(currentProd)
    const newProd = (e.target.value === 'all') ? 'all' : Object.keys(prodMatrix).find((key) => prodMatrix[key] === e.target.value)
    // console.log(newProd)

    const re = new RegExp(`/${currentProd}`)
    let newURL

    // if we're using a proxied path, just load the new url
    if (selectionFromPath) {
      // console.log(`using selection from path: ${selectionFromPath}`)
      // console.log(`current URL: ${curURL.href}`)
      // console.log(`regex: ${re}`)
      newURL = newProd ? curURL.href.replace(re, `/${newProd}`) : curURL.href.replace(re, '')
    } else {
      // console.log('no selectionFromPath')
      newURL = curURL.href.split('#')[0].concat(newProd).concat(curURL.hash)
    }

    // console.log(newURL)

    if (newURL) {
      // console.log('replacing url with ' + newURL)
      document.location.replace(newURL)
    }
  })

  if (versionSelector) {
    versionSelector.addEventListener('change', function (e) {
      const current = e.target.dataset.current
      const next = e.target.selectedOptions[0].dataset.version
      const re = new RegExp(`/${current}/`)
      const newUrl = document.URL.replace(re, `/${next}/`)
      if (window.ga) {
        window.ga('send', 'event', 'version-select', 'From: ' + current + ';To:' + next + ';')
      }
      document.location.replace(newUrl)
    })
  }

  setVisibility(hiddenOptionNames, prodSelector.dataset.current === 'all')

  const matchTo = parseFloat(document.querySelector('.nav-container .selectors').getBoundingClientRect().height)
  const firstSection = document.querySelector('article h2')
  firstSection.style.height = `${matchTo}px`
  firstSection.style.margin = 0
  firstSection.style.lineHeight = `${matchTo}px`

  document.querySelectorAll('article h2').forEach((el) => {
    el.style.height = `${matchTo}px`
    el.style.margin = 0
    el.style.lineHeight = `${matchTo}px`
  })
})

function setVisibility (hiddenOptionNames, showLabels = false) {
  // reset everything
  clearClasses(['hidden', 'hide-this', 'selectors-match'])
  // clearClass('hide-this')
  // clearClass('selectors-match')
  selectorMatch(hiddenOptionNames)
  hideTocEntries()
  toggleLabels(showLabels)
  document.querySelector('body.cheat-sheet').style.opacity = '1'
}

function clearClasses (cl) {
  cl.forEach((c) => {
    document.querySelectorAll(`.toc-menu .${c}, .content .sect1.${c}, .content .sect2.${c}, .content .exampleblock.${c}`).forEach((el) => {
      el.classList.remove(c)
    })
  })
}

function selectorMatch (hiddenOptionNames) {
  // what is currently selected?
  const selections = document.querySelectorAll('.cs-selector option:checked')
  const selectedValues = [...selections].filter(function (s) {
    return s.value
  }).map((s) => ({
    value: s.value,
    type: s.dataset.labelType,
  })
  )

  // hide headers and example sections that don't have labels for all the current selections
  document.querySelectorAll('div.sect2:not(.cs-all), div.exampleblock:not(.cs-all)').forEach((el) => {
    const classes = removeDefaultClasses([...el.classList])
    // console.log(`classes on element: ${classes}`)
    // assume all eamples are visible0
    let display = true

    selectedValues.forEach((s) => {
      // get all the values for this type
      const these = [...new Set(optionMap.filter(function (f) {
        return f.labelType === s.type && f.value !== 'all' && f.inScope
      }).map((obj) => obj.value))]

      // get out of scope values for this type
      const notInScope = [...new Set(optionMap.filter(function (f) {
        return f.labelType === s.type && f.value !== 'all' && !f.inScope
      }).map((obj) => obj.value))]

      // what make us want to hide an example?
      // 1. if it has a class for one or more of this type, but not the selected one, and all isn't selected for this type
      if (these.some((v) => classes.includes(v)) && (!classes.includes(s.value) && s.value !== 'all')) {
        // console.log(`el will be hidden based on classes (${classes}) versus current type ${s.type} (${these}), and current selection (${s.value})`)
        display = false
      }

      // 2. If it has no classes of this type, and some that all out of scope
      if (!these.some((v) => classes.includes(v)) && notInScope.some((v) => classes.includes(v))) {
        // console.log(`el will be hidden based on classes (${classes}) versus current type ${s.type} (${these}), and current selection (${s.value})`)
        display = false
      }
    })

    if (display) {
      el.classList.add('selectors-match')
    } else {
      el.classList.add('hidden')
      el.classList.remove('selectors-match')
    }

    if (hiddenOptionNames.some((v) => classes.includes(v))) {
      el.classList.add('label-match')
    } else {
      el.classList.remove('label-match')
    }
  })

  document.querySelectorAll('.selectors-match .sect2:not(.hidden), .selectors-match .exampleblock:not(.hidden)').forEach((ch) => {
    ch.classList.add('selectors-match')
  })

  document.querySelectorAll('.label-match .sect2, .label-match .exampleblock').forEach((ch) => {
    ch.classList.add('label-match')
  })

  document.querySelectorAll('div.exampleblock.selectors-match').forEach((el) => {
    el.closest('.sect2').classList.add('selectors-match')
  })

  document.querySelectorAll('div.sect2.selectors-match').forEach((el) => {
    el.closest('.sect1').classList.add('selectors-match')
  })

  // hide headers and example sections that don't have labels for all the current selections
  document.querySelectorAll('div.exampleblock:not(.selectors-match), div.sect2:not(.selectors-match), div.sect1:not(.selectors-match)').forEach((el) => {
    if (!el.classList.contains('label-match')) {
      el.classList.add('hidden')
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
  const productSelector = document.getElementById('cheat-sheet-selector-products')
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

function updateMetaFromProduct (product, curURL) {
  const ogDesc = document.querySelector('meta[property="og:description"]')
  const ogTitle = document.querySelector('meta[property="og:title"]')
  const ogUrl = document.querySelector('meta[property="og:url"]')

  const text = getProductFromOptionMap(product)
  const ogDescFromProduct = 'Cypher Cheat Sheet - ' + text

  ogUrl.setAttribute('content', curURL)
  ogDesc.setAttribute('content', ogDescFromProduct)
  ogTitle.setAttribute('content', ogDescFromProduct)
  document.title = ogDescFromProduct
}

const stripTrailingSlash = (str) => {
  return str.endsWith('/') ? str.slice(0, -1) : str
}

function fixURL () {
  const url = window.location
  let href = url.href
  // eg /docs/cypher-cheat-sheet/current/where
  // or /docs/cypher-cheat-sheet/5/auradb-free/
  // or /docs/cypher-cheat-sheet/5/auradb-free/where
  // or (special case) /docs/cypher-cheat-sheet/5/all

  // console.log(`checking url ${href} for product name`)

  const pathArr = stripTrailingSlash(url.pathname).split('/')
  if (pathArr[0] === '') pathArr.shift()
  const values = pathArr.slice(pathArr.indexOf('cypher-cheat-sheet'))
  values.shift()
  // there should be three elements to the path from here: version, product, [section]
  values.length = 3

  // the first item in values should be a version number
  // let version = values[0]
  // the second item in values should be the product
  let product = values[1]

  // console.log(`product is ${product}`)
  // the third is a page that can be turned into a section id
  let possibleID = values[2]
  let id = ''

  // just return if there's no product for some reason
  // todo: force a product
  if (!product) return

  if (possibleID) {
    id = checkHashVariations(possibleID)
    // console.log(id)
  }

  // update window.location.href
  if (!Object.keys(prodMatrix).includes(product)) {
    const reProd = new RegExp(`/${product}/?`)
    href = href.replace(reProd, `/${defaultProd}/`)
    // maybe this was actually the page, which could be converted to a section id
    possibleID = product
    product = defaultProd
    id = checkHashVariations(possibleID)
    if (id) {
      window.location.hash = '#' + id
      href = href + '#' + id
    }
  }

  // update window.location.hash
  if (id && Object.keys(prodMatrix).includes(product)) {
    window.location.hash = '#' + id
    const reHash = new RegExp(`/${possibleID}/?`)
    href = stripTrailingSlash(href).replace(reHash, `/#${id}`)
  }

  if (href !== url.href) {
    window.location.replace(href)
  }

  if (product === 'all') {
    return product
  }

  return prodMatrix[product]
}

function checkHashVariations (id) {
  const dashes = /-/g
  const idVariants = [
    id,
    '_' + id.replace(dashes, '_'),
  ]

  const actualID = idVariants.filter(function (i) {
    return document.getElementById(i)
  })

  if (actualID) return actualID[0]
}

function removeDefaultClasses (c) {
  // remove defaultClasses to get an array of classes that could be labels
  return c.filter(function (obj) {
    return defaultClasses.indexOf(obj) === -1
  }).sort()
}

function toggleLabels (l) {
  document.querySelectorAll('span.group--products').forEach((div) => {
    if (l) {
      div.style.display = 'flex'
    } else {
      div.style.display = 'none'
    }
  })
}

function getProductFromOptionMap (prod) {
  const name = optionMap.find((opt) => opt.value === prod).text
  return name
}
