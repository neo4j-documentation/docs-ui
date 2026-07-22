'use strict'

module.exports = (jsonString) => {
  /**
   * Parses a JSON string and returns the object.
   */
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    console.log(jsonString)
    console.warn('Failed to parse JSON string in Handlebars:', jsonString)
    return {}
  }
}
