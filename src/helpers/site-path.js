'use strict'

// Extract the pathname portion of a URL, stripped of any trailing slash.
// Returns '' if the URL is missing or invalid.
//
// Used to stamp the site path on <body> as data-site-path so client-side
// scripts (e.g. 09-nav-fetch.js) know where docs are mounted without
// having to guess from window.location.
module.exports = (url) => {
  if (!url) return ''
  try {
    return new URL(url).pathname.replace(/\/+$/, '')
  } catch (e) {
    return ''
  }
}
