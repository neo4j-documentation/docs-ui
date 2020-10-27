/* global WebAuth, XMLHttpRequest */
if (typeof WebAuth !== 'undefined') {
  ;(function (WebAuth, XMLHttpRequest) {
    'use strict'

    // constants
    var backendBaseUrl = 'https://nmae7t4ami.execute-api.us-east-1.amazonaws.com/prod'
    var location = window.location
    var locationHref = location.href

    // configure Auth0
    var redirectUri
    if (location.hostname === 'localhost') {
      // local testing
      redirectUri = location.origin + '/accounts/callback'
    } else {
      redirectUri = location.origin + '/accounts/login'
    }
    var webAuth = new WebAuth({
      clientID: 'hoNo6B00ckfAoFVzPTqzgBIJHFHDnHYu',
      domain: 'login.neo4j.com',
      redirectUri: redirectUri,
      audience: 'neo4j://accountinfo/',
      scope: 'read:account-info openid email profile user_metadata',
      responseType: 'token id_token',
    })

    // login / logout
    var logout = function () {
      window.location = 'http://neo4j.com/accounts/login-b/?targetUrl=' + encodeURI(locationHref)
    }
    var login = function (successCallback, errorCallback) {
      try {
        webAuth.checkSession({}, function (err, result) {
          if (err) {
            errorCallback(err)
            return
          }
          successCallback(result)
        })
      } catch (err) {
        errorCallback(err)
      }
    }

    // GraphAcademy API
    function jsonRequest (verb, url, data, accessToken, successCallback, errorCallback) {
      var request = new XMLHttpRequest()
      request.open(verb, url, true)
      request.setRequestHeader('Content-Type', 'application/json')
      request.setRequestHeader('Authorization', accessToken)
      request.onload = function () {
        if (this.status >= 200 && this.status < 400) {
          successCallback(JSON.parse(this.response))
        } else {
          // Response error
          errorCallback(this.response)
        }
      }
      request.onerror = function (e) {
        // Connection error
        errorCallback(e)
      }
      if (data) {
        request.send(JSON.stringify(data))
      } else {
        request.send()
      }
    }

    function getRequest (url, accessToken, successCallback, errorCallback) {
      jsonRequest('GET', url, '', accessToken, successCallback, errorCallback)
    }

    function postRequest (url, data, accessToken, successCallback, errorCallback) {
      jsonRequest('POST', url, data, accessToken, successCallback, errorCallback)
    }

    function setQuizStatus (className, passed, failed, accessToken, successCallback, errorCallback) {
      var data = {
        className: className,
        passed: passed,
        failed: failed,
      }
      var url = backendBaseUrl + '/setQuizStatus'
      postRequest(url, data, accessToken, successCallback, errorCallback)
    }

    function getQuizStatus (className, accessToken, successCallback, errorCallback) {
      var url = backendBaseUrl + '/getQuizStatus?className=' + className
      getRequest(url, accessToken, successCallback, errorCallback)
    }

    function getClassCertificate (className, accessToken, successCallback, errorCallback) {
      var data = { className: className }
      var url = backendBaseUrl + '/genClassCertificate'
      postRequest(url, data, accessToken, successCallback, errorCallback)
    }

    function getEnrollmentForClass (className, accessToken, successCallback, errorCallback) {
      var url = backendBaseUrl + '/getClassEnrollment?className=' + className
      getRequest(url, accessToken, successCallback, errorCallback)
    }

    function enrollStudentInClass (className, firstName, lastName, accessToken, successCallback, errorCallback) {
      var data = {
        className: className,
        firstName: firstName,
        lastName: lastName,
      }
      var url = backendBaseUrl + '/setClassEnrollment'
      postRequest(url, data, accessToken, successCallback, errorCallback)
    }

    window.GraphAcademy = {
      logout: logout,
      login: login,
      getQuizStatus: getQuizStatus,
      setQuizStatus: setQuizStatus,
      getClassCertificate: getClassCertificate,
      getEnrollmentForClass: getEnrollmentForClass,
      enrollStudentInClass: enrollStudentInClass,
    }
  })(WebAuth, XMLHttpRequest)
}
