import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  var moveElements = function (oldParent, newParent) {
    while (oldParent.childNodes.length > 0) {
      newParent.appendChild(oldParent.childNodes[0])
    }
  }

  var makeClickable = function (card) {
    var links = card.querySelectorAll('div.link')
    links.forEach(function (link) {
      var target = link.querySelector('a').getAttribute('href')
      var card = link.parentElement
      const cardLink = createElement('a', 'link')
      cardLink.setAttribute('href', target)
      moveElements(card, cardLink)
      card.appendChild(cardLink)
      card.addEventListener('click', function (e) {
        e.preventDefault()
        window.location.href = target
      })
    })
  }

  // Remove H3 anchors
  document.querySelectorAll('h3 a').forEach(function (a) {
    a.remove()
  })

  // Add links to cards
  document.querySelectorAll('.cards.selectable')
    .forEach(makeClickable)
})
