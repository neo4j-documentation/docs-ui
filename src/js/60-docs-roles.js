import { createElement } from './modules/dom'
import rolesData from './data/rolesData.json'

function checkWrapped () {
  const labelContainers = document.querySelectorAll('body.docs:not(.docs-ndl) .header-label-container')
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
  var camelCased = function (str) {
    return str.split(/-|\./)
      .map((text) => text.substr(0, 1).toUpperCase() + text.substr(1))
      .join('')
  }

  var getLabelDetails = function (role) {
    var label = role.replace('label--', '')
    var labelParts = label.split('-')

    // label could be eg label--new-5.19 but in rolesData it's just new
    label = rolesData[labelParts[0]] ? labelParts[0] : label

    if (!rolesData[label]) {
      return
    }

    var labelDetails = {
      class: label,
      role: label,
      text: rolesData[label].displayText || '',
      data: {
        labelCategory: rolesData[label].labelCategory || '',
        product: rolesData[label].product || '',
        function: rolesData[label].function || '',
      },
    }

    // get version number for version labels
    if ((rolesData[label].labelCategory === 'version' || rolesData[label].versionText) && labelParts[1]) {
      labelDetails.data.version = labelParts[1]
      const joinText = rolesData[label].versionText ? rolesData[label].versionText : 'in'
      labelDetails.text = [labelDetails.text, joinText, labelDetails.data.version].join(' ')
    }

    return labelDetails
  }

  // convert all label-- roles everywhere to a label
  // display a label right-aligned to headings and table captions
  // wrap to the left on headings when not enough space for labels
  // display a label left-aligned to everything else
  // ignore inline labels

  const headings = ['H2', 'H3', 'H4', 'H5', 'H6', 'CAPTION']
  const roleDivs = document.querySelectorAll('body.docs:not(.docs-ndl) *[class*="label--"]')

  roleDivs.forEach(function (roleDiv) {
    // ignore spans because they're inline
    // we only care about labels on block elements
    // DIV or TABLE
    if (roleDiv.nodeName === 'SPAN') return

    var roles = roleDiv.classList
    roles = [...roles].sort().filter(function (c) {
      return (c.startsWith('label--'))
    })

    if (roles.length === 0) return

    const labels = []

    roles.forEach(function (role) {
      const labelDetails = getLabelDetails(role)
      if (typeof labelDetails === 'undefined') {
        return
      }

      // create a span element for the label
      const labelSpan = createElement('span', `label content-label label--${labelDetails.class}`)

      // add dataset to the label
      if (labelDetails.data.version) labelSpan.dataset.version = labelDetails.data.version
      if (labelDetails.data.product !== '') labelSpan.dataset.product = labelDetails.data.product
      if (labelDetails.data.function !== '') labelSpan.dataset.function = labelDetails.data.function

      labelSpan.appendChild(document.createTextNode(labelDetails.text))

      // remove the role from the parent div
      roleDiv.classList.remove(role)

      labels.push(labelSpan)
    })

    // we only generate labels from defined roles
    // no need to do anything if we found only undefined roles
    if (labels.length === 0) return

    const labelsLocation = (roleDiv.firstElementChild && headings.includes(roleDiv.firstElementChild.nodeName)) ? roleDiv.firstElementChild : roleDiv
    const labelsDiv = createElement('div', 'labels')

    for (const label of labels) {
      if (roleDiv.nodeName === 'H1' || headings.includes(roleDiv.firstElementChild.nodeName)) {
        label.classList.add('header-label')
      }
      labelsDiv.append(label)
      const contentLabel = Array.from(label.classList).find((c) => c.startsWith('label--')).replace('label--', '')
      roleDiv.dataset[camelCased(contentLabel)] = contentLabel
    }

    if (roleDiv.nodeName === 'H1' || headings.includes(roleDiv.firstElementChild.nodeName)) {
      labelsLocation.append(labelsDiv)
      labelsLocation.classList.add('header-label-container')
    } else {
      labelsLocation.prepend(labelsDiv)
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
