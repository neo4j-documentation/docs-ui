module.exports = ({ data: { root } }) => {
  const { contentCatalog, page } = root
  return contentCatalog.getById({
    component: page.component.name,
    version: 'master',
    family: 'page',
    module: page.module,
    relative: page.relativeSrcPath,
  })
}
