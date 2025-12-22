;(function () {
  'use strict'

  // set the initial color scheme based on user preference or to system
  const themeMenu = document.getElementById('theme-dropdown')

  const themeItems = themeMenu.querySelectorAll('.navbar-item')

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

    function handleThemeChange (e) {
      const isDark = e.matches // true if system is dark, false if light
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    }
    handleThemeChange(darkMode)
    darkMode.addEventListener('change', handleThemeChange)
  })

  // NOTE don't let event get picked up by window click listener
  function concealEvent (e) {
    e.stopPropagation()
  }

  function updateThemePreference (theme) {
    const userColorSchemeName = 'user-color-scheme-preference'
    localStorage.setItem(userColorSchemeName, theme)

    if (theme === 'light' || theme === 'dark') {
      document.documentElement.style.colorScheme = theme
    } else if (theme === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light'
    }

    updateSelectedThemeItem(themeItems, theme)
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
