module.exports = (page) => {
  const metadata = {}
  if (page.asciidoc && page.asciidoc.attributes) {
    metadata['neo4j-versions'] = page.asciidoc.attributes['neo4j-versions']
    metadata.author = page.asciidoc.attributes.author
    metadata.category = page.asciidoc.attributes.category
    metadata.tags = page.asciidoc.attributes.tags
  }
  return metadata
}
