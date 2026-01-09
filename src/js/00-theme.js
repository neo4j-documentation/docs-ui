import { createElement } from './modules/dom'

;(function () {
  'use strict'

  // return if no-dark-mode found
  if (document.getElementById('theme-dropdown')?.classList.contains('no-dark-mode')) {
    return
  }

  // set the initial color scheme based on user preference or to system
  const themeMenuContainer = document.querySelector('.navbar-menu .navbar-end')
  let themeMenu = document.getElementById('theme-dropdown')
  const themeChoices = ['light', 'dark', 'system']

  // create the theme menu if it doesn't exist
  // it will be missing for docs that have not been built yet with the latest ui
  if (!themeMenu) {
    themeMenu = createElement('div', 'navbar-item has-dropdown is-hoverable docs', [
      createElement('span', 'navbar-link', [document.createTextNode('Theme')]),
      createElement('div', 'navbar-dropdown navbar-dropdown-narrow', themeChoices.map(function (theme) {
        const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1)
        const themeSpan = createElement('span', 'project-name', [document.createTextNode(themeLabel)])
        const themeDiv = createElement('div', 'navbar-item project', [themeSpan])
        themeDiv.setAttribute('data-theme', theme)
        return themeDiv
      })),
    ])
    themeMenu.setAttribute('id', 'theme-dropdown')
    themeMenuContainer.insertBefore(themeMenu, themeMenuContainer.firstChild)
  }

  const themeItems = themeMenu.querySelectorAll('.navbar-item')
  const logos = document.querySelectorAll('.navbar-logo')

  document.addEventListener('DOMContentLoaded', function () {
    const userColorSchemeName = 'user-color-scheme-preference'
    const userColorScheme = localStorage.getItem(userColorSchemeName) || 'system'

    // find the themeItem with textContent matching userColorScheme
    updateSelectedThemeItem(themeItems, userColorScheme)

    themeItems.forEach(function (theme) {
      const parent = theme.parentElement
      theme.addEventListener('click', updateThemePreference.bind(parent, theme.getAttribute('data-theme')))
      // don't let toggle clicks propagate
      theme.addEventListener('click', concealEvent)
    })

    const darkMode = userColorScheme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)') : userColorScheme === 'dark'
        ? { matches: true, addEventListener: () => {} } : { matches: false, addEventListener: () => {} }

    const isDark = darkMode.matches // true if system is dark, false if light
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    updateLogos(isDark ? 'dark' : 'light')
    // darkMode.addEventListener('change', handleThemeChange)
  })

  // NOTE don't let event get picked up by window click listener
  function concealEvent (e) {
    e.stopPropagation()
  }

  function updateThemePreference (theme) {
    const userColorSchemeName = 'user-color-scheme-preference'
    localStorage.setItem(userColorSchemeName, theme)

    const lightOrDark = resolveLightOrDark(theme)

    document.documentElement.style.colorScheme = lightOrDark

    // add a selected class to the selected theme item
    updateSelectedThemeItem(themeItems, theme)
    updateLogos(lightOrDark)
  }

  function resolveLightOrDark (theme) {
    if (theme === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme = isDarkMode ? 'dark' : 'light'
    }
    return theme
  }

  function updateLogos (theme) {
    logos.forEach((logo) => {
      const logoTheme = logo.getAttribute('data-theme')
      if (logoTheme === theme) {
        logo.classList.remove('hidden')
      } else {
        logo.classList.add('hidden')
      }
    })

    // if dark mode, do some stuff

    // remove background image from toc-ad
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
      const itemTheme = item.getAttribute('data-theme')
      if (itemTheme === theme) {
        item.classList.add('selected')
      }
    })
  }
})()
