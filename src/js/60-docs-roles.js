import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  const sectionDivs = document.querySelectorAll('body.docs div[class^="sect"]:not(.sectionbody,.sect-header)')
  sectionDivs.forEach(function (sectionDiv) {
    var roles = sectionDiv.classList
    roles = [...roles].sort().filter(function (c) {
      return (!c.startsWith('sect'))
    })

    if (roles.length === 0) return

    var newRolesDiv = createElement('div', 'sect-header')
    var head = sectionDiv.querySelector('h2,h3,h4,h5,h6')

    if (roles.length > 0) {
      newRolesDiv.append(head)
      var insert = createElement('div', 'roles')
      roles.forEach(function (role) {
        insert.append(createElement('span', `role ${role}`))
      })
      newRolesDiv.append(insert)
      sectionDiv.prepend(newRolesDiv)
      sectionDiv.classList.add('show-roles')
    }
  })
})
