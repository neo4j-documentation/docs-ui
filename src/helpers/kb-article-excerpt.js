const cheerio = require('cheerio')

const generateExcerpt = (page) => {
  const $ = cheerio.load(page.contents.toString())
  // removes tables, images and source block
  $('table').remove()
  $('img').remove()
  $('pre').remove()
  $('iframe').remove()
  const $article = $('article.doc > .sect1:nth-child(2)')
  let text = $article.length === 1 ? $article.text() : $.text()
  text = text.trim()
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
  let words = text.split(' ')
  let excerpt
  if (words.length > 30) {
    words = words.slice(0, 30)
    excerpt = words.join(' ') + '…'
  } else {
    excerpt = words.join(' ')
  }
  return excerpt
}

module.exports = (page) => {
  return page.asciidoc && page.asciidoc.attributes && page.asciidoc.attributes.excerpt
    ? page.asciidoc.attributes.excerpt
    : generateExcerpt(page)
}
