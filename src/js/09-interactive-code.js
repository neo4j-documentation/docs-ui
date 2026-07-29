// Interactive code blocks
//
// Turns a `[source,...,role=interactive]` listing block into a small form.
// The block's code contains `{{token}}` placeholders; an adjacent
// `role=interactive-config` JSON block describes each token (label,
// description, default, placeholder, pattern, grouping). As the user types,
// the values are substituted into the rendered code block and it is
// re-highlighted. The existing bundle copy button (06-code.js) copies the
// substituted text.
//
// A `role=interactive-reference` block whose content is a widget id (or empty,
// to bind to the sole widget on the page) renders a read-only description list
// of the same fields, so the information can be read on its own.

import { createElement } from './modules/dom'

var TOKEN_RX = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g

// Shown above the form unless the config sets "intro" (a string to override, or
// false to omit).
var DEFAULT_INTRO = 'Enter your values below and the code updates automatically. ' +
  'Copy the finished code when you are done.'

// Derive a readable label from a token name, e.g. `privRole` -> `Priv role`.
function humanize (key) {
  var spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

// Keep only the characters allowed by the field's pattern (a character class,
// e.g. "[A-Za-z0-9_]"). Without a pattern the value is used verbatim.
function filterValue (raw, pattern) {
  if (!pattern) return raw
  var allow
  try {
    allow = new RegExp(pattern, 'g')
  } catch (e) {
    return raw
  }
  var kept = raw.match(allow)
  return kept ? kept.join('') : ''
}

function reHighlight (codeEl) {
  if (window.hljs && window.hljs.highlightElement) {
    delete codeEl.dataset.highlighted
    window.hljs.highlightElement(codeEl)
  }
}

function parseConfig (block) {
  var codeEl = block.querySelector('pre code') || block.querySelector('pre')
  if (!codeEl) return null
  try {
    return JSON.parse(codeEl.textContent)
  } catch (e) {
    console.warn('interactive-code: could not parse config block', block, e)
    return null
  }
}

// Fields listed under `groups`, plus any declared field not in a group, in a
// trailing implicit group. Returns [{ legend, fields: [name] }].
function fieldGroups (config) {
  var fieldNames = Object.keys(config.fields || {})
  if (!Array.isArray(config.groups) || !config.groups.length) {
    // No groups declared: put everything in one titled group.
    return [{ legend: 'Parameters', fields: fieldNames }]
  }
  var grouped = {}
  var groups = config.groups.map(function (g) {
    var names = (g.fields || []).filter(function (n) { return config.fields[n] })
    names.forEach(function (n) { grouped[n] = true })
    return { legend: g.legend || null, fields: names }
  })
  var leftover = fieldNames.filter(function (n) { return !grouped[n] })
  if (leftover.length) groups.push({ legend: null, fields: leftover })
  return groups
}

function substitute (template, values) {
  return template.replace(TOKEN_RX, function (match, name) {
    var value = values[name]
    return value === null || value === undefined ? match : value
  })
}

function buildWidget (widget) {
  var config = widget.config
  var fields = config.fields || {}
  var inputs = {}

  var form = createElement('form', 'interactive-form')
  form.setAttribute('onsubmit', 'return false')

  fieldGroups(config).forEach(function (group) {
    // Every group is a fieldset, so fields are always enclosed in a bordered
    // box; a legend is added only when the group is named.
    var container = createElement('fieldset', 'interactive-fieldset')
    if (group.legend) {
      container.appendChild(createElement('legend', null, [document.createTextNode(group.legend)]))
    }

    group.fields.forEach(function (name) {
      var field = fields[name] || {}
      var label = createElement('label', 'interactive-field')

      label.appendChild(createElement('span', 'interactive-field-label',
        [document.createTextNode(field.label || humanize(name))]))

      var input = createElement('input', 'interactive-field-input')
      input.type = 'text'
      input.setAttribute('data-field', name)
      if (field.placeholder) input.placeholder = field.placeholder
      else if (field.default) input.placeholder = field.default
      if (field.default) input.value = field.default
      label.appendChild(input)
      inputs[name] = input

      if (field.description) {
        label.appendChild(createElement('span', 'interactive-field-desc',
          [document.createTextNode(field.description)]))
      }

      container.appendChild(label)
    })

    form.appendChild(container)
  })

  var render = function () {
    var values = {}
    Object.keys(fields).forEach(function (name) {
      var field = fields[name]
      var value = filterValue(inputs[name] ? inputs[name].value : '', field.pattern)
      if (!value) value = field.default || field.placeholder || null
      values[name] = value
    })
    widget.codeEl.textContent = substitute(widget.template, values)
    reHighlight(widget.codeEl)
  }

  Object.keys(inputs).forEach(function (name) {
    inputs[name].addEventListener('input', render)
    inputs[name].addEventListener('change', render)
  })

  // Place the intro text and form above the code block, render, then reveal the
  // widget (it is hidden until now to avoid a flash of the raw template).
  var intro = config.intro === undefined ? DEFAULT_INTRO : config.intro
  if (intro) {
    widget.block.parentNode.insertBefore(
      createElement('p', 'interactive-intro', [document.createTextNode(intro)]), widget.block)
  }
  widget.block.parentNode.insertBefore(form, widget.block)
  render()
  widget.block.classList.add('interactive-ready')
}

function buildReference (marker, widgets) {
  var target = (marker.textContent || '').trim()
  var widget = target
    ? widgets[target]
    : (Object.keys(widgets).length === 1 ? widgets[Object.keys(widgets)[0]] : null)

  if (!widget) {
    console.warn('interactive-code: reference has no matching widget', target || '(none)')
    return
  }

  var fields = widget.config.fields || {}
  // Match Asciidoctor's description-list markup (div.dlist > dl > dt.hdlist1 +
  // dd > p) so it picks up the bundle's .dlist styles.
  var dl = createElement('dl', 'interactive-reference-list')

  fieldGroups(widget.config).forEach(function (group) {
    group.fields.forEach(function (name) {
      var field = fields[name] || {}
      dl.appendChild(createElement('dt', 'hdlist1', [document.createTextNode(field.label || humanize(name))]))

      var ddChildren = []
      if (field.description) {
        ddChildren.push(createElement('p', null, [document.createTextNode(field.description)]))
      }
      // Show a default line for every field; the value is monospaced and empty/
      // absent defaults read as ''.
      ddChildren.push(createElement('p', null, [
        document.createTextNode('Default value: '),
        createElement('code', null, [document.createTextNode(field.default ? field.default : "''")]),
      ]))
      dl.appendChild(createElement('dd', null, ddChildren))
    })
  })

  var wrapper = createElement('div', 'dlist', [dl])
  marker.innerHTML = ''
  marker.appendChild(wrapper)
  marker.classList.add('interactive-ready')
}

document.addEventListener('DOMContentLoaded', function () {
  var blocks = Array.from(document.querySelectorAll('.listingblock.interactive'))
  if (!blocks.length) return

  // Pass A: parse each widget's adjacent config and capture its template.
  // A block that can't be enhanced is still revealed, so its raw code (and copy
  // button) remain usable rather than staying hidden by the anti-flash CSS.
  var reveal = function (block) { block.classList.add('interactive-ready') }

  var widgets = {}
  blocks.forEach(function (block, index) {
    var codeEl = block.querySelector('pre code')
    if (!codeEl) { reveal(block); return }

    var configBlock = block.nextElementSibling
    if (!configBlock || !configBlock.classList.contains('interactive-config')) {
      console.warn('interactive-code: no adjacent interactive-config block', block)
      reveal(block)
      return
    }
    var config = parseConfig(configBlock)
    configBlock.parentNode.removeChild(configBlock)
    if (!config) { reveal(block); return }

    var id = block.id || ('interactive-' + index)
    widgets[id] = {
      id: id,
      block: block,
      codeEl: codeEl,
      template: codeEl.textContent,
      config: config,
    }
  })

  // Pass B: build the forms.
  Object.keys(widgets).forEach(function (id) { buildWidget(widgets[id]) })

  // Pass C: render any standalone references.
  document.querySelectorAll('.listingblock.interactive-reference')
    .forEach(function (marker) { buildReference(marker, widgets) })
})
