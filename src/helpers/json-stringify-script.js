'use strict'

// Like json-stringify, but escapes any '</' sequences so the output is safe to
// embed inside a <script type="application/json"> block. Without this, a nav
// title containing '</script>' would prematurely close the script tag.
module.exports = (obj) => {
  return JSON.stringify(obj).replace(/<\/(script)/gi, '<\\/$1')
}
