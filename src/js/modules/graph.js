// import { isGramNodeDatum } from '@gram-data/gram-d3'
import * as d3 from 'd3'

// var customColors = {
//   Movie: () => 'red',
// }
var customCaptions = {
  Movie: (n) => n.properties.title,
  Person: (n) => n.properties.name,
}

var color = d3.scaleOrdinal([
  // --color-green-100: #f0fff4;
  // --color-green-200: #c6f6d5;
  // --color-green-300: #9ae6b4;
  // --color-green-400: #68d391;
  // --color-green-500: #48bb78;
  // --color-green-600: '#38a169';
  // --color-green-700:
  '#2f855a',
  // --color-green-800:  '#276749',
  // --color-green-900: #22543d;

  // --color-teal-100: #e6fffa;
  // --color-teal-200: #b2f5ea;
  // --color-teal-300: #81e6d9;
  // --color-teal-400: #4fd1c5;
  // --color-teal-500: #38b2ac;
  // --color-teal-600:
  '#319795',
  // --color-teal-700: #2c7a7b;
  // /* --color-teal-800: */ '#285e61',
  // --color-teal-900: #234e52;

  // --color-blue-100: #ebf8ff;
  // --color-blue-200: #bee3f8;
  // --color-blue-300: #90cdf4;
  // --color-blue-400: #63b3ed;
  // --color-blue-500: #4299e1;
  // --color-blue-600: #3182ce;
  // --color-blue-700: #2b6cb0;
  /* --color-blue-800: */ '#2c5282',
  // --color-blue-900: #2a4365;

  // --color-indigo-100: #ebf4ff;
  // --color-indigo-200: #c3dafe;
  // --color-indigo-300: #a3bffa;
  // --color-indigo-400: #7f9cf5;
  // --color-indigo-500: #667eea;
  // --color-indigo-600: #5a67d8;
  // --color-indigo-700: #4c51bf;
  /* --color-indigo-800: */ '#434190',
  // --color-indigo-900: #3c366b;

  // --color-purple-100: #faf5ff;
  // --color-purple-200: #e9d8fd;
  // --color-purple-300: #d6bcfa;
  // --color-purple-400: #b794f4;
  // --color-purple-500: #9f7aea;
  // --color-purple-600: #805ad5;
  // --color-purple-700: #6b46c1;
  /* --color-purple-800: */ '#553c9a',
  // --color-purple-900: #44337a;

  // --color-red-100: #fff5f5;
  // --color-red-200: #fed7d7;
  // --color-red-300: #feb2b2;
  // --color-red-400: #fc8181;
  // --color-red-500: #f56565;
  // --color-red-600: #e53e3e;
  // --color-red-700: #c53030;
  /* --color-red-800: */ '#9b2c2c',
  // --color-red-900: #742a2a;

  // --color-orange-100: #fffaf0;
  // --color-orange-200: #feebc8;
  // --color-orange-300: #fbd38d;
  // --color-orange-400: #f6ad55;
  // --color-orange-500: #ed8936;
  // --color-orange-600: #dd6b20;
  // --color-orange-700: #c05621;
  /* --color-orange-800: */ '#9c4221',
  // --color-orange-900: #7b341e;

  // --color-yellow-100: #fffff0;
  // --color-yellow-200: #fefcbf;
  // --color-yellow-300: #faf089;
  // --color-yellow-400: #f6e05e;
  // --color-yellow-500: #ecc94b;
  // --color-yellow-600: #d69e2e;
  // --color-yellow-700: #b7791f;
  /* --color-yellow-800: */ '#975a16',
  // --color-yellow-900: #744210;

  // --color-pink-100: #fff5f7;
  // --color-pink-200: #fed7e2;
  // --color-pink-300: #fbb6ce;
  // --color-pink-400: #f687b3;
  // --color-pink-500: #ed64a6;
  // --color-pink-600: #d53f8c;
  // --color-pink-700: #b83280;
  /* --color-pink-800: */ '#97266d',
  // --color-pink-900: #702459;

  // --color-grey-100: #f7fafc;
  // --color-grey-200: #edf2f7;
  // --color-grey-300: #e2e8f0;
  // --color-grey-400: #cbd5e0;
  // --color-grey-500: #a0aec0;
  // --color-grey-600: #718096;
  // --color-grey-700: #4a5568;
  /* --color-grey-800: */ '#2d3748',
  // --color-grey-900: #1a202c;
])

var colorFor = function (node) {
  var label = (node.labels !== undefined) ? node.labels[0] : 'Default'
  return color(label) || 'gray'
}

var captionFor = function (d) {
  // if it has an explicit name, use it!
  if (d.name) {
    return d.name
  }
  for (let i = 0; i < d.labels.length; i++) {
    if (customCaptions[d.labels[i]]) return customCaptions[d.labels[i]](d)
  }
  return d.id
}

export function forcedGraph (svgElement, graph) {
  var shapeSize = 2000
  var strength = -200
  var linkStrength = 0.2
  var linkDistance = 90

  var svg = d3.select(svgElement)
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', '0 0 600 400')

  var width = +svg.attr('width') || svgElement.clientWidth
  var height = +svg.attr('height') || svgElement.clientHeight
  var center = { x: width / 2, y: height / 2 }

  var g = svg.append('g')
    .attr('class', 'everything')

  var simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(strength))
    .force('center', d3.forceCenter(center.x, center.y))

  var drag = function (simulation) {
    function dragstarted (d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart()

      d.fx = d.x
      d.fy = d.y
    }

    function dragged (d) {
      d.fx = d3.event.x
      d.fy = d3.event.y
    }

    function dragended (d) {
      if (!d3.event.active) simulation.alphaTarget(0).restart()
      d.fx = null
      d.fy = null
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
  }

  var drawLinks = function (links) {
    links
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y)
  }
  var drawNodes = function (nodes) {
    nodes
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
  }

  var zoomHandler = d3.zoom()
    .on('zoom', function () {
      //console.trace('zoom', d3.event.transform)
      g.attr('transform', d3.event.transform)
    })

  zoomHandler(svg)

  simulation.nodes(graph.nodes)

  simulation.force('link', d3.forceLink(graph.links).distance(linkDistance).strength(linkStrength).id(function (d) {
    return d.id
  }))

  var link = g.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(graph.links)
    .join('line')
    .attr('stroke-width', 2)

  var node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(graph.nodes)
    .enter().append('g')
    .call(drag(simulation))

  node.append('path')
    .attr('fill', colorFor)
    .attr('stroke', function (d) {
      return (d3.color(colorFor(d)) || d3.rgb(0x33, 0x33, 0x33)).darker().hex()
    })
    .attr('stroke-width', 2)
    .attr('d', function () {
      return d3.symbol().type(d3.symbolCircle).size(shapeSize)()
    })

  node.append('text')
    //   .attr('stroke', 'white')
    //   .attr('stroke-width', '1')
    //   .attr('stroke-linecap', 'butt')
    //   .attr('stroke-linejoin', 'miter')
    //   .attr('stroke-opacity', '0.6')
    .attr('font-size', 10)
    .text(captionFor)
    .attr('text-anchor', 'middle')
    .attr('fill', 'black')
    .attr('x', 0)
    .attr('y', 4)
    .attr('pointer-events', 'none')

  node.append('title')
    .text(function (d) {
      return d.id
    })

  simulation.on('tick', function () {
    drawLinks(link)
    drawNodes(node)
  })

  function zoomFit (paddingPercent, transitionDuration) {
    var bounds = svg.node().getBBox()
    var parent = svg.node().parentElement

    var fullWidth = parent.clientWidth
    var fullHeight = parent.clientHeight
    var width = bounds.width
    var height = bounds.height
    var midX = bounds.x + width / 2
    var midY = bounds.y + height / 2
    if (width === 0 || height === 0) return // nothing to fit
    var scale = (paddingPercent || 0.75) / Math.max(width / fullWidth, height / fullHeight)
    var translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY]
    console.trace('zoomFit', translate, scale)

    svg
      .transition()
      .duration(transitionDuration || 0) // milliseconds
      .call(zoomHandler.translateTo, translate[0], translate[1])
  }

  zoomFit(0.7, 1000)
}

export function replaceWithSvg (code) {
  var pre = code.parentElement
  var parent = pre.parentElement

  var container = document.createElement('div')
  container.setAttribute('class', 'gram')

  parent.insertBefore(container, pre)

  // Create SVG
  var replaceSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  // replaceSvg.setAttribute('width', container.clientWidth)
  // replaceSvg.setAttribute('height', container.clientHeight)

  // Append to container
  container.appendChild(replaceSvg)

  // Add to parent element and remove <pre>
  parent.insertBefore(container, pre)
  parent.removeChild(pre)

  return replaceSvg
}
