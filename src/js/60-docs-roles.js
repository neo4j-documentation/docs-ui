import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  const roleDivs = document.querySelectorAll('body.docs div.show-roles')
  roleDivs.forEach(function (roleDiv) {
    var roles = roleDiv.classList
    var insert = createElement('div', 'page-roles')
    roles.forEach(function (role) {
      if (role === 'show-roles' || role.startsWith('sect')) return
      insert.append(createElement('span', 'page-role ' + role))
    })
    roleDiv.firstElementChild.after(insert)
  })
})
