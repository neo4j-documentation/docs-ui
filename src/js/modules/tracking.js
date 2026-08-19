// Mixpanel is loaded conditionally in header-scripts.hbs, but that only takes effect
// once a page is republished. Checking the docs theme here too lets us disable
// Mixpanel calls immediately by shipping a JS-only change.
export function canTrackWithMixpanel () {
  return !!window.mixpanel && !document.body.classList.contains('docs')
}
