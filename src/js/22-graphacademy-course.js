/* global GraphAcademy */
document.addEventListener('DOMContentLoaded', function () {
  // FIXME: load training modules
  var trainingModules = []

  var courseModuleName
  var bodyElement = document.querySelector('body.training')
  if (bodyElement && bodyElement && bodyElement.dataset.slug) {
    courseModuleName = bodyElement.dataset.slug
  }
  var enrollmentUrl
  if (bodyElement && bodyElement && bodyElement.dataset.enrollmentUrl) {
    enrollmentUrl = bodyElement.dataset.enrollmentUrl
  }
  var courseName
  var quizStatusLocalStorageKey
  if (bodyElement && bodyElement.dataset && bodyElement.dataset.courseName) {
    courseName = bodyElement.dataset.courseName
    quizStatusLocalStorageKey = 'com.neo4j.graphacademy.' + courseName + '.quizStatus'
  }

  var gradeQuizActionElement = document.querySelector('[data-action="grade-quiz"]')

  function updateNavigationItemsStatus (quizStatus) {
    var navItemElements = document.querySelectorAll('.nav-item[data-slug]')
    for (var i = 0; i < navItemElements.length; i++) {
      var navItemElement = navItemElements[i]
      var slug = navItemElement.dataset.slug
      navItemElement.classList.remove('is-pending', 'is-completed')
      if (quizStatus.passed.includes(slug)) {
        navItemElement.classList.add('is-completed')
      } else if (quizStatus.untried.includes(slug)) {
        navItemElement.classList.add('is-pending')
      }
    }
  }

  function updatePage (quizStatus) {
    if (quizStatus && quizStatus.passed && quizStatus.passed.indexOf(courseModuleName) !== -1) {
      gradeQuizActionElement.style.visibility = 'hidden'
      document.querySelectorAll('.checklist.answers input').forEach(function (element) {
        element.checked = element.dataset.itemComplete === '1'
      })
    }
  }

  function hideAnswers () {
    document.querySelectorAll('.checklist.answers input[data-item-complete="1"]').forEach(function (element) {
      element.checked = false
    })
  }

  function getRelatedSectionTitle (checkboxElement) {
    var currentElement = checkboxElement.parentElement
    while (currentElement !== null && currentElement.nodeType === 1) {
      if (currentElement.classList.contains('checklist') && currentElement.classList.contains('answers')) {
        var currentElementSibling = currentElement.previousElementSibling
        while (currentElementSibling !== null && currentElement.nodeType === 1) {
          if (currentElementSibling.nodeName === 'H3') {
            return currentElementSibling
          }
          currentElementSibling = currentElementSibling.previousElementSibling
        }
      }
      currentElement = currentElement.parentElement
    }
  }

  function gradeQuiz (slug) {
    if (currentQuizStatus && currentQuizStatus.passed && currentQuizStatus.passed.indexOf(slug) !== -1) {
      // already passed!
      return true
    }
    var sectionTitles = document.querySelectorAll('.quiz h3')
    for (var i = 0; i < sectionTitles.length; i++) {
      // default color
      sectionTitles[i].style.color = '#4a5568'
    }
    var checkboxElements = document.querySelectorAll('.checklist.answers input')
    var quizSuccess = true
    for (var j = 0; j < checkboxElements.length; j++) {
      var checkboxElement = checkboxElements[j]
      var mustBeChecked = checkboxElement.dataset.itemComplete === '1'
      // find the section title
      if ((mustBeChecked && !checkboxElement.checked) || (!mustBeChecked && checkboxElement.checked)) {
        var sectionTitle = getRelatedSectionTitle(checkboxElement)
        if (sectionTitle) {
          sectionTitle.style.color = '#e53e3e'
        }
        quizSuccess = false
      }
    }
    if (quizSuccess && currentQuizStatus && currentQuizStatus.passed) {
      currentQuizStatus.passed.push(slug)
      // remove the module from untried
      var untriedModuleIndex = currentQuizStatus.untried.indexOf(slug)
      if (untriedModuleIndex !== -1) {
        currentQuizStatus.untried.splice(untriedModuleIndex, 1)
      }
    }
    return quizSuccess
  }

  // Initialize
  if (courseName && courseModuleName && enrollmentUrl && quizStatusLocalStorageKey) {
    // Initial state
    var currentQuizStatus
    var quizStatus = window.localStorage.getItem(quizStatusLocalStorageKey)
    if (quizStatus) {
      currentQuizStatus = JSON.parse(quizStatus)
    } else {
      currentQuizStatus = {
        failed: [],
        passed: [],
        untried: trainingModules,
      }
    }
    updateNavigationItemsStatus(currentQuizStatus)
    hideAnswers()
    var authResult
    GraphAcademy.login(
      function (result) {
        authResult = result
        GraphAcademy.getQuizStatus(courseName, authResult.accessToken,
          function (quizStatusResponse) {
            currentQuizStatus = quizStatusResponse.quizStatus
            window.localStorage.setItem(quizStatusLocalStorageKey, JSON.stringify(currentQuizStatus))
            updateNavigationItemsStatus(currentQuizStatus)
            updatePage(currentQuizStatus)
          },
          function (err) {
            console.log('Unable to get quiz status', err)
          })
      },
      function (err) {
        console.log('Unable to authenticate the user or the user is not authenticated', err)
        console.log('Redirecting to the enrollment page...')
        window.location.href = enrollmentUrl
      }
    )
    // Action
    var downloadCertificateElement = document.querySelector('.download-certificate')
    var downloadCertificateLinkElement = document.querySelector('[data-action="download-certificate-link"]')
    if (downloadCertificateElement) {
      document.querySelectorAll('[data-action="download-certificate"]').forEach(function (el) {
        el.onclick = function (event) {
          event.preventDefault()

          downloadCertificateElement.dataset.status = 'loading'
          try {
            GraphAcademy.getClassCertificate(courseName, authResult.accessToken,
              function (response) {
                if (response.url) {
                  downloadCertificateElement.dataset.status = 'success'
                  downloadCertificateLinkElement.href = response.url
                  window.open(response.url)
                } else {
                  console.log('Unable to get the certificate, the URL is missing from the response')
                  downloadCertificateElement.dataset.status = 'error'
                }
              }, function (err) {
                console.log('Unable to get the certificate', err)
                downloadCertificateElement.dataset.status = 'error'
              })
          } catch (err) {
            downloadCertificateElement.dataset.status = 'error'
          }
        }
      })
    }
    if (gradeQuizActionElement) {
      gradeQuizActionElement.onclick = function (event) {
        event.preventDefault()

        var quizResultElement = document.getElementById('quiz-result')
        if (!quizResultElement) {
          quizResultElement = document.createElement('div')
          quizResultElement.id = 'quiz-result'
          gradeQuizActionElement.insertAdjacentElement('afterend', quizResultElement)
        }
        quizResultElement.classList.remove('is-error', 'is-success')
        var quizSuccess = gradeQuiz(courseModuleName)
        if (quizSuccess) {
          quizResultElement.classList.add('is-success')
          quizResultElement.innerHTML = '<p class="paragraph">' +
            '<strong>All good!</strong> you can advance to next section.' +
            '</p>'
        } else {
          quizResultElement.classList.add('is-error')
          quizResultElement.innerHTML = '<p class="paragraph">' +
            '<strong>Please correct errors</strong> in quiz responses above to continue. ' +
            'Questions with incorrect responses are highlighted in <i>red</i>.' +
            '</p>'
        }
        updateNavigationItemsStatus(currentQuizStatus)
        // Update quiz status
        var passed = currentQuizStatus.passed
        var failed = currentQuizStatus.failed
        GraphAcademy.setQuizStatus(courseName, passed, failed, authResult.accessToken,
          function () {
            window.localStorage.setItem(quizStatusLocalStorageKey, JSON.stringify(currentQuizStatus))
          },
          function (error) {
            // question: what should we do? display an error message to the user?
            console.error('Unable to update quiz status', error)
          })
      }
    }
  }
})
