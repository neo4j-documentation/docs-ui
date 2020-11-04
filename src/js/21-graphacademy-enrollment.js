/* global GraphAcademy */
document.addEventListener('DOMContentLoaded', function () {
  var location = window.location
  var siteUrl = location.href

  var bodyElement = document.querySelector('body.training.training-enrollment')
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

  document.querySelectorAll('[data-action="course-enroll"]').forEach(function (el) {
    el.onclick = function (event) {
      event.preventDefault()
      var firstName = document.getElementById('lastname').value
      var lastName = document.getElementById('firstname').value
      courseActionsElement.dataset.status = 'loading'
      GraphAcademy.enrollStudentInClass(courseName, firstName, lastName, accessToken,
        function (response) {
          console.log('Successfully enrolled the student', response)
          // redirect the student to the first page of the course
          var courseContinueElement = document.querySelector('[data-action="course-continue"]')
          window.location = courseContinueElement.dataset.courseUrl
        },
        function (err) {
          console.log('Unable to enroll the student', err)
          courseActionsElement.dataset.status = 'error'
        })
    }
  })

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
          // var userInfo = authResult.idTokenPayload
          // var givenName = userInfo.given_name || null
          // QUESTION: should we send tracking data to Intercom and Mixpanel?
          GraphAcademy.getEnrollmentForClass(courseName, accessToken,
            function (response) {
              if (response.enrolled) {
                console.log('Student is enrolled, showing a continue button')
                unauthenticatedStateElement.classList.add('is-hidden')
                authenticatedStateElement.classList.add('is-hidden')
                // QUESTION: should we show a welcome message?
              } else {
                console.log('Student is not enrolled, showing a form to enroll')
                unauthenticatedStateElement.classList.add('is-hidden')
                enrolledStateElement.classList.add('is-hidden')
              }
              courseActionsElement.dataset.status = 'loaded'
            },
            function (err) {
              console.log('Unable to get enrollment for the student', err)
              courseActionsElement.dataset.status = 'error'
            })
        } else {
          console.log('Invalid response from Auth0, unable to proceed', authResult)
          courseActionsElement.dataset.status = 'error'
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
