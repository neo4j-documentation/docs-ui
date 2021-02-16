import { postRequest } from './modules/http'
import { getCookie } from './modules/cookies'

;(function () {
  'use strict'

  document.addEventListener('DOMContentLoaded', () => {
    const url = document.location.href.split('?')[0]
    const identity = getCookie('neo_identity')
    const gid = getCookie('_gid')
    const uetsid = getCookie('_uetsid')

    postRequest('https://neo4j-personalisation.netlify.app/view', { url, identity, gid, uetsid }, undefined, () => {}, () => {})
  })
})()
