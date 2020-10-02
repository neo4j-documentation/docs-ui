;(function () {
  'use strict'

  var urlParams = new URLSearchParams(window.location.search)
  var category = urlParams.get('category')
  var tag = urlParams.get('tag')
  if (category !== null) {
    document.getElementById('kb-category-title').innerText = category
  }
  if (tag !== null) {
    document.getElementById('kb-tag-title').innerText = tag
  }
})()
