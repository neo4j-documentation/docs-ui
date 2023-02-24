import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  const roleDivs = document.querySelectorAll('div.show-roles')

  roleDivs.forEach(function (roleDiv) {
    console.log(roleDiv.classList)
    var roles = roleDiv.classList
    var insert = createElement('div', 'page-roles')
    roles.forEach(function (role) {
      if (role === 'show-roles' || role.startsWith('sect')) return
      insert.append(createElement('span', 'page-role ' + role))
    })
    console.log(roleDiv.firstElementChild)
    roleDiv.firstElementChild.after(insert)
    console.log(insert.innerHTML)
  })
})
