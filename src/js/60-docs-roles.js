import { createElement } from './modules/dom'

document.addEventListener('DOMContentLoaded', function () {
  
  // // legacy roles on headers
  // const sectionDivs = document.querySelectorAll('body.docs:not(.docshome) div[class^="sect"]:not(.sectionbody,.sect-header)')
  
  // sectionDivs.forEach(function (sectionDiv) {
  //   var roles = sectionDiv.classList
  //   roles = [...roles].sort().filter(function (c) {
  //     return (!(c.startsWith('sect') || c === 'display'))
  //   })

  //   if (roles.length === 0) return

  //   var newRolesDiv = createElement('div', 'sect-header')
  //   var head = sectionDiv.querySelector('h2,h3,h4,h5,h6')

  //   if (roles.length > 0) {
  //     newRolesDiv.append(head)
  //     var insert = createElement('div', 'roles')
  //     roles.forEach(function (role) {
  //       insert.append(createElement('span', `label inline-label ${role}`))
  //     })
  //     newRolesDiv.append(insert)
  //     sectionDiv.prepend(newRolesDiv)
  //     sectionDiv.classList.add('show-roles')
  //   }
  // })


  // new styles - convert all roles everywhere to a label
  // add a role starting with label-- to any elament
  // display a label right-aligned to headings and table captions
  // display a label left-aligned to everything else
  // ignore inline labels


  const headings = ['H2','H3','H4','H5','H6','CAPTION']

  const roleDivs = document.querySelectorAll('body.docs:not(.docshome) *[class*="label--"]')

  const tableDivs = document.querySelectorAll('body.docs:not(.docshome) table[class*="label--"]')


  // console.log('---')
  
  // handle different div Classs 
  // eg headings the role is on the parent div


  const labelClassMapping = {
    "new": "introduced",
  }

  const labelTextMapping = {
    "enterprise-edition": "Enterprise Edition",
    "aura-db-enterprise": "Aura DB Enterprise",
    "not-on-aura": "Not available on Aura",
    "fabric": "Fabric",
    "alpha": "Alpha",
    "beta": "Beta",
    'apoc-core': 'APOC Core',
    'apoc-full': 'APOC Full',
    'na': 'N / A',
    'warning': 'Warning!',
    'danger': 'Danger!',
    'mac-os': 'Mac OS',
    'cluster-member-core': 'CORE',
    'cluster-member-read-replica': 'READ_REPLICA',
    'cluster-member-single': 'SINGLE'
  }

  var getLabelText = function (role) {

    // label will be eg new-5.19, enterprise-edition, not-on-aura
    var label = role.replace('label--','')
    var labelParts = label.split('-')
    var labelDetails = {}

    if (labelTextMapping[label] !== undefined) {
      labelDetails.text = labelTextMapping[label]
      labelDetails.class = label
      return labelDetails
    }
    
    labelDetails.class = labelParts[0]
    
    // figure out label text
    labelParts[0] = labelClassMapping[labelParts[0]] || labelParts[0] 
    labelParts = labelParts.map(text => text.substr(0, 1).toUpperCase() + text.substr(1))
    
    // if second part is a number, insert 'in' before it
    if (!isNaN(labelParts[1])) labelParts.splice(1, 0, 'in') 
    
    labelDetails.text = labelParts.join(' ')

    return labelDetails
  }

  
  
  roleDivs.forEach(function (roleDiv) {

    // ignore spans because they're inline
    // we only care about labels on block elements
    // DIV or TABLE
    if (roleDiv.nodeName === 'SPAN' ) return

    var roles = roleDiv.classList
    roles = [...roles].sort().filter(function (c) {
      return (c.startsWith('label--'))
    })

    if (roles.length === 0) return

    // console.log(roles)

    let labels = []

    // var newRolesDiv = createElement('div', 'flex-labels')

    roles.forEach(function (role) {

      // construct label name and text
      const labelDetails = getLabelText(role)
      
      // create a span element for the label
      const labelDiv = createElement('span', `label content-label label--${labelDetails.class}`)
      labelDiv.appendChild(document.createTextNode(labelDetails.text))

      // remove the role from the parent div
      roleDiv.classList.remove(role)

      labels.push(labelDiv)

    })

    

    if (headings.includes(roleDiv.firstElementChild.nodeName) || roleDiv.nodeName === 'H1') {
      var labelsDiv
      if (roleDiv.nodeName === 'H1') {
        labelsDiv = roleDiv 
      } else {
        labelsDiv = roleDiv.firstElementChild
      }
      for (const label of labels) {
        label.classList.add('header-label')
        labelsDiv.append(label)
      }
    }
    
    else {
      var newRolesDiv = createElement('div', 'content-labels')
      // add the span to the parent div
      for (const label of labels) {
        newRolesDiv.append(label)
      }
      const contentLabel = Array.from(labels[0].classList).find(c => c.startsWith('label--')).replace('label--','')
      roleDiv.firstElementChild.classList.add('labeled', `content--${contentLabel}`)
      roleDiv.prepend(newRolesDiv)
      roleDiv.classList.add('has-label')
    }

  })




})
