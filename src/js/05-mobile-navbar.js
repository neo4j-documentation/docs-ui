// Below the tabs-row breakpoint, #navbar-tabs collapses into a trigger button
// showing the current tab plus a dropdown of the other tabs (see navbar-tabs.hbs /
// header.css) instead of the old hamburger + full-screen panel.
document.addEventListener('DOMContentLoaded', function () {
  var triggers = Array.prototype.slice.call(document.querySelectorAll('.navbar-tabs-trigger'), 0)
  if (triggers.length === 0) return
  triggers.forEach(function (trigger) {
    var panel = trigger.closest('.navbar-tabs')
    if (!panel) return

    var labelEl = trigger.querySelector('.navbar-tabs-trigger-label')
    var activeTab = panel.querySelector('.category-ul li.is-active .header-tab span')
    if (labelEl) labelEl.textContent = activeTab ? activeTab.textContent : 'Menu'

    function open () {
      panel.classList.add('is-active')
      trigger.setAttribute('aria-expanded', 'true')
    }

    function close () {
      panel.classList.remove('is-active')
      trigger.setAttribute('aria-expanded', 'false')
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation()
      if (panel.classList.contains('is-active')) close()
      else open()
    })

    document.addEventListener('click', function (e) {
      if (panel.classList.contains('is-active') && !panel.contains(e.target)) close()
    })

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-active')) close()
    })
  })
})
