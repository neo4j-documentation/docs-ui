;(function () {
  'use strict'

  var gram = require('@gram-data/gram-d3/dist/gram-d3.cjs.development')

  var forcedGraph = function (svgElement, graph) {
    var isGramNodeDatum = gram.isGramNodeDatum

    var d3 = require('d3/dist/d3')
    var shapeSize = 2000
    var strength = -500

    var color = d3.scaleOrdinal([
      // --colour-green-100: #f0fff4;
      // --colour-green-200: #c6f6d5;
      // --colour-green-300: #9ae6b4;
      // --colour-green-400: #68d391;
      // --colour-green-500: #48bb78;
      // --colour-green-600: '#38a169';
      // --colour-green-700:
      '#2f855a',
      // --colour-green-800:  '#276749',
      // --colour-green-900: #22543d;

      // --colour-teal-100: #e6fffa;
      // --colour-teal-200: #b2f5ea;
      // --colour-teal-300: #81e6d9;
      // --colour-teal-400: #4fd1c5;
      // --colour-teal-500: #38b2ac;
      // --colour-teal-600:
      '#319795',
      // --colour-teal-700: #2c7a7b;
      // /* --colour-teal-800: */ '#285e61',
      // --colour-teal-900: #234e52;

      // --colour-blue-100: #ebf8ff;
      // --colour-blue-200: #bee3f8;
      // --colour-blue-300: #90cdf4;
      // --colour-blue-400: #63b3ed;
      // --colour-blue-500: #4299e1;
      // --colour-blue-600: #3182ce;
      // --colour-blue-700: #2b6cb0;
      /* --colour-blue-800: */ '#2c5282',
      // --colour-blue-900: #2a4365;

      // --colour-indigo-100: #ebf4ff;
      // --colour-indigo-200: #c3dafe;
      // --colour-indigo-300: #a3bffa;
      // --colour-indigo-400: #7f9cf5;
      // --colour-indigo-500: #667eea;
      // --colour-indigo-600: #5a67d8;
      // --colour-indigo-700: #4c51bf;
      /* --colour-indigo-800: */ '#434190',
      // --colour-indigo-900: #3c366b;

      // --colour-purple-100: #faf5ff;
      // --colour-purple-200: #e9d8fd;
      // --colour-purple-300: #d6bcfa;
      // --colour-purple-400: #b794f4;
      // --colour-purple-500: #9f7aea;
      // --colour-purple-600: #805ad5;
      // --colour-purple-700: #6b46c1;
      /* --colour-purple-800: */ '#553c9a',
      // --colour-purple-900: #44337a;

      // --colour-red-100: #fff5f5;
      // --colour-red-200: #fed7d7;
      // --colour-red-300: #feb2b2;
      // --colour-red-400: #fc8181;
      // --colour-red-500: #f56565;
      // --colour-red-600: #e53e3e;
      // --colour-red-700: #c53030;
      /* --colour-red-800: */ '#9b2c2c',
      // --colour-red-900: #742a2a;

      // --colour-orange-100: #fffaf0;
      // --colour-orange-200: #feebc8;
      // --colour-orange-300: #fbd38d;
      // --colour-orange-400: #f6ad55;
      // --colour-orange-500: #ed8936;
      // --colour-orange-600: #dd6b20;
      // --colour-orange-700: #c05621;
      /* --colour-orange-800: */ '#9c4221',
      // --colour-orange-900: #7b341e;

      // --colour-yellow-100: #fffff0;
      // --colour-yellow-200: #fefcbf;
      // --colour-yellow-300: #faf089;
      // --colour-yellow-400: #f6e05e;
      // --colour-yellow-500: #ecc94b;
      // --colour-yellow-600: #d69e2e;
      // --colour-yellow-700: #b7791f;
      /* --colour-yellow-800: */ '#975a16',
      // --colour-yellow-900: #744210;

      // --colour-pink-100: #fff5f7;
      // --colour-pink-200: #fed7e2;
      // --colour-pink-300: #fbb6ce;
      // --colour-pink-400: #f687b3;
      // --colour-pink-500: #ed64a6;
      // --colour-pink-600: #d53f8c;
      // --colour-pink-700: #b83280;
      /* --colour-pink-800: */ '#97266d',
      // --colour-pink-900: #702459;

      // --colour-grey-100: #f7fafc;
      // --colour-grey-200: #edf2f7;
      // --colour-grey-300: #e2e8f0;
      // --colour-grey-400: #cbd5e0;
      // --colour-grey-500: #a0aec0;
      // --colour-grey-600: #718096;
      // --colour-grey-700: #4a5568;
      /* --colour-grey-800: */ '#2d3748',
      // --colour-grey-900: #1a202c;
    ])

    var colorFor = function (node) {
      var label = (node.labels !== undefined) ? node.labels[0] : 'Default'
      return color(label) || 'gray'
    }

    var svg = d3.select(svgElement)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 600 400')

    var
      width = +svg.attr('width') || svgElement.clientWidth
    var height = +svg.attr('height') || svgElement.clientHeight
    var center = { x: width / 2, y: height / 2 }

    var g = svg.append('g')
      .attr('class', 'everything')

    var simulation = d3.forceSimulation()
      .force('charge', d3.forceManyBody().strength(strength))
      .force('center', d3.forceCenter(center.x, center.y))
    // .force("size", [width, height])

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
        .attr('x1', function (d) {
          return (isGramNodeDatum(d.source) ? d.source.x : center.x)
        })
        .attr('y1', function (d) {
          return (isGramNodeDatum(d.source) ? d.source.y : center.y)
        })
        .attr('x2', function (d) {
          return (isGramNodeDatum(d.target) ? d.target.x : center.x)
        })
        .attr('y2', function (d) {
          return (isGramNodeDatum(d.target) ? d.target.y : center.y)
        })
    }
    var drawNodes = function (nodes) {
      nodes
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
    }

    var zoomHandler = d3.zoom()
      .on('zoom', function () {
        g.attr('transform', d3.event.transform)
      })

    zoomHandler(svg)

    simulation.nodes(graph.nodes)

    simulation.force('link', d3.forceLink(graph.links).id(function (d) {
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
      .attr('font-size', 8)
      .text(function (d) {
        if (d.record) {
          return d.record.caption || d.record.name || d.record.title || d.id
        }

        return d.id
      })
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
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

    /*
    function zoomFit(paddingPercent, transitionDuration) {
        var bounds = g.node().getBBox();
        var parent = g.node().parentElement;

        var fullWidth = parent.clientWidth,
            fullHeight = parent.clientHeight;
        var width = bounds.width,
            height = bounds.height;
        var midX = bounds.x + width / 2,
            midY = bounds.y + height / 2;

        if (width == 0 || height == 0) return; // nothing to fit
        var scale = (paddingPercent || 0.75) / Math.max(width / fullWidth, height / fullHeight);
        var translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        console.trace("zoomFit", translate, scale);
        // g
        //     .transition()
        //     .duration(transitionDuration || 0) // milliseconds
        //     .call(zoomHandler.translate(translate).scale(scale).event);

        var transform = d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale);

        g
            .transition()
            .duration(transitionDuration || 0) // milliseconds
            .call(zoom.transform, transform);
    }
    zoomFit(.7, 1000)
    */
  }

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

  //  Convert HTML entities
  var cleanCode = function (code) {
    var cleaner = document.createElement('textarea')
    cleaner.innerHTML = code.innerHTML

    return cleaner.value
  }

  Array.from(document.querySelectorAll('code.language-gram'))
    .forEach(function (code) {
      var graph = gram.gramParse(cleanCode(code))

      // Create SVG
      var parent = replaceWithSvg(code)

      forcedGraph(parent, graph)
    })
})()
