'use strict'

const stylelint = require('gulp-stylelint')
const vfs = require('vinyl-fs')

module.exports = (files) => (done) => {
  const fix = process.argv.includes('--fix')
  return vfs
    .src(files, { base: './' })
    .pipe(stylelint({ fix, reporters: [{ formatter: 'string', console: true }], failAfterError: true }))
    .pipe(vfs.dest('.'))
    .on('error', done)
}
