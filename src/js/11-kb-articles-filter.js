;(function () {
  'use strict'

  var urlParams = new URLSearchParams(window.location.search)
  var category = urlParams.get('category')
  var tag = urlParams.get('tag')
  document.querySelectorAll('.kb-article')
    .forEach(function (el) {
      var visible = true
      if (category !== null) {
        visible = el.dataset && el.dataset.kbCategory === category
      }
      if (tag !== null) {
        visible = visible &&
          el.dataset &&
          el.dataset.kbTags &&
          el.dataset.kbTags
            .trim()
            .split(',')
            .map(function (v) {
              return v.trim().toLowerCase()
            })
            .includes(tag.trim().toLowerCase())
      }
      if (visible) {
        el.classList.remove('is-hidden')
      } else {
        el.classList.add('is-hidden')
      }
    })
})()
