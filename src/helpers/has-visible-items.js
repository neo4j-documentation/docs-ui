'use strict'

// True if the item list contains at least one entry that actually renders in the
// nav — i.e. something that isn't a hidden tab-overview. Used to suppress docset
// blocks whose only content is the (hidden) overview page, which would otherwise
// render as an empty component header.
module.exports = (items) =>
  Array.isArray(items) &&
  items.some((i) => !i.tabOverview && (i.url || (i.items && i.items.length)))
