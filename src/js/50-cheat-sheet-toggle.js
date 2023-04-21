import { createElement } from './modules/dom'

const selectorOptions = document.querySelectorAll('[id^=cheat-sheet-selector-] option')

const optionMap = [...selectorOptions].map((o) => ({
  value: o.value,
  text: o.dataset.label,
  class: o.dataset.class,
  labelType: o.dataset.labelType,
  labelOnly: o.hidden,
  selected: o.selected,
  inScope: true,
}))

// TODO construct prodMatrix from optionMap?
const prodMatrix = {
  'auradb-free': 'aura-dbf',
  'auradb-professional': 'aura-dbp',
  'auradb-enterprise': 'aura-dbe',
  'aurads-professional': 'aura-dsp',
  'aurads-enterprise': 'aura-dse',
  'neo4j-community': 'neo4j-ce',
  'neo4j-enterprise': 'neo4j-ee',
}

const defaultClasses = ['exampleblock', 'sect2', 'sect1']

document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('body.cheat-sheet')) return

  const curURL = document.location
  const selectionFromPath = getSelectionFromPath(curURL)

  if (selectionFromPath) {
    updateSelectorFromProduct(selectionFromPath)
    updateMetaFromProduct(selectionFromPath, curURL)
  }

  // check for a checkbox to display or hide labels
  const labelShow = document.querySelector('#products-highlight')
  if (labelShow) {
    labelShow.addEventListener('click', function (c) {
      c.stopPropagation()
      toggleLabels(c)
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
    const labelsToAdd = optionNames.filter(function (obj) {
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

    if (labelsToAdd && labelsToAdd.length > 0) {
      labelsToAdd.forEach((label) => {
        addLabel(el, label)
      })
    }
  })

  // if we've removed elements we need to clean the toc by removing entries for those elements
  cleanToc()

  function addLabel (el, match) {
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

    const text = getProductFromOptionMap(match)

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

  prodSelector.addEventListener('change', function (e) {
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
      setVisibility(hiddenOptionNames)
    }
  })

  var versionSelector = document.querySelector('body.cheat-sheet .version-selector')
  if (versionSelector) {
    versionSelector.addEventListener('change', function (e) {
      const target = e.target

      const selectedProduct = prodSelector.selectedIndex
      const current = target.dataset.current
      const next = target.selectedOptions[0].dataset.version
      let newUrl
      if (selectionFromPath) {
        const re = new RegExp(`/${current}/`)
        newUrl = document.URL.replace(re, `/${next}/`)
      } else {
        newUrl = `${target.value}?product=${prodSelector.options[selectedProduct].value}`
      }

      if (window.ga) {
        window.ga('send', 'event', 'version-select', 'From: ' + current + ';To:' + next + ';')
      }

      document.location.replace(newUrl)
    })
  }

  setVisibility(hiddenOptionNames)

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

function setVisibility (hiddenOptionNames) {
  // reset everything
  clearClass('hidden')
  clearClass('hide-this')
  clearClass('selectors-match')
  selectorMatch(hiddenOptionNames)
  hideTocEntries()
  document.querySelector('body.cheat-sheet').style.opacity = '1'
}

function clearClass (cl) {
  document.querySelectorAll(`.toc-menu .${cl}, .content .sect1.${cl}, .content .sect2.${cl}, .content .exampleblock.${cl}`).forEach((el) => {
    el.classList.remove(cl)
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

function removeDefaultClasses (c) {
  // remove defaultClasses to get an array of classes that could be labels
  return c.filter(function (obj) {
    return defaultClasses.indexOf(obj) === -1
  }).sort()
}

function toggleLabels (l) {
  document.querySelectorAll('span.group--products').forEach((div) => {
    if (l.target.checked) {
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
