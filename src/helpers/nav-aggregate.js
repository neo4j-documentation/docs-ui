// const nav = [
//     {"items":[
//         {"content":"<strong>Get started</strong>"},
//         {"content":"What is a graph database","url":"/getting-started/graph-database/","urlType":"internal","pageTabs":"reference","tabIndex":20,"component": "getting-started"},
//         {"content":"<strong>Administration (Getting Started)</strong>"},
//         {"content":"Administration page Four","url":"/getting-started/administration-page-four/","urlType":"internal","pageTabs":"administration","tabIndex":20,"component": "getting-started"},
//         {"content":"Administration page Five","url":"/getting-started/administration-page-five/","urlType":"internal","pageTabs":"administration","tabIndex":20,"component": "getting-started"},
//         {"content":"Administration page Six","url":"/getting-started/administration-page-six/","urlType":"internal","pageTabs":"administration","tabIndex":20,"component": "getting-started"}
//     ],
//     "root":true,
//     "order":0
// }];

// const additionalNav = [
//     {"items":[
//         {"content":"Administration page One","items":[],"url":"/docs-combined/1.0/administration-page-one/","urlType":"internal","pageTabs":"administration","tabIndex":10,"component": "docs-combined"},
//         {"content":"Administration page Two","items":[],"url":"/docs-combined/1.0/administration-page-two/","urlType":"internal","pageTabs":"administration","tabIndex":10,"component": "docs-combined"},
//         {"content":"Administration page Three","items":[],"url":"/docs-combined/1.0/administration-page-three/","urlType":"internal","pageTabs":"administration","tabIndex":10,"component": "docs-combined"},
//         {"content":"Administration page Seven","items":[],"url":"/test-extra/4.0/administration-page-seven/","urlType":"internal","pageTabs":"administration","tabIndex":50,"component": "test-extra"}
//     ],
//     "root":true,
//     "order":0
// }];

// const additionalNav = []


module.exports = (nav, additionalNav) => {

// function combineNavs(nav, additionalNav) {

    // all the items in nav should have the same tabIndex value
    // in additionalNav, there will be different tabIndex values
    // I want to conbine nav and additionalNav into a single nav structure
    // so that all items with the same tabIndex are grouped together

    // return additionalNav if nav is empty
    if (!nav || !nav.length) {
        return;
    }

    // return nav if additionalNav is empty
    if (!additionalNav || !additionalNav.length) {
        return nav;
    }

    additionalNav = JSON.parse(additionalNav);

    const tabIndexMap = new Map();


    // console.log('Original Nav:')
    // console.log(JSON.stringify(nav))
    

    if (nav[0].items && nav[0].items.length) {
        nav[0].items.forEach(item => {
            // console.log('Item:')
            // console.log(item)

            const tabIndex = item.tabIndex || 0;
            if (!tabIndexMap.has(tabIndex)) {
                tabIndexMap.set(tabIndex, []);
            }
            tabIndexMap.get(tabIndex).push(item);
        });
    }

    // console.log('Additional Nav:')
    // console.log(JSON.stringify(additionalNav))

    if (additionalNav[0].items && additionalNav[0].items.length) {
        additionalNav[0].items.forEach(item => {
            // console.log('Item:')
            // console.log(item)

            const tabIndex = item.tabIndex || 0;
            if (!tabIndexMap.has(tabIndex)) {
                tabIndexMap.set(tabIndex, []);
            }
            tabIndexMap.get(tabIndex).push(item);
        });
    }





    // sort the tabindex map
    const sortedTabIndices = Array.from(tabIndexMap.keys()).sort((a, b) => a - b);

    // console.log('sorted Tab Index Map:')
    const sortedNavs = Array.from(tabIndexMap.entries()).sort((a, b) => a[0] - b[0]);
    // console.log(JSON.stringify(sortedNavs, null, 2))

    // turn sortedNavs into one nav object in the same format as the original nav
    const combinedNav = [{
        items: [],
        root: true,
        order: 0
    }];

    if (!sortedTabIndices.length) {
        return nav;
    }

    sortedTabIndices.forEach(tabIndex => {
        const items = tabIndexMap.get(tabIndex);
        combinedNav[0].items.push(...items);
    });

    // console.log('Combined Nav:')
    // console.log(JSON.stringify(combinedNav, null, 2))

    return combinedNav

}