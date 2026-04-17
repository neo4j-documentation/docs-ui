import { createElement } from './modules/dom'

;(function () {
  'use strict'

  // return if no-dark-mode found
  if (document.getElementById('theme-dropdown')?.classList.contains('no-dark-mode')) {
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

  // set the initial color scheme based on user preference
  const themeMenuContainer = document.querySelector('.navbar-menu .navbar-end')
  let themeMenu = document.getElementById('theme-dropdown')
  const themeChoices = ['light', 'dark']

  // remove the theme menu if it lacks the new icon structure (old published pages)
  if (themeMenu && !themeMenu.querySelector('.theme-icon')) {
    themeMenu.remove()
    themeMenu = null
  }

  // create the theme menu if it doesn't exist
  // it will be missing for docs that have not been built yet with the latest ui
  if (!themeMenu) {
    const navLink = createElement('span', 'navbar-link')
    navLink.setAttribute('aria-label', 'Theme')
    navLink.innerHTML = makeSvg('theme-icon-light', sunPath) + makeSvg('theme-icon-dark', moonPath)

    themeMenu = createElement('div', 'navbar-item has-dropdown is-hoverable docs', [
      navLink,
      createElement('div', 'navbar-dropdown navbar-dropdown-narrow', themeChoices.map(function (theme) {
        const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1)
        const itemDiv = createElement('div', 'navbar-item project')
        itemDiv.setAttribute('data-theme', theme)
        const icon = theme === 'light' ? makeSvg('', sunPath) : makeSvg('', moonPath)
        itemDiv.innerHTML = `${icon}<span class="project-name">${themeLabel}</span>`
        return itemDiv
      })),
    ])
    themeMenu.setAttribute('id', 'theme-dropdown')
    if (themeMenuContainer) {
      const searchItem = themeMenuContainer.querySelector('#search_open')?.closest('.navbar-item')
      themeMenuContainer.insertBefore(themeMenu, searchItem || themeMenuContainer.lastChild)
    } else {
      const navbarMenu = document.querySelector('.navbar-menu')
      if (navbarMenu) navbarMenu.appendChild(themeMenu)
    }
  }

  const themeItems = themeMenu.querySelectorAll('.navbar-item')
  const logos = document.querySelectorAll('.navbar-logo')
  let chatbotObserver = null

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
    updateBodyClass(lightOrDark)

    updateChatbotObserver(lightOrDark)
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
    updateChatbotObserver(lightOrDark)
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

  function updateSelectedThemeItem (themeItems, theme) {
    themeItems.forEach((item) => {
      item.classList.remove('selected')
      if (item.getAttribute('data-theme') === theme) {
        item.classList.add('selected')
      }
    })
  }
})()
