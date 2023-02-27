;(function () {
  'use strict'

  var body = document.querySelector('body')
  var glossary = document.querySelector('div.glossary')
  if (!glossary) return

  var createElement = function (el, className, children) {
    var output = document.createElement(el)
    output.setAttribute('class', className)

    Array.isArray(children) && children.forEach(function (child) {
      output.appendChild(child)
    })

    return output
  }

  var createTooltip = function (header, html) {
    if (!tooltip) {
      tooltip = createElement('div', 'tooltip tooltip--bottom')
      body.appendChild(tooltip)
    }

    tooltip.innerHTML = null

    if (header) {
      header = createElement('div', 'tooltip-header', [document.createTextNode(header)])

      tooltip.appendChild(header)
    }

    if (html) {
      var content = createElement('div', 'tooltip-body')
      content.innerHTML = html

      tooltip.appendChild(content)

      tooltip.style.display = 'block'
    }
    return tooltip
  }

  var closeTooltip = function () {
    if (tooltipTimeout) clearTimeout(tooltipTimeout)

    tooltipTimeout = setTimeout(function () {
      tooltip.innerHTML = null
      tooltip.style.display = 'none'
    }, 200)

    return false
  }

  var tooltipTimeout
  var tooltip = createTooltip()

  tooltip.addEventListener('mouseover', function () {
    clearTimeout(tooltipTimeout)
  })

  tooltip.addEventListener('mouseout', closeTooltip)

  Array.from(glossary.querySelectorAll('a[id]'))
    .forEach(function (element) {
      var mentions = document.querySelectorAll('a[href="#' + element.getAttribute('id') + '"]')
      var dt = element.parentElement
      var term = dt.innerText

      var description = dt.nextElementSibling.innerHTML

      Array.from(mentions)
        .forEach(function (element) {
          element.classList.add('glossary-term')

          element.addEventListener('mouseover', function (event) {
            event.stopPropagation()

            clearTimeout(tooltipTimeout)

            tooltip = createTooltip(term, description)

            var verticalSpacing = 10
            var rect = event.target.getBoundingClientRect()

            var top = rect.y + window.scrollY
            var left = rect.x
            var width = rect.width
            var tooltipWidth = tooltip.clientWidth
            var tooltipHeight = tooltip.clientHeight

            // TODO: Position above or below?
            tooltip.style.top = (top - tooltipHeight - verticalSpacing) + 'px'
            tooltip.style.left = ((left + width / 2) - (tooltipWidth / 2)) + 'px'

            const toolTop = rect.y - tooltipHeight - verticalSpacing

            if (toolTop < 0) {
              tooltip.style.top = (top + rect.height + verticalSpacing) + 'px'
              tooltip.classList.add('tooltip--top')
              tooltip.classList.remove('tooltip--bottom')
            } else {
              tooltip.classList.remove('tooltip--top')
              tooltip.classList.add('tooltip--bottom')
            }
          })

          element.addEventListener('mouseout', closeTooltip)

          element.removeAttribute('href') // prevents the fragment-jumper to pick on these links
        })
    })
})()
