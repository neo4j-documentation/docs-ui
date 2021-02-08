export function createElement (el, className, children) {
  var output = document.createElement(el)
  output.setAttribute('class', className)

  if (children !== undefined) {
    if (!Array.isArray(children)) {
      children = [children]
    }

    children.forEach(function (child) {
      if (child) output.appendChild(child)
    })
  }

  return output
}
