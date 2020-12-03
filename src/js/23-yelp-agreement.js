document.addEventListener('DOMContentLoaded', function () {
  // Yelp dataset
  var yelpDatasetAgreementElement = document.getElementById('yelp-dataset-agreement')
  var yelpCreateSandboxLinkElement = document.getElementById('yelp-create-sandbox-link')

  if (yelpDatasetAgreementElement && yelpCreateSandboxLinkElement) {
    var neo4jYelpAgreement = ''
    if (typeof window.localStorage !== 'undefined' && typeof window.localStorage.getItem === 'function') {
      neo4jYelpAgreement = window.localStorage.getItem('neo4j.yelp-agreement')
    }
    if (neo4jYelpAgreement === 'read-agreed') {
      yelpDatasetAgreementElement.style.display = 'none'
    } else {
      var originalHref = yelpCreateSandboxLinkElement.getAttribute('href')
      yelpCreateSandboxLinkElement.setAttribute('href', 'javascript:void(0)')
      yelpCreateSandboxLinkElement.setAttribute('target', '_self')
      yelpCreateSandboxLinkElement.classList.remove('external')
      var focusAgreementElementEvent = function () {
        var top = yelpDatasetAgreementElement.getBoundingClientRect().top + window.pageYOffset - 140
        window.scrollTo({ top: top, behavior: 'smooth' })
        yelpDatasetAgreementElement.classList.add('has-focus')
        setTimeout(function () {
          yelpDatasetAgreementElement.classList.remove('has-focus')
        }, 2000)
      }
      yelpCreateSandboxLinkElement.addEventListener('click', focusAgreementElementEvent)
      // checkbox
      var yelpDatasetAgreementInputCheckboxElement = document.createElement('input')
      yelpDatasetAgreementInputCheckboxElement.type = 'checkbox'
      yelpDatasetAgreementInputCheckboxElement.id = 'yelp-dataset-agreement-check'
      // label
      var yelpDatasetAgreementLabelElement = document.createElement('label')
      yelpDatasetAgreementLabelElement.innerHTML = '&nbsp;I have read and agree to the Dataset License'
      yelpDatasetAgreementLabelElement.setAttribute('for', 'yelp-dataset-agreement-check')
      // accept button
      var continueButtonElement = document.createElement('button')
      continueButtonElement.type = 'button'
      continueButtonElement.classList.add('button')
      continueButtonElement.innerText = 'Continue'
      continueButtonElement.addEventListener('click', function (_) {
        if (yelpDatasetAgreementInputCheckboxElement.checked) {
          if (typeof window.localStorage !== 'undefined' && typeof window.localStorage.setItem === 'function') {
            window.localStorage.setItem('neo4j.yelp-agreement', 'read-agreed')
          }
          yelpCreateSandboxLinkElement.removeEventListener('click', focusAgreementElementEvent)
          yelpCreateSandboxLinkElement.setAttribute('target', '_blank')
          yelpCreateSandboxLinkElement.setAttribute('href', originalHref)
          yelpCreateSandboxLinkElement.classList.add('external')
          yelpDatasetAgreementElement.style.display = 'none'
        }
      })
      var paragraphElement = document.createElement('p')
      paragraphElement.appendChild(yelpDatasetAgreementInputCheckboxElement)
      paragraphElement.appendChild(yelpDatasetAgreementLabelElement)
      paragraphElement.appendChild(continueButtonElement)
      yelpDatasetAgreementElement.appendChild(paragraphElement)
    }
  }
})
