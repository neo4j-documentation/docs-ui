document.addEventListener('DOMContentLoaded', function () {
  if (!window.mixpanel) return

  const loaded = new Date()

  const handleFooterInViewport = () => {
    const bounding = document.querySelector('footer.footer').getBoundingClientRect()

    if (bounding.top <= (window.innerHeight || document.documentElement.clientHeight)) {
      window.mixpanel.track('DOCS_PAGE_READ', {
        pathname: window.location.origin + window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        ms: Math.abs(new Date() - loaded),

      })

      document.removeEventListener('scroll', handleFooterInViewport)
    }
  }

  document.addEventListener('scroll', handleFooterInViewport)
})
