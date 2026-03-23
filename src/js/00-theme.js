import { createElement } from './modules/dom'

;(function () {
  'use strict'

  // return if no-dark-mode found
  if (document.getElementById('theme-dropdown')?.classList.contains('no-dark-mode')) {
    return
  }

  const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="16" height="16" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'

  const sunPaths = [
    '<circle cx="12" cy="12" r="4"/>',
    '<line x1="12" y1="2" x2="12" y2="5"/>',
    '<line x1="12" y1="19" x2="12" y2="22"/>',
    '<line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>',
    '<line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>',
    '<line x1="2" y1="12" x2="5" y2="12"/>',
    '<line x1="19" y1="12" x2="22" y2="12"/>',
    '<line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>',
    '<line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>',
  ].join('')

  const moonPath = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'

  function makeSvg (extraClass, inner) {
    return `<svg class="theme-icon ${extraClass}" ${svgAttrs}>${inner}</svg>`
  }

  // set the initial color scheme based on user preference
  const themeMenuContainer = document.querySelector('.navbar-menu .navbar-end')
  let themeMenu = document.getElementById('theme-dropdown')
  const themeChoices = ['light', 'dark']

  // create the theme menu if it doesn't exist
  // it will be missing for docs that have not been built yet with the latest ui
  if (!themeMenu) {
    const navLink = createElement('span', 'navbar-link')
    navLink.setAttribute('aria-label', 'Theme')
    navLink.innerHTML = makeSvg('theme-icon-light', sunPaths) + makeSvg('theme-icon-dark', moonPath)

    themeMenu = createElement('div', 'navbar-item has-dropdown is-hoverable docs', [
      navLink,
      createElement('div', 'navbar-dropdown navbar-dropdown-narrow', themeChoices.map(function (theme) {
        const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1)
        const itemDiv = createElement('div', 'navbar-item project')
        itemDiv.setAttribute('data-theme', theme)
        const icon = theme === 'light' ? makeSvg('', sunPaths) : makeSvg('', moonPath)
        itemDiv.innerHTML = `${icon}<span class="project-name">${themeLabel}</span>`
        return itemDiv
      })),
    ])
    themeMenu.setAttribute('id', 'theme-dropdown')
    const searchItem = themeMenuContainer.querySelector('#search_open')?.closest('.navbar-item')
    themeMenuContainer.insertBefore(themeMenu, searchItem || themeMenuContainer.lastChild)
  }

  const themeItems = themeMenu.querySelectorAll('.navbar-item')
  const logos = document.querySelectorAll('.navbar-logo')

  document.addEventListener('DOMContentLoaded', function () {
    const userColorSchemeName = 'neo4j-docs-theme'
    const userColorScheme = localStorage.getItem(userColorSchemeName) || 'light'

    updateSelectedThemeItem(themeItems, userColorScheme)

    themeItems.forEach(function (theme) {
      const parent = theme.parentElement
      theme.addEventListener('click', updateThemePreference.bind(parent, theme.getAttribute('data-theme')))
      // don't let toggle clicks propagate
      theme.addEventListener('click', concealEvent)
    })

    const isDark = userColorScheme === 'dark'
    const lightOrDark = isDark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = lightOrDark
    updateLogos(lightOrDark)
    updateChatbotTheme(lightOrDark)
    updateBodyClass(lightOrDark)

    const chatbotScript = document.querySelector('script[src="/docs/assets/chatbot/index.js"]')
    chatbotScript.addEventListener('load', () => updateChatbotTheme(lightOrDark))
  })

  // NOTE don't let event get picked up by window click listener
  function concealEvent (e) {
    e.stopPropagation()
  }

  function updateThemePreference (theme) {
    const userColorSchemeName = 'neo4j-docs-theme'
    localStorage.setItem(userColorSchemeName, theme)

    const lightOrDark = resolveLightOrDark(theme)
    document.documentElement.style.colorScheme = lightOrDark
    updateSelectedThemeItem(themeItems, theme)
    updateLogos(lightOrDark)
    updateChatbotTheme(lightOrDark)
    updateBodyClass(lightOrDark)
  }

  function updateBodyClass (theme) {
    const body = document.body
    body.classList.remove('ndl-theme-light', 'ndl-theme-dark')
    body.classList.add(`ndl-theme-${theme}`)
  }

  function resolveLightOrDark (theme) {
    return theme === 'dark' ? 'dark' : 'light'
  }

  function updateChatbotTheme (theme) {
    const chatbot = document.getElementById('docs_chatbot')
    if (!chatbot) return
    const chatbotThemeClass = `ndl-theme-${theme}`
    const chatbotClassToRemove = theme === 'dark' ? 'ndl-theme-light' : 'ndl-theme-dark'
    chatbot.querySelectorAll(`.${chatbotClassToRemove}`).forEach((el) => {
      el.classList.remove(chatbotClassToRemove)
      el.classList.add(chatbotThemeClass)
    })
  }

  function updateLogos (theme) {
    logos.forEach((logo) => {
      const logoTheme = logo.getAttribute('data-theme')
      if (!logoTheme) return
      logo.classList.toggle('hidden', logoTheme !== theme)
    })

    document.querySelectorAll('.toc-ad').forEach((ad) => {
      if (theme === 'dark') {
        ad.style.backgroundImage = 'none'
      } else {
        ad.removeAttribute('style')
      }
    })
  }

  function updateSelectedThemeItem (themeItems, theme) {
    themeItems.forEach((item) => {
      item.classList.remove('selected')
      if (item.getAttribute('data-theme') === theme) {
        item.classList.add('selected')
      }
    })
  }
})()
