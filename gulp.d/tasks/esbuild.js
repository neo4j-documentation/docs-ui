const ospath = require('path')
const through = require('through2')
const esbuild = require('esbuild')

async function build (vinylFile) {
  return esbuild.build({
    stdin: {
      contents: vinylFile.contents.toString('utf8'),
      resolveDir: ospath.dirname(vinylFile.path),
      sourcefile: ospath.basename(vinylFile.path),
    },
    minify: true,
    bundle: true,
    target: [
      'chrome58',
      'firefox57',
      'safari11',
      'edge16',
    ],
    define: { 'process.env.NODE_ENV': '"production"' },
    write: false,
  })
}

module.exports = function () {
  return through.obj((vinylFile, encoding, callback) => {
    build(vinylFile)
      .then((result) => {
        vinylFile.contents = Buffer.from(result.outputFiles[0].contents)
        callback(null, vinylFile)
      })
  })
}
