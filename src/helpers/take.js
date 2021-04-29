'use strict'

module.exports = (array, max) => array.splice(0, Math.min(array.length, max))
