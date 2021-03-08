/* global fetch FormData */

import { postRequest } from './modules/http'
import { getCookie } from './modules/cookies'

import { createElement } from './modules/dom';
(function () {
  'use strict'

  // const PERSONALISATION_API = 'https://neo4j-personalisation.netlify.app/view'
  const PERSONALISATION_API = 'http://localhost:3000'
  const OTHER = '_other_'

  const addMessage = (message) => {
    if (message.type !== 'question') return

    const doc = document.querySelector('.doc')

    const header = createElement('div', 'header question', [
      createElement('p', '', [
        createElement('strong', '', [
          document.createTextNode(message.text),
        ]),
      ]),
    ])

    header.innerHTML += '<svg width="14px" height="22px" viewBox="0 0 22 22" role="button" class="cancel" aria-label="Cancel Feedback"><line x1="19.5833333" y1="0.416666667" x2="0.416666667" y2="19.5833333" ></line><line x1="19.5833333" y1="19.5833333" x2="0.416666667" y2="0.416666667" ></line></svg>'

    const options = createElement('div', 'options', message.options.map((option) => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.id = option.id
      radio.name = 'response'
      radio.value = option.id

      const label = document.createElement('label')
      label.setAttribute('for', option.id)
      label.innerHTML = option.name

      return createElement('div', 'option', [
        radio,
        label,
      ])
    }))

    const form = createElement('form', 'form', [
      // header,
      options,
    ])

    // Other?
    if (message.options.find((option) => option.id === OTHER)) {
      const other = document.createElement('textarea')
      other.name = 'other'
      other.setAttribute('placeholder', '(Please specify)')
      other.setAttribute('rows', 1)

      form.appendChild(other)
    }

    // Buttons
    const submit = createElement('button', 'primary submit', [document.createTextNode('Submit')])
    const skip = createElement('button', 'secondary skip', [document.createTextNode('Skip')])

    const buttons = createElement('div', 'buttons', [
      submit,
      skip,
    ])

    form.appendChild(buttons)

    const container = createElement('div', 'feedback', [header, form])

    doc.appendChild(container)

    const close = () => doc.removeChild(container)
    const success = () => {
      container.classList.add('positive')
      container.innerHTML = '<div class="header thank-you-positive"><p><strong>Thank you for your feedback!</strong></p><p>We will use this information to help personalise your experience.</p>'
    }

    container.querySelectorAll('.cancel, .skip').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault()
      close()
    }))

    form.onsubmit = (e) => {
      e.preventDefault()

      const body = []
      const data = new FormData(form)

      for (var [key, value] of data.entries()) {
        // Crude validation
        if ((key === 'other' && value !== '') || (value !== undefined && value !== '')) {
          body.push([encodeURIComponent(key), encodeURIComponent(value)])
        }
      }

      if (body.length) {
        const gid = getCookie('_gid') || 'test'
        body.push(['gid', gid])

        fetch(
          `${PERSONALISATION_API}/response/${message.id}`,
          {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(body)),
          }
        )
          .then(() => success())
          .catch(() => success())
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const urlObject = new URL(window.location.href)

    const url = urlObject.origin + urlObject.pathname
    const identity = getCookie('neo_identity') || 'test'
    const gid = getCookie('_gid') || 'test'
    const uetsid = getCookie('_uetsid') || 'test'
    const role = urlObject.searchParams.get('role') || 'test'

    postRequest(`${PERSONALISATION_API}/view`, { url, identity, gid, uetsid, role }, undefined, (res) => {
      res.messages.length && res.messages.forEach((message) => addMessage(message))
    }, () => { })
  })
})()
