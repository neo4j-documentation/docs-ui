import { createElement } from './modules/dom'

;(function () {
  'use strict'

  // return if no-dark-mode found
  const themeDropdown = document.getElementById('theme-dropdown')
  if (themeDropdown && themeDropdown.classList.contains('no-dark-mode')) {
    return
  }

  const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="16" height="16" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'

  const sunPath = '<path d="M12 3V5.25M18.364 5.63604L16.773 7.22703M21 12H18.75' +
    'M18.364 18.364L16.773 16.773M12 18.75V21M7.22703 16.773L5.63604 18.364' +
    'M5.25 12H3M7.22703 7.22703L5.63604 5.63604M15.75 12C15.75 14.0711 14.0711 15.75 12 15.75' +
    'C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25' +
    'C14.0711 8.25 15.75 9.92893 15.75 12Z"/>'

  const moonPath = '<path d="M21.7519 15.0021C20.597 15.484 19.3296 15.7501 18 15.7501' +
    'C12.6152 15.7501 8.25 11.3849 8.25 6.00011C8.25 4.67052 8.51614 3.40308 8.99806 2.24817' +
    'C5.47566 3.71798 3 7.19493 3 11.2501C3 16.6349 7.36522 21.0001 12.75 21.0001' +
    'C16.8052 21.0001 20.2821 18.5245 21.7519 15.0021Z"/>'

  function makeSvg (extraClass, inner) {
    return `<svg class="theme-icon ${extraClass}" ${svgAttrs}>${inner}</svg>`
  }

  const themeMenuContainer = document.querySelector('.navbar-menu .navbar-end')
  let themeMenu = document.getElementById('theme-dropdown')

  // remove old dropdown-style menus (old published pages without toggle structure)
  if (themeMenu && (!themeMenu.querySelector('.theme-icon') || themeMenu.querySelector('.navbar-dropdown'))) {
    themeMenu.remove()
    themeMenu = null
  }

  if (!themeMenu) {
    themeMenu = createElement('div', 'navbar-item docs')
    themeMenu.setAttribute('id', 'theme-dropdown')
    themeMenu.setAttribute('role', 'button')
    themeMenu.setAttribute('tabindex', '0')
    themeMenu.setAttribute('aria-label', 'Toggle colour theme')
    themeMenu.innerHTML = makeSvg('theme-icon-light', sunPath) + makeSvg('theme-icon-dark', moonPath)
    if (themeMenuContainer) {
      const searchOpenEl = themeMenuContainer.querySelector('#search_open')
      const searchItem = searchOpenEl && searchOpenEl.closest('.navbar-item')
      themeMenuContainer.insertBefore(themeMenu, searchItem || themeMenuContainer.lastChild)
    } else {
      const navbarMenu = document.querySelector('.navbar-menu')
      if (navbarMenu) navbarMenu.appendChild(themeMenu)
    }
  }

  const logos = document.querySelectorAll('.navbar-logo')
  let chatbotObserver = null

  document.addEventListener('DOMContentLoaded', function () {
    const userColorSchemeName = 'neo4j-docs-theme'
    const userColorScheme = localStorage.getItem(userColorSchemeName) || 'light'

    const lightOrDark = userColorScheme === 'dark' ? 'dark' : 'light'

    updateToggleA11y(lightOrDark)

    themeMenu.addEventListener('click', function () {
      const current = localStorage.getItem(userColorSchemeName) || 'light'
      updateThemePreference(current === 'dark' ? 'light' : 'dark')
    })

    themeMenu.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        themeMenu.click()
      }
    })
    document.documentElement.style.colorScheme = lightOrDark
    updateLogos(lightOrDark)
    updateBodyClass(lightOrDark)
    updateChatbotObserver(lightOrDark)
  })

  function updateThemePreference (theme) {
    const userColorSchemeName = 'neo4j-docs-theme'
    localStorage.setItem(userColorSchemeName, theme)

    const lightOrDark = resolveLightOrDark(theme)
    document.documentElement.style.colorScheme = lightOrDark
    updateLogos(lightOrDark)
    updateChatbotTheme(lightOrDark)
    updateBodyClass(lightOrDark)
    updateChatbotObserver(lightOrDark)
    updateToggleA11y(lightOrDark)
  }

  function updateToggleA11y (theme) {
    themeMenu.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false')
    themeMenu.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')
  }

  function updateBodyClass (theme) {
    const body = document.body
    body.classList.remove('ndl-theme-light', 'ndl-theme-dark')
    body.classList.add(`ndl-theme-${theme}`)
  }

  function resolveLightOrDark (theme) {
    return theme === 'dark' ? 'dark' : 'light'
  }

  function updateChatbotObserver (theme) {
    if (chatbotObserver) {
      chatbotObserver.disconnect()
      chatbotObserver = null
    }
    if (theme !== 'dark') return
    const chatbot = document.getElementById('docs_chatbot')
    if (!chatbot) return
    if (chatbot.children.length > 0) {
      // already rendered — swap immediately
      chatbot.querySelectorAll('.ndl-theme-light')
        .forEach((el) => el.classList.replace('ndl-theme-light', 'ndl-theme-dark'))
    } else {
      // not yet rendered — hide until chatbot renders with correct theme
      chatbot.style.display = 'none'
    }
    chatbotObserver = new MutationObserver(function () {
      chatbot.querySelectorAll('.ndl-theme-light')
        .forEach((el) => el.classList.replace('ndl-theme-light', 'ndl-theme-dark'))
      chatbot.style.removeProperty('display')
    })
    chatbotObserver.observe(chatbot, { childList: true, subtree: true })
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
})()
