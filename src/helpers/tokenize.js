'use strict'

module.exports = (value) => value.trim().split(',').map((v) => v.trim().toLowerCase())
