// TODO: This isn't working at the moment?
import * as gram from '@gram-data/gram-d3'
import { forcedGraph } from '../modules/graph'
import { cleanCode } from '../modules/code'

;(function () {
  'use strict'

  var replaceWithSvg = function (code) {
    var pre = code.parentElement
    var parent = pre.parentElement

    var container = document.createElement('div')
    container.setAttribute('class', 'gram')

    parent.insertBefore(container, pre)

    // Create SVG
    var replaceSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    replaceSvg.setAttribute('width', container.clientWidth)
    replaceSvg.setAttribute('height', container.clientHeight)

    // Append to container
    container.appendChild(replaceSvg)

    // Add to parent element and remove <pre>
    parent.insertBefore(container, pre)
    parent.removeChild(pre)

    return replaceSvg
  }

  Array.from(document.querySelectorAll('code.language-gram'))
    .forEach(function (code) {
      var graph = gram.gramParse(cleanCode(code))

      // Create SVG
      var parent = replaceWithSvg(code)

      forcedGraph(parent, graph)
    })
})()
