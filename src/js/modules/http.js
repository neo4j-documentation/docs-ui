/* global XMLHttpRequest */
export function jsonRequest (verb, url, data, accessToken, successCallback, errorCallback) {
  var request = new XMLHttpRequest()
  request.open(verb, url, true)
  request.setRequestHeader('Content-Type', 'application/json')
  if (accessToken) {
    request.setRequestHeader('Authorization', accessToken)
  }
  request.onload = function () {
    if (this.status >= 200 && this.status < 400) {
      successCallback && successCallback(JSON.parse(this.response))
    } else {
      // Response error
      errorCallback && errorCallback(this.response)
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

export function getRequest (url, accessToken, successCallback, errorCallback) {
  jsonRequest('GET', url, '', accessToken, successCallback, errorCallback)
}

export function postRequest (url, data, accessToken, successCallback, errorCallback) {
  jsonRequest('POST', url, data, accessToken, successCallback, errorCallback)
}
