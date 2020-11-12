'use strict'

// see https://github.com/adametry/gulp-eslint/blob/master/example/fix.js
const eslint = require('gulp-eslint')
const gulpIf = require('gulp-if')
const vfs = require('vinyl-fs')

function isFixed (file) {
  return file.eslint != null && file.eslint.fixed
}

module.exports = (files) => (done) => {
  const fix = process.argv.includes('--fix')
  return vfs
    .src(files, { base: './' })
    .pipe(eslint({ fix }))
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, vfs.dest('.')))
    .pipe(eslint.failAfterError())
    .on('error', done)
}
