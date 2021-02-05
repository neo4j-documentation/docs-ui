'use strict'
import mediumZoom from 'medium-zoom'

const zoomOptions = {
  container: {
    top: 120,
    bottom: 10,
  },
}
mediumZoom('.imageblock > .content > img', zoomOptions)
mediumZoom('.image.popup-link > img', zoomOptions)
