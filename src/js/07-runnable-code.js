
import { runnable } from './modules/runnable'

document.addEventListener('DOMContentLoaded', async function () {
  // Add contentEditable attribute to editable code blocks (Experimental)
  document.querySelectorAll('.editable')
    .forEach(function (el) {
      el.querySelectorAll('code').forEach(function (el) {
        el.contentEditable = true
      })
    })

  // Runnable Cypher blocks (Experimental)
  var runnableElements = Array.from(document.querySelectorAll('.runnable'))

  const blocksUsingNeo4jJavaScriptDriver = runnableElements.filter((block) => !block.className.includes('backend:graphgist'))
  if (blocksUsingNeo4jJavaScriptDriver.length && (!window.neo4j || !window.neo4j.driver)) {
    // use :page-includedriver: attribute in your AsciiDoc document to include the Neo4j driver
    console.warn('Neo4j driver is not loaded, unable to run Cypher queries...')
    return
  }
  // no runnable block, skipping.
  if (runnable.length === 0) return

  for (const runnableElement of runnableElements) {
    try {
      await runnable(runnableElement).callback()
    } catch (e) {
      console.log('Unable to initialize the runnable element', runnableElement, e)
    }
  }
})
