'use strict'

const { text } = require("express")

module.exports = (text, replace, replaceWith) => text.replace(replace, replaceWith)