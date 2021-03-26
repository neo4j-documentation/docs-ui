/* global GraphAcademy, MktoForms2 */
document.addEventListener('DOMContentLoaded', function () {
  const location = window.location
  const siteUrl = location.href

  const bodyElement = document.querySelector('body.training-certification')
  let certificationId
  if (bodyElement && bodyElement.dataset && bodyElement.dataset.certificationId) {
    certificationId = bodyElement.dataset.certificationId

    bodyElement.querySelectorAll('[data-action="logout"]').forEach(function (el) {
      el.onclick = function (event) {
        event.preventDefault()
        window.location = 'https://neo4j.com/accounts/logout/?targetUrl=' + encodeURIComponent(siteUrl)
      }
    })

    bodyElement.querySelectorAll('[data-action="signin"]').forEach(function (el) {
      el.onclick = function (event) {
        event.preventDefault()
        window.location = 'https://neo4j.com/accounts/login-b/?targetUrl=' + encodeURIComponent(siteUrl)
      }
    })

    bodyElement.querySelectorAll('[data-action="course-continue"]').forEach(function (el) {
      el.onclick = function (event) {
        event.preventDefault()
        if (certificationId && userInfo) {
          // eslint-disable-next-line max-len
          window.location = 'https://www.classmarker.com/online-test/start/?quiz=' + certificationId + '&cm_user_id=auth0|' + accessToken + '&cm_fn=' + userInfo.given_name + '&cm_ln=' + userInfo.family_name + '&cm_e' + userInfo.email
        }
      }
    })

    // eslint-disable-next-line no-inner-declarations
    function showErrorMessage (errorMessage) {
      if (!errorMessage) {
        errorMessage = 'Error while loading the data, please refresh the page.'
      }
      courseActionsElement.dataset.status = 'error'
      const errorMessageElement = courseActionsElement.querySelector('.error > p')
      errorMessageElement.innerHTML = errorMessage
    }

    let accessToken
    let userInfo
    const courseActionsElement = document.querySelector('.course-actions')
    const unauthenticatedStateElement = document.querySelector('.course-actions .course-state[data-state="unauthenticated"]')
    const authenticatedStateElement = document.querySelector('.course-actions .course-state[data-state="authenticated"]')
    const enrolledStateElement = document.querySelector('.course-actions .course-state[data-state="enrolled"]')
    // Initialize
    if (certificationId) {
      GraphAcademy.login(
        function (authResult) {
          if (authResult && authResult.accessToken && authResult.idTokenPayload) {
            // we're authenticated!
            accessToken = authResult.accessToken
            userInfo = authResult.idTokenPayload
            if (typeof MktoForms2 !== 'undefined') {
              MktoForms2.whenReady(function (form) {
                // pass our prefillFields objects into the form.vals method to fill our fields
                form.vals({
                  FirstName: userInfo.given_name,
                  LastName: userInfo.family_name,
                  Email: userInfo.email,
                })
              })
            }
            unauthenticatedStateElement.classList.add('is-hidden')
            enrolledStateElement.classList.add('is-hidden')
            // check if the enrollment is disabled
            const marketoFormId = 1255
            const marketoFormElementId = 'mktoForm_' + marketoFormId
            const marketoFormElement = document.getElementById(marketoFormElementId)
            if (marketoFormElement && marketoFormElement.dataset && marketoFormElement.dataset.disabled === 'true') {
              // enrollment is disabled!
              showErrorMessage('You cannot enroll in this course.')
              return
            }
            if (marketoFormElement && typeof MktoForms2 !== 'undefined') {
              // setTimeout is mandatory otherwise the redirect is rejected by classmarker :(
              const redirectClassMarker = function (certificationId, formValues, userInfo) {
                setTimeout(function () {
                  // eslint-disable-next-line max-len
                  window.location = 'https://www.classmarker.com/online-test/start/?quiz=' + certificationId + '&cm_user_id=' + userInfo.sub + '&cm_fn=' + formValues.FirstName + '&cm_ln=' + formValues.LastName + '&cm_e' + formValues.Email
                }, 300)
              }
              // User must register for the certification
              MktoForms2.loadForm('//go.neo4j.com', '710-RRC-335', marketoFormId, function (form) {
                // Add a text after the last name field
                const lastNameFieldRowElement = document.getElementById('LblLastName').parentElement.parentElement.parentElement
                const helpParagraphElement = document.createElement('p')
                helpParagraphElement.classList.add('help')
                helpParagraphElement.innerText = 'Name above used to generate Certificate of Completion'
                lastNameFieldRowElement.insertAdjacentElement('afterend', helpParagraphElement)
                // Update the text on the submit button to be more explicit
                const sumbitButtonElement = document.querySelector('#' + marketoFormElementId + ' .mktoButton[type="submit"]')
                sumbitButtonElement.innerHTML = 'Get Certified'
                // Add an onSuccess handler
                form.onSuccess(function (values, _) {
                  redirectClassMarker(certificationId, values, userInfo)
                })
              })
            }
            courseActionsElement.dataset.status = 'loaded'
          } else {
            console.log('Invalid response from Auth0, unable to proceed', authResult)
            showErrorMessage()
          }
        },
        function (err) {
          console.log('Unable to authenticate the user or the user is not authenticated', err)
          authenticatedStateElement.classList.add('is-hidden')
          enrolledStateElement.classList.add('is-hidden')
          courseActionsElement.dataset.status = 'loaded'
        })
    }
  }
})
