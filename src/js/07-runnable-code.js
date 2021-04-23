
import { runnable } from './modules/runnable'

document.addEventListener('DOMContentLoaded', function () {
  // Add contenteditable attribute to editable code blocks (Experimental)
  document.querySelectorAll('.editable')
    .forEach(function (el) {
      el.querySelectorAll('code').forEach(function (el) {
        el.contentEditable = true
      })
    })

  // Runnable Cypher blocks (Experimental)
  var runnableElements = Array.from(document.querySelectorAll('.runnable'))

  if (!runnableElements.length || !window.neo4j) return

  runnableElements.map((el) => runnable(el))
})
