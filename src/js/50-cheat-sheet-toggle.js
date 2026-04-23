document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('body.cheat-sheet')) return

  const queryString = document.location.search
  const urlParams = new URLSearchParams(queryString)

  if (urlParams.has('sid')) {
    const scrollToSection = checkHashVariations(urlParams.get('sid'))
    if (scrollToSection) {
      document.location.hash = scrollToSection
    }
    document.location.replace(document.location.href.replace(document.location.search, ''))
  }

  rewriteLabels()
  cleanToc()

  const versionSelector = document.querySelector('body.cheat-sheet .version-selector')
  if (versionSelector) {
    versionSelector.addEventListener('change', function (e) {
      const current = e.target.dataset.current
      const next = e.target.selectedOptions[0].dataset.version
      const re = new RegExp(`/${current}/`)
      const newUrl = document.URL.replace(re, `/${next}/`)
      if (window.ga) {
        window.ga('send', 'event', 'version-select', 'From: ' + current + ';To:' + next + ';')
      }
      document.location.replace(newUrl)
    })
  }

  const matchTo = parseFloat(document.querySelector('.nav-container .component').getBoundingClientRect().height)
  document.querySelectorAll('article h2').forEach((el) => {
    el.style.height = `${matchTo}px`
    el.style.margin = 0
    el.style.lineHeight = `${matchTo}px`
  })
})

const allLabels = {
  'aura-db-business-critical': 'AuraDB Business Critical',
  'aura-db-dedicated': 'AuraDB Virtual Dedicated Cloud',
  'aura-db-free': 'AuraDB Free',
  'aura-db-professional': 'AuraDB Professional',
  'aura-ds-enterprise': 'AuraDS Enterprise',
  'aura-ds-professional': 'AuraDS Professional',
  'enterprise-edition': 'Enterprise Edition',
  'community-edition': 'Neo4j Community Edition',
}

function rewriteLabels () {
  document.querySelectorAll('.labels').forEach((labelsDiv) => {
    const present = [...labelsDiv.querySelectorAll('.label')]
      .map((span) => [...span.classList].find((c) => c.startsWith('label--'))?.replace('label--', ''))
      .filter(Boolean)

    const missing = Object.keys(allLabels).filter((key) => !present.includes(key))

    if (missing.length > 0 && missing.length < present.length) {
      labelsDiv.innerHTML = ''
      missing.forEach((key) => {
        const span = document.createElement('span')
        span.className = `label content-label label--${key} not-available`
        span.textContent = `Not available on ${allLabels[key]}`
        labelsDiv.appendChild(span)
      })
    }
  })
}

function cleanToc () {
  document.querySelectorAll('.toc-menu a').forEach((li) => {
    if (document.querySelector(li.hash) === null) li.remove()
  })
}

function checkHashVariations (id) {
  const idVariants = [id, '_' + id.replace(/-/g, '_')]
  return idVariants.find((i) => document.getElementById(i))
}
