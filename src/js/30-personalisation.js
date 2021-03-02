import { postRequest } from './modules/http'
import { getCookie } from './modules/cookies'

;(function () {
  'use strict'

  document.addEventListener('DOMContentLoaded', () => {
    const urlObject = new URL(window.location.href)

    const url = urlObject.origin + urlObject.pathname
    const identity = getCookie('neo_identity')
    const gid = getCookie('_gid')
    const uetsid = getCookie('_uetsid')
    const role = urlObject.searchParams.get('role')

    postRequest('https://neo4j-personalisation.netlify.app/view', { url, identity, gid, uetsid, role }, undefined, () => {}, () => {})
  })
})()
