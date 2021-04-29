export function createElement (el, className, children) {
  const output = document.createElement(el)
  if (className) {
    output.setAttribute('class', className)
  }

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
