/* global GraphAcademy, MktoForms2 */
document.addEventListener('DOMContentLoaded', function () {
  const location = window.location
  const siteUrl = location.href

  const bodyElement = document.querySelector('body.training-enrollment')
  if (bodyElement && bodyElement.dataset && bodyElement.dataset.courseName) {
    const courseName = bodyElement.dataset.courseName

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
        if (el.dataset && el.dataset.courseUrl) {
          window.location = el.dataset.courseUrl
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
    const courseActionsElement = document.querySelector('.course-actions')
    const unauthenticatedStateElement = document.querySelector('.course-actions .course-state[data-state="unauthenticated"]')
    const authenticatedStateElement = document.querySelector('.course-actions .course-state[data-state="authenticated"]')
    const enrolledStateElement = document.querySelector('.course-actions .course-state[data-state="enrolled"]')
    // Initialize
    if (courseName) {
      GraphAcademy.login(
        function (authResult) {
          if (authResult && authResult.accessToken && authResult.idTokenPayload) {
            // we're authenticated!
            accessToken = authResult.accessToken
            const userInfo = authResult.idTokenPayload
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
            GraphAcademy.getEnrollmentForClass(courseName, accessToken,
              function (response) {
                if (response.enrolled) {
                  console.log('Student is enrolled, showing a continue button')
                  unauthenticatedStateElement.classList.add('is-hidden')
                  authenticatedStateElement.classList.add('is-hidden')
                } else {
                  unauthenticatedStateElement.classList.add('is-hidden')
                  enrolledStateElement.classList.add('is-hidden')
                  // check if the enrollment is disabled
                  const marketoFormId = 1422
                  const marketoFormElementId = 'mktoForm_' + marketoFormId
                  const marketoFormElement = document.getElementById(marketoFormElementId)
                  if (marketoFormElement && marketoFormElement.dataset && marketoFormElement.dataset.disabled === 'true') {
                    // enrollment is disabled!
                    showErrorMessage('You cannot enroll in this course.')
                    return
                  }
                  if (marketoFormElement && typeof MktoForms2 !== 'undefined') {
                    console.log('Student is not enrolled, showing a form to enroll')
                    MktoForms2.loadForm('//go.neo4j.com', '710-RRC-335', marketoFormId, function (form) {
                      // Add a text after the last name field
                      const lastNameFieldRowElement = document.getElementById('LblLastName').parentElement.parentElement.parentElement
                      const helpParagraphElement = document.createElement('p')
                      helpParagraphElement.classList.add('help')
                      helpParagraphElement.innerText = 'Name above used to generate Certificate of Completion'
                      lastNameFieldRowElement.insertAdjacentElement('afterend', helpParagraphElement)
                      // Update the text on the submit button to be more explicit
                      const sumbitButtonElement = document.querySelector('#' + marketoFormElementId + ' .mktoButton[type="submit"]')
                      sumbitButtonElement.innerHTML = 'Enroll in Course'
                      // Add an onSuccess handler
                      form.onSuccess(function (values, _) {
                        courseActionsElement.dataset.status = 'loading'
                        GraphAcademy.enrollStudentInClass(courseName, values.FirstName, values.LastName, accessToken,
                          function (response) {
                            console.log('Successfully enrolled the student', response)
                            // redirect the student to the first page of the course
                            const formElement = document.getElementById(marketoFormElementId)
                            if (formElement && formElement.dataset && formElement.dataset.courseUrl) {
                              window.location = formElement.dataset.courseUrl
                            } else {
                              showErrorMessage('<strong>Sorry, something has gone wrong.</strong> ' +
                                'We were unable to proceed, please refresh the page.')
                            }
                          },
                          function (err) {
                            console.log('Unable to enroll the student', err)
                            showErrorMessage('<strong>Sorry, something has gone wrong.</strong> ' +
                              'Please refresh the page and try again.')
                          })
                        return false
                      })
                    })
                  } else {
                    showErrorMessage('<strong>Sorry, something has gone wrong.</strong> ' +
                      'Some browser features like Firefox\'s Enhanced Tracking Protection prevent the training from working properly.<br/>' +
                      'Please try a different browser or turn of ETP.')
                  }
                }
                courseActionsElement.dataset.status = 'loaded'
              },
              function (err) {
                console.log('Unable to get enrollment for the student', err)
                showErrorMessage()
              })
          } else {
            console.log('Invalid response from Auth0, unable to proceed', authResult)
            showErrorMessage()
          }
        },
        function (err) {
          console.info('Unable to authenticate the user or the user is not authenticated', err)
          authenticatedStateElement.classList.add('is-hidden')
          enrolledStateElement.classList.add('is-hidden')
          courseActionsElement.dataset.status = 'loaded'
        })
    }
  }
})
