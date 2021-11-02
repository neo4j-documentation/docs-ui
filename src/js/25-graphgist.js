document.addEventListener('DOMContentLoaded', function () {
  const neo4jBrowserConnectionUrlElement = document.getElementById('neo4j-browser-connection-url')
  const neo4jBrowserLinkElement = document.getElementById('neo4j-browser-open-link')
  if (neo4jBrowserConnectionUrlElement && neo4jBrowserLinkElement && neo4jBrowserLinkElement.dataset && neo4jBrowserLinkElement.dataset.browserGuideUrl) {
    const browserGuideUrl = neo4jBrowserLinkElement.dataset.browserGuideUrl
    const searchParams = new URLSearchParams(window.location.search)
    const dbms = searchParams.get('dbms')
    if (dbms) {
      neo4jBrowserConnectionUrlElement.value = dbms
    } else {
      // default value
      neo4jBrowserConnectionUrlElement.value = 'bolt://localhost'
    }
    neo4jBrowserLinkElement.addEventListener('click', () => {
      const connectionUrl = neo4jBrowserConnectionUrlElement.value
      const params = new URLSearchParams({
        cmd: 'play',
        arg: browserGuideUrl,
        dbms: connectionUrl,
      })
      neo4jBrowserLinkElement.href = `https://browser.neo4j.io/?${params.toString()}`
      return false
    })
  }
})
