;(function(project) {
  'use strict'

  var url = 'https://uglfznxroe.execute-api.us-east-1.amazonaws.com/dev/Feedback'
  var feedback = document.querySelector('.feedback')
  if ( !feedback ) return;

  var original = feedback.innerHTML

  var edit = ''
  var editLink = document.querySelector('.edit-this-page a')

  if ( editLink ) {
    edit = ' <a href="'+ editLink.getAttribute('href') +'" target="_blank">Edit this page</a>';
  }

  var sendFeedback = function(helpful, reason, moreInformation) {
    // Get Project
    var productTag = document.querySelector('meta[name=product]')
    var project =  productTag ? productTag.getAttribute('content').toLowerCase().replace(/[^a-z0-9]+/g,'-') : document.querySelector('body').className.replace('article ', '').split(' ')[0]


    var body = 'project=' + encodeURIComponent(project)
    body += '&url='+ encodeURIComponent(window.location.href)
    body += '&helpful='+ helpful.toString()

    if ( !helpful ) {
      body += '&reason='+ encodeURIComponent(reason)

      if ( moreInformation ) {
        body += '&moreInformation='+ encodeURIComponent(moreInformation)
      }
    }

    fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body
    })
  }

  var isHelpful = function() {
    sendFeedback(true)

    feedback.classList.add('positive')

    feedback.innerHTML = '<div class="header thank-you-positive"><p><strong>Thank you for your feedback!</strong></p></div>'
  }

  var isUnhelpful = function() {
    feedback.classList.add('negative')
    feedback.innerHTML = '<form class="form"><div class="header"><p><strong>We&rsquo;re sorry to hear that. How could we improve this page?</strong></p><svg width="14px" height="22px" viewBox="0 0 22 22" role="button" class="cancel" aria-label="Cancel Feedback"><line x1="19.5833333" y1="0.416666667" x2="0.416666667" y2="19.5833333" ></line><line x1="19.5833333" y1="19.5833333" x2="0.416666667" y2="0.416666667" ></line></svg></div><div><input id="missing" type="radio" data-reason="missing" name="specific" value="missing" checked="true"><label for="missing">It has missing information</label></div><div><input id="hard-to-follow" type="radio" data-reason="hard-to-follow" name="specific" value="hard-to-follow"><label for="hard-to-follow">It&rsquo;s hard to follow or confusing</label></div><div><input id="inaccurate" type="radio" data-reason="inaccurate" name="specific" value="inaccurate"><label for="inaccurate">It&rsquo;s inaccurate, out of date, or doesn&rsquo;t work</label></div><div><input id="other" type="radio" data-reason="other" name="specific" value="other"><label for="other">Something else'+ edit +'</label></div><div class="more-information"><label for="more-information"><strong>More information</strong></label><textarea id="more-information" type="text" rows="3" cols="50" name="more-information" style="resize:none"></textarea></div><div class="buttons"><input type="button" class="primary" data-submit="submit" value="Submit feedback"><input type="button" class="secondary" data-submit="skip" value="Skip"></div></div>'

    var thankyou = '<div class="header thank-you-positive"><p><strong>Thank you for your feedback!</strong></p><p>We will take this information into account while updating our documentation.</p><p>You can also help us by '+ edit.replace('Edit', 'editing')+'.</p></div>'

    feedback.querySelector('.cancel').addEventListener('click', function(e) {
      e.preventDefault()

      reset()
    })

    feedback.querySelector('.primary').addEventListener('click', function(e) {
      feedback.classList.remove('negative')
      feedback.classList.add('positive')

      e.preventDefault()

      var reason = feedback.querySelector('input[name="specific"]:checked').value
      var moreInformation = feedback.querySelector('textarea[name="more-information"]').value

      sendFeedback(false, reason, moreInformation)
      feedback.innerHTML = thankyou
    })

    feedback.querySelector('.secondary').addEventListener('click', function(e) {
      e.preventDefault()

      var reason = feedback.querySelector('input[name="specific"]:checked').value
      var moreInformation = feedback.querySelector('textarea[name="more-information"]').value

      sendFeedback(false, reason, moreInformation)
      feedback.innerHTML = thankyou
    })
  }

  var reset = function() {
    feedback.classList.remove('negative')
    feedback.classList.remove('positive')
    feedback.innerHTML = original

    var yes = feedback.querySelector('.yes')
    var no = feedback.querySelector('.no')

    yes.addEventListener('click', function(e) {
      e.preventDefault()

      isHelpful()
    })

    no.addEventListener('click', function(e) {
      e.preventDefault()

      isUnhelpful()
    })
  }

  window.addEventListener('scroll', function(event) {
    var position = window.scrollY
    var windowHeight = window.innerHeight
    var footerOffset = document.getElementsByTagName('footer')[0].offsetTop

    if ( position + windowHeight > footerOffset ) {
      feedback.classList.add('absolute')
      feedback.style.top = (footerOffset - feedback.clientHeight) + 'px'
      feedback.style.bottom = 'auto'
    }
    else {
      feedback.classList.remove('absolute')
      feedback.style.top = 'auto'
      feedback.style.bottom = '0px'
    }
  })

  reset()
})()