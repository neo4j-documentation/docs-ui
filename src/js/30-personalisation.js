import { postRequest } from './modules/http'

;(function () {
  'use strict'

  const getCookie = (name) => {
    const regex = new RegExp(`${name}=[^;]+;`)
    const match = document.cookie.match(regex)
    if (match) {
      return match[0].split('=')[1].trim().replace(';', '')
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const url = document.location.href.split('?')[0]
    const identity = getCookie('neo_identity')
    const gid = getCookie('_gid')
    const uetsid = getCookie('_uetsid')

    postRequest('https://neo4j-personalisation.netlify.app/view', { url, identity, gid, uetsid }, undefined, () => {}, () => {})
  })
})()
