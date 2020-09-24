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
      console.log('Click on data-action="logout"', el)
      window.location = 'https://neo4j.com/accounts/logout/?targetUrl=' + encodeURIComponent(siteUrl)
    }
  })

  document.querySelectorAll('[data-action="signin"]').forEach(function (el) {
    el.onclick = function (event) {
      event.preventDefault()
      console.log('Click on data-action="signin"', el)
      window.location = 'https://neo4j.com/accounts/login-b/?targetUrl=' + encodeURIComponent(siteUrl)
    }
  })

  document.querySelectorAll('[data-action="course-continue"]').forEach(function (el) {
    el.onclick = function (event) {
      event.preventDefault()
      console.log('Click on data-action="course-continue"', el)
      if (el.dataset && el.dataset.courseUrl) {
        window.location = el.dataset.courseUrl
      }
    }
  })

  document.querySelectorAll('[data-action="course-register"]').forEach(function (el) {
    el.onclick = function (event) {
      event.preventDefault()
      console.log('Show the enrollment form')
    }
  })

  var courseActionsElement = document.querySelector('.course-actions')
  var logoutButtonElement = document.querySelector('.button-logout')
  var signinButtonElement = document.querySelector('.button-signin')
  var courseRegisterButtonElement = document.querySelector('.button-course-register')
  var courseContinueButtonElement = document.querySelector('.button-course-continue')
  // Initialize
  if (courseName) {
    GraphAcademy.login(
      function (authResult) {
        if (authResult && authResult.accessToken && authResult.idTokenPayload) {
          // we're authenticated!
          var accessToken = authResult.accessToken
          // var userInfo = authResult.idTokenPayload
          // var givenName = userInfo.given_name || null
          // QUESTION: should we send tracking data to Intercom and Mixpanel?
          GraphAcademy.getEnrollmentForClass(courseName, accessToken,
            function (response) {
              if (response.enrolled) {
                console.log('User is enrolled')
                signinButtonElement.classList.add('is-hidden')
                courseRegisterButtonElement.classList.add('is-hidden')
                // TODO: show a welcome message
              } else {
                // TODO: show register button to enroll
                console.log('User is not enrolled, show a button to register/enroll')
                signinButtonElement.classList.add('is-hidden')
                courseContinueButtonElement.classList.add('is-hidden')
              }
              courseActionsElement.dataset.status = 'loaded'
            },
            function (err) {
              console.log('Unable to get enrollment for the user', err)
              courseActionsElement.dataset.status = 'error'
            })
        } else {
          console.log('Invalid response from Auth0, unable to proceed', authResult)
          courseActionsElement.dataset.status = 'error'
        }
      },
      function (err) {
        console.info('Unable to authenticate the user or the user is not authenticated', err)
        logoutButtonElement.classList.add('is-hidden')
        courseRegisterButtonElement.classList.add('is-hidden')
        courseContinueButtonElement.classList.add('is-hidden')
        courseActionsElement.dataset.status = 'loaded'
      })
  }
})
