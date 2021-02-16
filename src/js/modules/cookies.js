export function getCookie (name) {
  const regex = new RegExp(`${name}=[^;]+;`)
  const match = document.cookie.match(regex)
  if (match) {
    return match[0].split('=')[1].trim().replace(';', '')
  }
}
