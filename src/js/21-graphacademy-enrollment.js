/* global GraphAcademy, MktoForms2 */
document.addEventListener('DOMContentLoaded', function () {
  var location = window.location
  var siteUrl = location.href

  var bodyElement = document.querySelector('body.training-enrollment')
  var courseName
  if (bodyElement && bodyElement.dataset && bodyElement.dataset.courseName) {
    courseName = bodyElement.dataset.courseName
  }

  document.querySelectorAll('[data-action="logout"]').forEach(function (el) {
    el.onclick = function (event) {
      event.preventDefault()
      window.location = 'https://neo4j.com/accounts/logout/?targetUrl=' + encodeURIComponent(siteUrl)
    }
  })

  document.querySelectorAll('[data-action="signin"]').forEach(function (el) {
    el.onclick = function (event) {
      event.preventDefault()
      window.location = 'https://neo4j.com/accounts/login-b/?targetUrl=' + encodeURIComponent(siteUrl)
    }
  })

  document.querySelectorAll('[data-action="course-continue"]').forEach(function (el) {
    el.onclick = function (event) {
      event.preventDefault()
      if (el.dataset && el.dataset.courseUrl) {
        window.location = el.dataset.courseUrl
      }
    }
  })

  function showErrorMessage (errorMessage) {
    if (!errorMessage) {
      errorMessage = 'Error while loading the data, please refresh the page.'
    }
    courseActionsElement.dataset.status = 'error'
    var errorMessageElement = courseActionsElement.querySelector('.error > p')
    errorMessageElement.innerHTML = errorMessage
  }

  var accessToken
  var courseActionsElement = document.querySelector('.course-actions')
  var unauthenticatedStateElement = document.querySelector('.course-actions .course-state[data-state="unauthenticated"]')
  var authenticatedStateElement = document.querySelector('.course-actions .course-state[data-state="authenticated"]')
  var enrolledStateElement = document.querySelector('.course-actions .course-state[data-state="enrolled"]')
  // Initialize
  if (courseName) {
    GraphAcademy.login(
      function (authResult) {
        if (authResult && authResult.accessToken && authResult.idTokenPayload) {
          // we're authenticated!
          accessToken = authResult.accessToken
          var userInfo = authResult.idTokenPayload
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
                console.log('Student is not enrolled, showing a form to enroll')
                unauthenticatedStateElement.classList.add('is-hidden')
                enrolledStateElement.classList.add('is-hidden')
                if (typeof MktoForms2 !== 'undefined') {
                  MktoForms2.loadForm('//go.neo4j.com', '710-RRC-335', 1422, function (form) {
                    // Add a text after the last name field
                    var lastNameFieldRowElement = document.getElementById('LblLastName').parentElement.parentElement.parentElement
                    var helpParagraphElement = document.createElement('p')
                    helpParagraphElement.classList.add('help')
                    helpParagraphElement.innerText = 'Name above used to generate Certificate of Completion'
                    lastNameFieldRowElement.insertAdjacentElement('afterend', helpParagraphElement)
                    // Update the text on the submit button to be more explicit
                    var sumbitButtonElement = document.querySelector('#mktoForm_1422 .mktoButton[type="submit"]')
                    sumbitButtonElement.innerHTML = 'Enroll in Course'
                    // Add an onSuccess handler
                    form.onSuccess(function (values, _) {
                      courseActionsElement.dataset.status = 'loading'
                      GraphAcademy.enrollStudentInClass(courseName, values.FirstName, values.LastName, accessToken,
                        function (response) {
                          console.log('Successfully enrolled the student', response)
                          // redirect the student to the first page of the course
                          var formElement = document.getElementById(form.getId())
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
})
