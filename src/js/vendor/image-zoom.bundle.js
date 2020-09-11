;(function () {
  'use strict'
  var mediumZoom = require('medium-zoom')
  var zoomOptions = {
    container: {
      top: 120,
      bottom: 10,
    },
  }
  mediumZoom('.imageblock > .content > img', zoomOptions)
  mediumZoom('.image.popup-link > img', zoomOptions)
})()
