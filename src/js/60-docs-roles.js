import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  const roleDivs = document.querySelectorAll('body.docs div[class^="sect"]:not(.sectionbody)')
  roleDivs.forEach(function (roleDiv) {
    var roles = roleDiv.classList
    roles = [...roles].filter(function (c) {
      return (!c.startsWith('sect'))
    })
    if (roles) {
      var insert = createElement('div', 'page-roles')
      roles.forEach(function (role) {
        insert.append(createElement('span', 'page-role ' + role))
      })
      roleDiv.firstElementChild.after(insert)
      roleDiv.classList.add('show-roles')
    }
  })
})
