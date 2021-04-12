/* global Node */
import { cleanCode } from './modules/code'
import { createElement } from './modules/dom'
import { runnable } from './modules/runnable'

document.addEventListener('DOMContentLoaded', function () {
  // TODO: Solve race conditions with hljs, 07-runnable-code
  setTimeout(() => {
    document.querySelectorAll('.arrange').forEach((element) => {
      const pre = element.querySelector('pre')
      const code = pre.querySelector('code')
      const original = cleanCode(code.innerText)

      const handleCodeSegmentClick = (e) => {
        e.preventDefault()

        addSegmentToOptionList(e.target, true)
      }

      const addSegmentToCode = (segment, log) => {
        const list = element.querySelector('.arrange-options ul')
        const code = element.querySelector('pre code')

        const cloned = segment.children[0].cloneNode(true)

        code.appendChild(cloned)

        // Remove option from list
        list.removeChild(segment)

        cloned.addEventListener('click', handleCodeSegmentClick)

        // Log in Mixpanel
        if (window.mixpanel && log) {
          window.mixpanel.track('DOCS_ARRANGE_CODE_ADD', {
            pathname: window.location.origin + window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            segment: cloned.innerHTML,
            code: cleanCode(code.innerHTML),
            original,
          })
        }
      }

      const addSegmentToOptionList = (segment, log) => {
        const code = element.querySelector('pre code')
        const list = element.querySelector('.arrange-options ul')

        // Remove Element from <code>
        code.removeChild(segment)

        if (segment.nodeType === Node.TEXT_NODE) {
          // Wrap text nodes in a <span>
          segment = createElement('span', 'text-node', [
            document.createTextNode(` ${segment.textContent} `),
          ])
        }
        else if (segment.classList.contains('hljs-number')) {
          // Add padding to a number
          segment.innerHTML = ' ' + segment.innerHTML + ' '
        }

        // Log in Mixpanel
        if (window.mixpanel && log) {
          window.mixpanel.track('DOCS_ARRANGE_CODE_REMOVE', {
            pathname: window.location.origin + window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            segment: segment.innerHTML,
            code: cleanCode(code.innerHTML),
            original,
          })
        }

        segment.removeEventListener('click', handleCodeSegmentClick)

        const li = createElement('li', 'arrange-option', [segment])

        li.addEventListener('click', (e) => {
          e.preventDefault()

          addSegmentToCode(li, true)
        })

        // Add to list
        list.appendChild(li)
      }

      // Create Options List
      const ul = createElement('ul', '', [])

      const div = createElement('div', 'arrange-options', [
        createElement('p', 'arrange-message', [
          document.createTextNode('Choose from the options below to complete the query:'),
        ]),
        ul,
      ])

      pre.parentElement.prepend(div)

      // Get all child nodes and add to the options list
      const children = Array.from(code.childNodes)
        .filter((el) => el.children > 0 || el.textContent.trim() !== '')

      children.sort(() => Math.random() < 0.5 ? -1 : 1)

      children.map((child) => addSegmentToOptionList(child))

      const successCallback = ({ cypher, results }) => {
        if (window.mixpanel) {
          window.mixpanel.track('DOCS_ARRANGE_CODE_COMPLETED', {
            pathname: window.location.origin + window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            code: cypher,
            results: results.records.length,
          })
        }
      }
      const errorCallback = ({ cypher, error }) => {
        if (window.mixpanel) {
          window.mixpanel.track('DOCS_ARRANGE_CODE_ERROR', {
            pathname: window.location.origin + window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            code: cypher,
            error: error.message,
          })
        }
      }

      runnable(element, 'Run Query', successCallback, errorCallback)
    })
  }, 200)
})
