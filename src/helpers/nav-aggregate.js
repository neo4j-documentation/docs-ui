'use strict'
module.exports = (nav, tabNav) => {
// function combineNavs(nav, additionalNav) {

  // all the items in nav should have the same tabIndex value
  // in tabNav, there will be different tabIndex values
  // I want to conbine nav and tabNav into a single nav structure
  // so that all items with the same tabIndex are grouped together

  // return tabNav if nav is empty
  // if (!nav || !nav.length) {
  //   return tabNav
  // }

  // return nav if tabNav is empty
  if (!tabNav || !tabNav.length) {
    // console.log('No tabNav!')
    // return nav if it exists and has length
    return nav && nav.length ? nav : []
    // return
  }

  tabNav = JSON.parse(tabNav)

  // console.log('Combining navs...')
  // console.log('Base Nav:')
  // console.log(JSON.stringify(nav, null, 2))
  // console.log('Additional Nav:')
  // console.log(JSON.stringify(tabNav, null, 2))

  const tabIndexMap = new Map()

  // console.log('Original Nav:')
  // console.log(JSON.stringify(nav))

  // if (nav[0].items && nav[0].items.length) {
  //   nav[0].items.forEach((item) => {
  //     console.log('Item:')
  //     console.log(item)

  //     const tabIndex = item.tabIndex || 0
  //     if (!tabIndexMap.has(tabIndex)) {
  //       tabIndexMap.set(tabIndex, [])
  //     }
  //     tabIndexMap.get(tabIndex).push(item)
  //   })
  // }

  // console.log('Additional Nav:')
  // console.log(JSON.stringify(additionalNav))
  // console.log('================================')
  // console.log('Tab Nav:')
  // console.log(JSON.stringify(tabNav, null, 2))
  // console.log('================================')

  if (tabNav[0].items && tabNav[0].items.length) {
    tabNav[0].items.forEach((item) => {
      const tabIndex = item.tabIndex || 0
      if (!tabIndexMap.has(tabIndex)) {
        tabIndexMap.set(tabIndex, [])
      }
      tabIndexMap.get(tabIndex).push(item)
    })
  }

  // If the current component+version is missing from tabNav, inject it from the regular nav.
  // This happens when a non-latest version isn't included in tabNavExtra.json — without this,
  // JS can't find the current page URL in the nav tree, so is-active is never set and CSS hides everything.
  if (nav && nav.length && nav[0].items && nav[0].items.length) {
    const sampleItem = nav[0].items.find((item) => item.component)
    if (sampleItem) {
      const currentComp = sampleItem.component
      const currentVer = sampleItem.componentVersion
      const inTabNav = tabNav[0].items.some(
        (item) => item.componentHeader && item.component === currentComp && item.componentVersion === currentVer
      )
      if (!inTabNav) {
        const tabIndex = sampleItem.tabIndex || 99999
        const title = sampleItem.componentTitle || currentComp
        const injected = {
          content: title,
          tabIndex,
          component: currentComp,
          componentVersion: currentVer,
          componentTitle: title,
          componentHeader: true,
          items: nav[0].items,
        }
        if (!tabIndexMap.has(tabIndex)) {
          tabIndexMap.set(tabIndex, [])
        }
        tabIndexMap.get(tabIndex).push(injected)
      }
    }
  }

  // sort the tabindex map
  const sortedTabIndices = Array.from(tabIndexMap.keys()).sort((a, b) => a - b)

  // turn sortedNavs into one nav object in the same format as the original nav
  const combinedNav = [{
    items: [],
    root: true,
    order: 0,
  }]

  if (!sortedTabIndices.length) {
    return nav
  }

  sortedTabIndices.forEach((tabIndex) => {
    const items = tabIndexMap.get(tabIndex)
    combinedNav[0].items.push(...items)
  })

  return combinedNav
}
