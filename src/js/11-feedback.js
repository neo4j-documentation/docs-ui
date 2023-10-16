const { getCookie } = require('./modules/cookies')
const URL = 'https://uglfznxroe.execute-api.us-east-1.amazonaws.com/dev/Feedback'

/* global fetch */
;(function () {
  'use strict'

  /*let updateUserJourney = function() {
    JSON.parse(localStorage.getItem('userJourney'))
    if (journey == null) journey = []
    journey.push({
      url: window.location.href,
      title: document.title,
      landTime: Math.round(Date.now() / 1000),
    })
    localStorage.setItem('userJourney', JSON.stringify(journey))
  }
  updateUserJourney()*/

  var feedback = document.querySelector('.feedback')
  if (!feedback) return

  var original = feedback.innerHTML

  var edit = ''
  /*var editLink = document.querySelector('.edit-this-page a')

  if (editLink) {
    edit = ' <a href="' + editLink.getAttribute('href') + '" target="_blank">Edit this page</a>'
  }*/

  var sendRequest = function (parameters) {
    const identity = getCookie('neo_identity')
    const gid = getCookie('_gid')
    const uetsid = getCookie('_uetsid')

    // Get Project
    var productTag = document.querySelector('meta[property="neo:product"]')
    var project = productTag
      ? productTag.getAttribute('content').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : document.querySelector('body').className.replace('article ', '').split(' ')[0]

    var body = 'project=' + encodeURIComponent(project)
    body += '&url=' + encodeURIComponent(window.location.href)

    if (identity) {
      body += '&identity=' + identity
    }
    if (gid) {
      body += '&gid=' + gid
    }
    if (uetsid) {
      body += '&uetsid=' + uetsid
    }

    for (const [paramKey, paramVal] of Object.entries(parameters)) {
      body += '&' + paramKey + '=' + encodeURIComponent(paramVal)
    }

    //body += '&userJourney=' + encodeURIComponent(localStorage.getItem('userJourney').toString())

    //console.log(body)
    fetch(URL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    })
    //localStorage.removeItem('userJourney')
  }

  var isHelpful = function () {
    feedback.classList.add('positive')
    feedback.style.height = null
    feedback.innerHTML = `<form class="form">
      <div class="header">
        <p><strong>Thank you! Would you like to share some feedback?</strong></p>
        <svg width="14px" height="22px" viewBox="0 0 22 22" role="button" class="cancel" aria-label="Cancel Feedback">
          <line x1="19.5833333" y1="0.416666667" x2="0.416666667" y2="19.5833333"></line>
          <line x1="19.5833333" y1="19.5833333" x2="0.416666667" y2="0.416666667"></line>
        </svg>
      </div>
      <div class="more-information">
        <label for="more-information"><strong>More information</strong></label>
        <textarea id="more-information" type="text" rows="3" cols="50" name="more-information" style="resize:none"></textarea>
      </div>
      <div class="buttons">
        <input type="button" class="primary" data-submit="submit" value="Submit feedback">
        <!--<input type="button" class="secondary" data-submit="skip" value="Skip">-->
      </div>
    </form>
    `

    feedback.querySelector('.cancel').addEventListener('click', function (e) {
      e.preventDefault()
      sendRequest({ helpful: true }) // get positive feedback even if thet bail out before completion
      //localStorage.removeItem('userJourney')
      reset()
    })

    feedback.querySelector('.primary').addEventListener('click', function (e) {
      e.preventDefault()

      var moreInformation = feedback.querySelector('textarea[name="more-information"]').value

      sendRequest({
        helpful: true,
        moreInformation: moreInformation,
      })
      //localStorage.removeItem('userJourney')
      feedback.innerHTML = '<div class="header thank-you-positive"><p><strong>Thank you for your feedback!</strong></p></div>'
      setTimeout(() => { fadeOut(feedback, 50) }, 2000)

      if (window.mixpanel) {
        window.mixpanel.track('DOCS_FEEDBACK_POSITIVE', {
          pathname: window.location.origin + window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        })
      }
    })
  }

  var isUnhelpful = function () {
    feedback.classList.add('negative')
    feedback.style.height = null
    feedback.innerHTML = `<form class="form">
      <div class="header">
        <p><strong>How is this page unhelpful?</strong></p>
        <svg width="14px" height="22px" viewBox="0 0 22 22" role="button" class="cancel" aria-label="Cancel Feedback">
          <line x1="19.5833333" y1="0.416666667" x2="0.416666667" y2="19.5833333"></line>
          <line x1="19.5833333" y1="19.5833333" x2="0.416666667" y2="0.416666667"></line>
        </svg>
      </div>
      <div>
        <input id="missing" type="radio" class="feedback-option" data-reason="missing" name="specific" value="missing" checked="true"><label
          for="missing">Missing information</label>
      </div>
      <div>
        <input id="hard-to-follow" type="radio" class="feedback-option" data-reason="hard-to-follow" name="specific" value="hard-to-follow">
        <label for="hard-to-follow">Hard to follow or confusing</label>
      </div>
      <div>
        <input id="inaccurate" type="radio" class="feedback-option" data-reason="inaccurate" name="specific" value="inaccurate">
        <label for="inaccurate">Inaccurate, out of date, or doesn&rsquo;t work</label>
      </div>
      <div><input id="other" type="radio" class="feedback-option" data-reason="other" name="specific" value="other"><label for="other">Something else
          ${edit}</label></div>
      <div class="more-information"><label for="more-information"><strong>More information *</strong></label><textarea
          id="more-information" type="text" rows="3" cols="50" name="more-information" style="resize:none"></textarea>
      </div>
      <div class="buttons"><input type="button" class="primary" data-submit="submit" value="Submit feedback"></div>
      </div>
    </form>
    `

    var thankyou = `<div class="header thank-you-positive">
      <p><strong>Thank you!</strong></p>
      <p>We will consider your feedback while updating our documentation.</p>
    `

    /*if (editLink) {
      thankyou += '<p>You can also help us by ' + edit.replace('Edit', 'editing') + '.</p></div>'
    }*/

    feedback.querySelector('.cancel').addEventListener('click', function (e) {
      e.preventDefault()

      if (window.mixpanel) {
        window.mixpanel.track('DOCS_FEEDBACK_NEGATIVE', {
          pathname: window.location.origin + window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        })
      }

      reset()
    })

    feedback.querySelector('.primary').addEventListener('click', function (e) {
      // check more information not empty
      var moreInformation = feedback.querySelector('textarea[name="more-information"]')
      if (moreInformation.value === '') {
        if (feedback.querySelector('p[class="error"]')) return //stubborn people
        const error = document.createElement('p')
        error.classList.add('error')
        error.innerHTML = 'Please elaborate on your feedback.'
        feedback.querySelector('div[class="more-information"]')
          .insertAdjacentElement('afterend', error)
        /*setIntervalX(function() {  // fadeOut is async, so the element never comes back
          fadeOut(moreInformation, 50);
          moreInformation.style.display = null
        }, 1000, 1);*/
        return
      }

      e.preventDefault()

      var reason = feedback.querySelector('input[name="specific"]:checked')

      sendRequest({
        helpful: false,
        reason: reason.value,
        moreInformation: moreInformation.value,
      })
      feedback.innerHTML = thankyou
      //localStorage.removeItem('userJourney')

      feedback.classList.remove('negative')
      feedback.classList.add('positive')
      setTimeout(() => { fadeOut(feedback, 50) }, 2000)

      if (window.mixpanel) {
        window.mixpanel.track('DOCS_FEEDBACK_POSITIVE', {
          pathname: window.location.origin + window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        })
      }
    })

    /*feedback.querySelector('.secondary').addEventListener('click', function (e) {
      e.preventDefault()

      var reason = feedback.querySelector('input[name="specific"]:checked').value
      var moreInformation = feedback.querySelector('textarea[name="more-information"]').value

      sendRequest({
        'helpful': false,
        'reason': reason,
        'moreInformation': moreInformation,
      })
      feedback.innerHTML = thankyou

      if (window.mixpanel) {
        window.mixpanel.track('DOCS_FEEDBACK_SKIP', {
          pathname: window.location.origin + window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        })
      }
    })*/
  }

  var reset = function () {
    feedback.classList.remove('negative')
    feedback.classList.remove('positive')
    feedback.innerHTML = original
    feedback.style.height = 'var(--feedback-height)'

    var yes = feedback.querySelector('.yes')
    var no = feedback.querySelector('.no')

    yes.addEventListener('click', function (e) {
      e.preventDefault()

      isHelpful()
    })

    no.addEventListener('click', function (e) {
      e.preventDefault()

      isUnhelpful()
    })
  }

  window.addEventListener('scroll', function (event) {
    var position = window.scrollY
    var windowHeight = window.innerHeight
    var footerOffset = document.getElementsByTagName('footer')[0].offsetTop

    if (position + windowHeight > footerOffset) {
      feedback.classList.add('absolute')
    } else {
      feedback.classList.remove('absolute')
    }
  })

  reset()
})()

function fadeOut (element, speed) {
  var op = 1 // initial opacity
  var timer = setInterval(function () {
    if (op <= 0.1) {
      clearInterval(timer)
      element.style.display = 'none'
      element.style.opacity = null
    }
    element.style.opacity = op
    element.style.filter = 'alpha(opacity=' + op * 100 + ')'
    op -= op * 0.1
  }, speed)

  // enlarge navigation to fill hole left by feedback widget faded out
  document.documentElement.style.setProperty('--feedback-height', '0rem')
}

/*function setIntervalX(callback, delay, repetitions) {
  var x = 0;
  var intervalID = window.setInterval(function () {

     callback();

     if (++x === repetitions) {
         window.clearInterval(intervalID);
     }
  }, delay);
}*/
