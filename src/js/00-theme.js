;(function () {
  'use strict'

  // set the initial color scheme based on user preference or to system
  const themeMenu = document.getElementById('theme-dropdown')
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
