import { createElement } from './modules/dom'
import rolesData from './data/rolesData.json'

function checkWrapped () {
  const labelContainers = document.querySelectorAll('body.docs-remix .header-label-container')
  for (const container of labelContainers) {
    var child = container.querySelector('.labels')
    var lineHeight = parseInt(window.getComputedStyle(container).lineHeight, 10)
    if (child.offsetTop - container.offsetTop >= lineHeight) {
      child.classList.add('wrapped')
    } else {
      child.classList.remove('wrapped')
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const contentDataset = document.querySelector('article.doc').dataset

  var camelCased = function (str) {
    return str.split(/-|\./)
      .map((text) => text.substr(0, 1).toUpperCase() + text.substr(1))
      .join('')
  }

  var getLabelDetails = function (role) {
    var label = role.replace('label--', '')
    var labelParts = label.split('-')

    // roles can be single word ie beta - use beta as label class and text from rolesDatee.beta
    // roles can be single word + version ie new-5.20 - use new as label class and text from rolesData.new + version number
    // roles can be multiple words ie aura-db-dedicated - use aura-db-dedicated as label class and text from rolesData.aura-db-dedicated
    // roles like deprecated can appear with or without a version number - deprecated-5.20 or deprecated
    // - use deprecated as label class and text from rolesData.deprecated
    // - use deprecated as label class and text from rolesData.deprecated + version number

    // so if the role is a single word, we use the role as is - ie deprecated
    // if it is longer we test to see if it is a 'versionable' roke - ie deprecated-5.20
    // if it is a versionable role, and a version is specified, we remove the version and use the remaining text as the label class
    // if (labelParts.length > 1) {
    //   label = (rolesData[label] && rolesData[label].labelCategory !== 'version') ? label : labelParts.slice(0, -1).join('-')
    // }

    let dataLabel, dataProduct, dataVersion
    const dataExtras = []

    // what about roles like new-bolt-5.20 if we want to use a product name in the label?
    while (!dataLabel && labelParts.length > 0) {
      const labelCandidate = labelParts.join('-')
      if (rolesData[labelCandidate]) {
        dataLabel = labelCandidate
      } else {
        dataExtras.push(labelParts.pop())
      }
    }

    // ignore labels that are not defined in rolesData
    if (!dataLabel) {
      return
    }

    if (dataExtras.length > 0) {
      dataVersion = dataExtras.shift()
    }

    if (dataExtras.length > 0) {
      dataProduct = camelCased(dataExtras.join(' '))
    }

    var labelDetails = {
      class: dataLabel,
      role: dataLabel,
      text: rolesData[dataLabel].displayText || '',
      joinText: dataVersion ? rolesData[dataLabel].joinText || 'in' : '',
      data: {
        product: dataVersion ? dataProduct || rolesData[dataLabel].product || contentDataset.product || '' : '',
        version: dataVersion || '',
        function: rolesData[dataLabel].function || '',
        event: rolesData[dataLabel].labelCategory === 'version' ? dataLabel : '',
      },
    }

    // update label text for versioned labels
    if ((rolesData[dataLabel].labelCategory === 'version' || (rolesData[dataLabel].joinText && dataVersion))) {
      labelDetails.text = [labelDetails.text, labelDetails.joinText, labelDetails.data.product, labelDetails.data.version].join(' ')
    }

    return labelDetails
  }

  // convert all label-- roles everywhere to a label
  // display a label right-aligned to headings and table captions
  // wrap to the left on headings when not enough space for labels
  // display a label left-aligned to everything else
  // ignore inline labels

  const headings = ['H2', 'H3', 'H4', 'H5', 'H6', 'CAPTION']
  const roleDivs = document.querySelectorAll('body.docs-remix *[class*="label--"]')

  roleDivs.forEach(function (roleDiv) {
    var roles = roleDiv.classList

    // ignore:
    // - spans because they're inline and we only care about labels on block elements DIV or TABLE
    // - discrete headers
    if (roleDiv.nodeName === 'SPAN' || [...roles].includes('discrete')) return

    roles = [...roles].sort().filter(function (c) {
      return (c.startsWith('label--'))
    })

    if (roles.length === 0) return

    const labels = []

    roles.forEach(function (role) {
      const labelDetails = getLabelDetails(role)

      // remove the role from the parent div
      roleDiv.classList.remove(role)

      if (typeof labelDetails === 'undefined') {
        return
      }

      // create a span element for the label
      const labelSpan = createElement('span', `label content-label label--${labelDetails.class}`)

      // add dataset to the label
      for (var d in labelDetails.data) {
        if (labelDetails.data[d] !== '') labelSpan.dataset[d] = labelDetails.data[d]
      }

      labelSpan.appendChild(document.createTextNode(labelDetails.text))

      labels.push(labelSpan)
    })

    // we only generate labels from defined roles
    // no need to do anything if we found only undefined roles
    if (labels.length === 0) return

    // let labelsLocation = (roleDiv.firstElementChild && headings.includes(roleDiv.firstElementChild.nodeName)) ? roleDiv.firstElementChild : roleDiv
    const labelsDiv = createElement('div', 'labels')

    for (const label of labels) {
      if (roleDiv.nodeName === 'H1' || headings.includes(roleDiv.firstElementChild.nodeName)) {
        label.classList.add('header-label')
      }
      labelsDiv.append(label)

      for (var d in label.dataset) {
        roleDiv.dataset[d] = label.dataset[d]
      }
    }

    console.log(roleDiv.classList)

    // if (roleDiv.classList.contains('admonitionblock')) {
    //   labelsLocation = roleDiv.querySelector('td.content')
    // }

    if (roleDiv.nodeName === 'H1' || headings.includes(roleDiv.firstElementChild.nodeName)) {
      // labelsLocation.append(labelsDiv)
      // labelsLocation.classList.add('header-label-container')
    } else {
      // labelsLocation.prepend(labelsDiv)
      roleDiv.classList.add('has-label')
    }
  })

  // check whether div containing header labels has wrapped onto new line
  // if it has wrapped, we left-align the div
  checkWrapped()
})

// when the window is resized, check whether labels have wrapped or unwrapped
window.addEventListener('resize', function () {
  checkWrapped()
})
