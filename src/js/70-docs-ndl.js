import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  var moveElements = function (oldParent, newParent) {
    while (oldParent.childNodes.length > 0) {
      newParent.appendChild(oldParent.childNodes[0])
    }
  }

  var makeClickable = function (cards) {
    var links
    if (cards.classList.contains('selectable')) {
      links = cards.querySelectorAll('div.sect2:not(.not-selectable) div.link')
    } else {
      links = cards.querySelectorAll('div.sect2.selectable div.link')
    }

    links.forEach(function (link) {
      var target = link.querySelector('a').getAttribute('href')
      var card = link.parentElement
      card.classList.add('selectable')
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

  var moveLabels = function (section) {
    var cards = section.querySelectorAll('div.sect2')
    cards.forEach(function (card) {
      // do we have any labels to move?
      var labels = card.querySelector('div.labels')
      if (labels) {
        var icon = card.querySelector('div.icon p')
        icon.append(labels)
      }
    })
  }

  // Remove <a> anchor tags from h3 elements on selectable cards in docs-ndl pages
  // the card is already wrapped in an anchor tag so we don't need an anchor inside the h3
  // and it introduces an unwanted ::after pseudo-element
  document.querySelectorAll('body.docs-ndl h3 a').forEach(function (a) {
    a.remove()
  })

  // Add links to cards
  document.querySelectorAll('.cards')
    .forEach(makeClickable)

  // Move labels to the icon div to position them
  // in the top-right corner of the card
  document.querySelectorAll('.cards')
    .forEach(moveLabels)
})
