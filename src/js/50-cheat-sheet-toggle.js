document.addEventListener('DOMContentLoaded', function () {

  var toggle = document.querySelector('#toggle-enterprise')
  toggle.addEventListener('click', function (e) {
    e.stopPropagation()
    toggleClassHidden('.label--enterprise')
  })

})

function toggleClassHidden(selector) {
  document.querySelectorAll(selector).forEach(el => {

    let labelDiv = el.closest("div")

    // if the label is set for a page, hide the whole included page
    if (labelDiv.classList.contains("page-labels")) {
      labelDiv.closest("div.sect2").classList.toggle("hidden")

      hideFromToc(labelDiv.closest("div.sect2"))
    }

    // if the label is set for an example, hide the codeblock and the description
    if (labelDiv.classList.contains("labels")) {
      labelDiv.classList.toggle("hidden")

      // hide the description 
      let prev = labelDiv.previousElementSibling
      if (prev.classList.contains("description")) {
        prev.classList.toggle("hidden")
      }

      // hide the codeblock
      prev = prev.previousElementSibling
      if (prev.classList.contains("listingblock")) {
        prev.classList.toggle("hidden")
      }

    }
  });

  // if an entire section is hidden, hide the section header
  document.querySelectorAll('.sectionbody').forEach(el => {
    let hidden = el.querySelectorAll('div.sect2.hidden').length
    let sects = el.querySelectorAll('div.sect2').length
    // console.log(el)
    // console.log(el.querySelectorAll('div.sect2.hidden').length)
    // console.log(el.querySelectorAll('div.sect2').length)

    let header = el.closest("div.sect1")
    let id = header.firstElementChild.id
    let tocEntry = document.querySelector(`.toc-menu a[href="#${id}"]`)
    
    if (hidden == sects) {
      header.classList.add("hidden")
      if (tocEntry) tocEntry.closest("li").classList.add("hidden")
    }
    else {
      header.classList.remove("hidden")
      if (tocEntry) tocEntry.closest("li").classList.remove("hidden")
    }
    
  });

}

function hideFromToc(el) {

    // and hide the entry from the TOC
  // get the heading id
  let id = el.firstElementChild.id
  let tocEntry = document.querySelector(`.toc-menu a[href="#${id}"]`)
  // toggle hidden class for the toc entry with the same id
  if (tocEntry) tocEntry.closest("li").classList.toggle("hidden")

}


