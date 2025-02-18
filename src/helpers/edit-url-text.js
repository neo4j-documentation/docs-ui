'use strict'

const { posix: path } = require('path')

module.exports = (page) => {
  const HOSTED_GIT_REPO_RX = /^(?:https?:\/\/|.+@)(git(?:hub|lab)\.com|bitbucket\.org|pagure\.io)[/:](.+?)(?:\.git)?$/
  const repoPage = page.attributes['edit-url-repo-action'] || 'issues'
  const repoExtra = repoPage === 'issues' ? 'new' : ''
  const feedbackTitle = page.attributes['edit-url-title'] || 'Docs Feedback'
  const feedbackLabels = page.attributes['edit-url-labels'] || ''

  // text for the link is based on the edit-url-text attribute, or page theme
  const text = (page.attributes && page.attributes['edit-url-text'])
    ? page.attributes['edit-url-text']
    : (page.attributes && page.attributes.theme === 'docs')
      ? 'Raise an issue'
      : 'Edit this page'

  // url for docs can be derived from page.editUrl
  // and updated to link to the repo issues page
  // for other themes, page.editUrl is used
  let url = page.editUrl
  if (page.attributes && page.attributes.theme === 'docs') {
    const match = url.match(HOSTED_GIT_REPO_RX)
    const editDetails = match[2].split('/')
    let query = `?title=${feedbackTitle}: ${path.join(...editDetails.slice(4))} (ref: ${editDetails[3]})`
    query += feedbackLabels !== '' ? `&labels=${feedbackLabels}` : ''
    url = 'https://' + path.join(match[1], editDetails[0], editDetails[1], repoPage, repoExtra, query)
  }

  return {
    text: text,
    url: encodeURI(url),
  }
}
