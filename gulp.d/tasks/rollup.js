const ospath = require('path')
const through = require('through2')
const { rollup } = require('rollup')
const rollupPluginNodeResolve = require('@rollup/plugin-node-resolve').nodeResolve
const rollupPluginCommonJS = require('@rollup/plugin-commonjs')
const rollupPluginBabel = require('@rollup/plugin-babel').babel
const rollupPluginTerser = require('rollup-plugin-terser').terser

const toCamel = (s) => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '')
  })
}

const ignoredCircular = [
  'd3-selection',
  'd3-interpolate',
  'd3-transition',
  'd3-voronoi',
]

async function bundle (vinylFile) {
  const bundle = await rollup({
    input: vinylFile.path,
    plugins: [
      rollupPluginNodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      rollupPluginCommonJS(),
      rollupPluginBabel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled',
      }),
      rollupPluginTerser(),
    ],
    onwarn: (warning) => {
      if (warning.code === 'CIRCULAR_DEPENDENCY' && ignoredCircular.some((d) => warning.importer.includes(d))) {
        return
      }
      console.warn(warning.message)
    },
  })
  return await bundle.generate({
    format: 'iife',
    name: toCamel(ospath.basename(vinylFile.path, '.js')),
  })
}

module.exports = function () {
  return through.obj(function (vinylFile, encoding, callback) {
    bundle(vinylFile)
      .then((result) => {
        let buff = Buffer.from('')
        for (const chunkOrAsset of result.output) {
          buff = Buffer.concat([buff, Buffer.from(chunkOrAsset.code)])
        }
        vinylFile.contents = buff
        callback(null, vinylFile)
      })
  })
}
