// This script is used to load a pixel for Scarf analytics, but only if the user has accepted marketing cookies
window.addEventListener('CookiebotOnAccept', function () {
  if (Cookiebot.consent.marketing) {
    var img = document.createElement('img')
    img.src = 'https://static.neo4j.com/a.png?x-pxid=dae9b690-6a56-4889-a951-9d0207a18da6&page=' + encodeURIComponent(window.location.href)
    img.referrerPolicy = 'no-referrer-when-downgrade'
    img.style.display = 'none'
    document.body.appendChild(img)
  }
}, false)
