'use strict'

module.exports = (nav, tabNav, pageGroup, pageVersion) => {
  if (!tabNav || !tabNav.length) {
    return nav && nav.length ? nav : []
  }

  tabNav = JSON.parse(tabNav)

  const tabIndexMap = new Map()

  if (tabNav[0].items && tabNav[0].items.length) {
    // Separate flat tabOverview items from componentHeader items.
    // tabOverview items need to be nested inside their componentHeader's items
    // so the template can render them as Overview links.
    const overviewsByComponent = new Map()
    const headerItems = []

    tabNav[0].items.forEach((item) => {
      if (item.tabOverview) {
        const key = `${item.component}::${item.componentVersion}`
        if (!overviewsByComponent.has(key)) overviewsByComponent.set(key, [])
        overviewsByComponent.get(key).push(item)
      } else {
        headerItems.push(item)
      }
    })

    // Pre-select which version to show for each grouped component.
    // Priority: exact version match within the same group > latest > first seen.
    // Pages with no group always see latest of every grouped component.
    const selectedGroupVersions = new Map()
    headerItems.forEach((item) => {
      if (!item.docsetGroup) return
      const isExactMatch = pageGroup && item.docsetGroup === pageGroup && item.componentVersion === pageVersion
      const existing = selectedGroupVersions.get(item.component)
      if (!existing) {
        selectedGroupVersions.set(item.component, item)
      } else if (isExactMatch) {
        selectedGroupVersions.set(item.component, item)
      } else if (item.latest) {
        const existingIsExactMatch = pageGroup && existing.docsetGroup === pageGroup && existing.componentVersion === pageVersion
        if (!existingIsExactMatch) selectedGroupVersions.set(item.component, item)
      }
    })

    headerItems.forEach((item) => {
      // For grouped items, only show the selected version.
      if (item.docsetGroup && selectedGroupVersions.get(item.component) !== item) return

      if (item.componentHeader && overviewsByComponent.has(`${item.component}::${item.componentVersion}`)) {
        item.items = [...overviewsByComponent.get(`${item.component}::${item.componentVersion}`), ...(item.items || [])]
      }
      const tabIndex = item.tabIndex || 0
      if (!tabIndexMap.has(tabIndex)) tabIndexMap.set(tabIndex, [])
      tabIndexMap.get(tabIndex).push(item)
    })
  }

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
        if (!tabIndexMap.has(tabIndex)) tabIndexMap.set(tabIndex, [])
        tabIndexMap.get(tabIndex).push(injected)
      }
    }
  }

  const sortedTabIndices = Array.from(tabIndexMap.keys()).sort((a, b) => a - b)

  if (!sortedTabIndices.length) return nav

  const combinedNav = [{ items: [], root: true, order: 0 }]
  sortedTabIndices.forEach((tabIndex) => combinedNav[0].items.push(...tabIndexMap.get(tabIndex)))

  return combinedNav
}
