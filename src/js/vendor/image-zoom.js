'use strict'
import mediumZoom from 'medium-zoom'

const zoomOptions = {
  container: {
    top: 120,
    bottom: 10
  },
  background: 'rgba(33, 35, 37, 1)'
}
mediumZoom('.imageblock > .content > img', zoomOptions)
mediumZoom('.image.popup-link > img', zoomOptions)
