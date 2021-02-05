;(function () {
  'use strict'

  var hljs = require('highlight.js/lib/highlight')
  hljs.registerLanguage('asciidoc', require('highlight.js/lib/languages/asciidoc'))
  hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'))
  hljs.registerLanguage('clojure', require('highlight.js/lib/languages/clojure'))
  hljs.registerLanguage('cpp', require('highlight.js/lib/languages/cpp'))
  hljs.registerLanguage('cs', require('highlight.js/lib/languages/cs'))
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
  hljs.registerLanguage('cypher', function (e) { return { case_insensitive: !0, keywords: { keyword: 'as asc ascending assert by call case commit constraint create csv cypher delete desc descending detach distinct drop else end ends explain fieldterminator foreach from headers in index is join limit load match merge on optional order periodic profile remove return scan set skip start starts then union unique unwind using when where with yield', literal: 'true false null' }, contains: [e.QUOTE_STRING_MODE, e.APOS_STRING_MODE, e.C_NUMBER_MODE, { className: 'string', begin: '`', end: '`', illegal: '\\n', contains: [e.BACKSLASH_ESCAPE] }, { className: 'type', begin: /((-|>)?\s?\(|-\[)\w*:/, excludeBegin: !0, end: '\\W', excludeEnd: !0 }, { className: 'functionCall', begin: /(\s+|,)\w+\(/, end: /\)/, keywords: { built_in: 'all any exists none single coalesce endNode head id last length properties size startNode timestamp toBoolean toFloat toInteger type avg collect count max min percentileCont percentileDisc stDev stDevP sum extract filter keys labels nodes range reduce relationships reverse tail abs ceil floor rand round sign e exp log log10 sqrt acos asin atan atan2 cos cot degrees haversin pi radians sin tan left ltrim replace reverse right rtrim split substring toLower toString toUpper trim distance' } }, e.C_BLOCK_COMMENT_MODE, e.C_LINE_COMMENT_MODE, { begin: '//', ends: '//' }] } })
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
  hljs.initHighlighting()
})()
