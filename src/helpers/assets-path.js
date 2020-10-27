'use strict'

module.exports = (page, { data: { root } }) => page.attributes && page.attributes.cdn ? page.attributes.cdn : root.uiRootPath
