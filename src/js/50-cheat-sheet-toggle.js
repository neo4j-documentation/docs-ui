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

  // Navigation is a plain <a href> now (each version link's own href, set
  // server-side, replaces the URL regex-rewrite this used to do from the
  // selected <option>'s value) - only the open/close toggle is needed here,
  // since this replaces a native <select>'s built-in dropdown behavior. The
  // version links carry class="version-selector" so they're picked up by
  // whatever already tracks <a> clicks elsewhere on the page, rather than the
  // bespoke window.ga(...) call this used to make.
  const versionDropdownTrigger = document.querySelector('body.cheat-sheet .version-dropdown-trigger')
  if (versionDropdownTrigger) {
    const dropdown = versionDropdownTrigger.closest('.version-dropdown')
    const label = versionDropdownTrigger.querySelector('.version-dropdown-trigger-label')
    const current = dropdown.querySelector('.is-current .version-selector')
    if (label && current) label.textContent = current.textContent.trim()

    const close = () => {
      dropdown.classList.remove('is-active')
      versionDropdownTrigger.setAttribute('aria-expanded', 'false')
    }

    versionDropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation()
      if (dropdown.classList.contains('is-active')) {
        close()
      } else {
        dropdown.classList.add('is-active')
        versionDropdownTrigger.setAttribute('aria-expanded', 'true')
      }
    })

    document.addEventListener('click', (e) => {
      if (dropdown.classList.contains('is-active') && !dropdown.contains(e.target)) close()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('is-active')) close()
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
  'aura-db-enterprise': 'AuraDB Virtual Dedicated Cloud',
  'aura-db-free': 'AuraDB Free',
  'aura-db-professional': 'AuraDB Professional',
  'aura-ds-enterprise': 'AuraDS Enterprise',
  'aura-ds-professional': 'AuraDS Professional',
  'enterprise-edition': 'Enterprise Edition',
  'community-edition': 'Neo4j Community Edition',
}

// some labels are emitted under more than one role class for the same product;
// normalise those aliases to the canonical key used in allLabels
const labelAliases = {
  'aura-db-dedicated': 'aura-db-enterprise',
}

function rewriteLabels () {
  document.querySelectorAll('.labels').forEach((labelsDiv) => {
    const present = [...labelsDiv.querySelectorAll('.label')]
      .map((span) => [...span.classList].find((c) => c.startsWith('label--'))?.replace('label--', ''))
      .filter(Boolean)
      .map((key) => labelAliases[key] || key)

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
    if (!li.hash || document.querySelector(li.hash) === null) li.remove()
  })
}

function checkHashVariations (id) {
  const idVariants = [id, '_' + id.replace(/-/g, '_')]
  return idVariants.find((i) => document.getElementById(i))
}
