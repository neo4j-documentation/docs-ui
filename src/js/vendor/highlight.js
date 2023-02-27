/* eslint-disable */
;(function () {
  'use strict'

  var hljs = require('highlight.js')
  window.hljs = hljs
  hljs.registerLanguage('asciidoc', require('highlight.js/lib/languages/asciidoc'))
  hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'))
  hljs.registerLanguage('clojure', require('highlight.js/lib/languages/clojure'))
  hljs.registerLanguage('cpp', require('highlight.js/lib/languages/cpp'))
  hljs.registerLanguage('csharp', require('highlight.js/lib/languages/csharp'))
  hljs.registerLanguage('css', require('highlight.js/lib/languages/css'))
  hljs.registerLanguage('diff', require('highlight.js/lib/languages/diff'))
  hljs.registerLanguage('dockerfile', require('highlight.js/lib/languages/dockerfile'))
  hljs.registerLanguage('elixir', require('highlight.js/lib/languages/elixir'))
  hljs.registerLanguage('go', require('highlight.js/lib/languages/go'))
  hljs.registerLanguage('groovy', require('highlight.js/lib/languages/groovy'))
  hljs.registerLanguage('haskell', require('highlight.js/lib/languages/haskell'))
  hljs.registerLanguage('java', require('highlight.js/lib/languages/java'))
  hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'))
  hljs.registerLanguage('json', require('highlight.js/lib/languages/json'))
  hljs.registerLanguage('kotlin', require('highlight.js/lib/languages/kotlin'))
  hljs.registerLanguage('makefile', require('highlight.js/lib/languages/makefile'))
  hljs.registerLanguage('markdown', require('highlight.js/lib/languages/markdown'))
  hljs.registerLanguage('nix', require('highlight.js/lib/languages/nix'))
  hljs.registerLanguage('objectivec', require('highlight.js/lib/languages/objectivec'))
  hljs.registerLanguage('perl', require('highlight.js/lib/languages/perl'))
  hljs.registerLanguage('php', require('highlight.js/lib/languages/php'))
  hljs.registerLanguage('properties', require('highlight.js/lib/languages/properties'))
  hljs.registerLanguage('python', require('highlight.js/lib/languages/python'))
  hljs.registerLanguage('ruby', require('highlight.js/lib/languages/ruby'))
  hljs.registerLanguage('scala', require('highlight.js/lib/languages/scala'))
  hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'))
  hljs.registerLanguage('sql', require('highlight.js/lib/languages/sql'))
  hljs.registerLanguage('swift', require('highlight.js/lib/languages/swift'))
  hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'))
  hljs.registerLanguage('yaml', require('highlight.js/lib/languages/yaml'))
  hljs.registerLanguage('cypher', require('highlightjs-cypher'))
  hljs.registerLanguage('cypher-shell', function (hljs) {
    return {
      contains: [
        {
          className: 'meta',
          begin: '^\\s{0,3}[neo4j]',
          end: '>',
          starts: {
            end: /[\n|;]/, subLanguage: 'cypher',
          },
        },
      ],
    }
  })
  // add an alias, use properties syntax highlighter on conf
  hljs.registerLanguage('conf', require('highlight.js/lib/languages/properties'))
  hljs.registerLanguage('graphql', function (hljs) {
    return {
      aliases: ['gql'],
      keywords: {
        keyword:
        'query mutation subscription|10 type interface union scalar fragment|10 enum on ...',
        literal: 'true false null',
      },
      contains: [
        hljs.HASH_COMMENT_MODE,
        hljs.QUOTE_STRING_MODE,
        hljs.NUMBER_MODE,
        {
          className: 'type',
          begin: '[^\\w][A-Z][a-z]',
          end: '\\W',
          excludeEnd: true,
        },
        {
          className: 'literal',
          begin: '[^\\w][A-Z][A-Z]',
          end: '\\W',
          excludeEnd: true,
        },
        { className: 'variable', begin: '\\$', end: '\\W', excludeEnd: true },
        {
          className: 'keyword',
          begin: '[.]{2}',
          end: '\\.',
        },
        {
          className: 'meta',
          begin: '@',
          end: '\\W',
          excludeEnd: true,
        },
      ],
      illegal: /([;<']|BEGIN)/,
    }
  })
  hljs.highlightAll()
})()
