document.addEventListener('DOMContentLoaded', function () {
  var makeClickable = function (card) {
    var links = card.querySelectorAll('div.link')
    links.forEach(function (link) {
      var target = link.querySelector('a').getAttribute('href')
      var card = link.parentElement
      card.addEventListener('click', function (e) {
        e.preventDefault()
        window.location.href = target
      })
    })
  }
  // Add links to cards
  document.querySelectorAll('.cards.selectable')
    .forEach(makeClickable)
})
