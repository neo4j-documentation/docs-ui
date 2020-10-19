'use strict'

module.exports = (category, { data: { root } }) => {
  const { contentCatalog } = root
  const tagsPerCategory = contentCatalog.getPages()
    .filter((page) =>
      page.src.component === 'kb' &&
      page.asciidoc &&
      page.asciidoc.attributes &&
      page.asciidoc.attributes.tags &&
      page.src.basename !== 'index.adoc'
    )
    .reduce((acc, page) => {
      // category must be a single value
      const category = page.asciidoc.attributes.category.split(',')[0].trim().toLowerCase()
      let tags
      if (category in acc) {
        tags = acc[category]
      } else {
        tags = []
        acc[category] = tags
      }
      tags.push(...page.asciidoc.attributes.tags.trim().split(',').map((value) => value.trim().toLowerCase()))
      return acc
    }, {})
  const allTags = Object.entries(tagsPerCategory).map(([_, value]) => value).flat().sort()
  const counts = {}
  allTags.forEach((value) => {
    counts[value] = counts[value] ? counts[value] + 1 : 1
  })
  let uniqueTags
  if (typeof category !== 'undefined') {
    uniqueTags = [...new Set(tagsPerCategory[category])]
  } else {
    uniqueTags = [...new Set(allTags)]
  }
  return uniqueTags
    .map((tag) => ({ name: tag, count: counts[tag] }))
    .sort((a, b) => b.count - a.count)
    .splice(0, Math.min(uniqueTags.length, 5))
}
