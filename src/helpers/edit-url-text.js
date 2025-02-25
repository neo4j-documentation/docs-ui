'use strict'

const { posix: path } = require('path')

module.exports = (page) => {
  const HOSTED_GIT_REPO_RX = /^(?:https?:\/\/|.+@)(git(?:hub|lab)\.com|bitbucket\.org|pagure\.io)[/:](.+?)(?:\.git)?$/
  const repoPage = page.attributes['edit-url-repo-action'] || 'issues'
  const repoExtra = repoPage === 'issues' ? 'new' : ''
  const feedbackTitle = page.attributes['edit-url-title'] || 'Docs Feedback'
  const feedbackBody = page.attributes['edit-url-body'] || '> Do not include confidential information, personal data, sensitive data, or other regulated data.'
  const feedbackLabels = page.attributes['edit-url-labels'] || ''
  let url = page.attributes['edit-url-uri'] || page.editUrl

  // text for the link is based on the edit-url-text attribute, or page theme
  const text = (page.attributes && page.attributes['edit-url-text'])
    ? page.attributes['edit-url-text']
    : (page.attributes && page.attributes.theme === 'docs')
      ? 'Raise an issue'
      : 'Edit this page'

  // url for docs can be derived from page.editUrl
  // and updated to link to the repo issues page
  // for other themes, page.editUrl is used
  const match = url.match(HOSTED_GIT_REPO_RX)
  if (page.attributes && page.attributes.theme === 'docs' && match) {
    const editDetails = match[2].split('/')
    const issueParts = {
      title: {
        text: feedbackTitle,
        path: editDetails.slice(4) ? path.join(...editDetails.slice(4)) : '',
        ref: editDetails[3] ? `(ref: ${editDetails[3]})` : '',
      },
      query: {
        body: feedbackBody !== '' ? feedbackBody : '',
        labels: feedbackLabels !== '' ? feedbackLabels : '',
      },
    }

    // construct issue content
    const issueTitle = '?title=' + Object.values(issueParts.title).join(' ')

    // construct query params
    const issueQuery = Object.keys(issueParts.query).map((key) => {
      if (issueParts.query[key] !== '') return `&${key}=${issueParts.query[key]}`
    }).join('')

    url = 'https://' + path.join(match[1], editDetails[0], editDetails[1], repoPage, repoExtra, issueTitle + issueQuery)
  }

  return {
    text: text,
    url: encodeURI(url),
  }
}
