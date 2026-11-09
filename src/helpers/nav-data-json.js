'use strict'

// Serialises page.navigation for the <script id="page-nav-data"> block, keeping only the
// fields the UI reads (src/js/09-nav-fetch.js and the tabbed-nav extension's output).
//
// Antora builds navigation items with whatever properties it supports, and the layout used
// to write them all into every page. Antora 3.2 adds `roles` and `pathname` to nav items,
// which nothing here reads, so they only made each page bigger. An allow-list keeps the
// block the same size whatever Antora version builds the site. If the UI starts to read
// another nav item field, add it here.
//
// Like json-stringify-script, any '</script' sequence is escaped so a nav title cannot
// close the script tag early.
const ALLOWED = new Set([
  // Antora nav item
  'content',
  'url',
  'urlType',
  'hash',
  'items',
  // Added by the tabbed-nav extension
  'component',
  'componentTitle',
  'componentVersion',
  'componentHeader',
  'tabIndex',
  'pageTabs',
  'docsetGroup',
  'navPromote',
  'tabOverview',
  'soleBlock',
  'latest',
  'order',
  'root',
  'module',
])

function pick (node) {
  if (Array.isArray(node)) return node.map(pick)
  if (node === null || typeof node !== 'object') return node
  const out = {}
  for (const key of Object.keys(node)) {
    if (ALLOWED.has(key)) out[key] = key === 'items' ? pick(node[key]) : node[key]
  }
  return out
}

module.exports = (navigation) => {
  return JSON.stringify(pick(navigation)).replace(/<\/(script)/gi, '<\\/$1')
}
