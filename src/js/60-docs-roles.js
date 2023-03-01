import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  const sectionDivs = document.querySelectorAll('body.docs div[class^="sect"]:not(.sectionbody,.sect-header)')
  sectionDivs.forEach(function (sectionDiv) {
    var roles = sectionDiv.classList
    roles = [...roles].sort().filter(function (c) {
      return (!c.startsWith('sect'))
    })

    var newRolesDiv = createElement('div', 'sect-header')
    var head = sectionDiv.querySelector('h2,h3,h4,h5,h6')
    // console.log(head.tagName)
    newRolesDiv.append(head)

    if (roles.length > 0) {
      var insert = createElement('div', 'roles')
      roles.forEach(function (role) {
        insert.append(createElement('span', `role ${role}`))

        // const span = createElement('span', `label label--${role}`)

        // // let span = createElement('span', `role ${role}`)
        // // console.log(span.outerHTML)

        // let elem = document.querySelector(`span.${role}`)

        // // let elem = getComputedStyle(span, ':after').content;
        // span.textContent = getComputedStyle(elem, ':after').getPropertyValue('content').replace(/"/g, '')
        // console.log(span.textContent)
        // insert.append(span)
      })
      newRolesDiv.append(insert)
    }
    sectionDiv.prepend(newRolesDiv)
    sectionDiv.classList.add('show-roles')
  })
})
