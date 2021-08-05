import config from 'core/config'
import { hyphenate } from 'shared/util'

export function isKeyNotMatch (expect, actual) {
  if (Array.isArray(expect)) {
    return expect.indexOf(actual) !== -1
  } else {
    return expect !== actual
  }
}


export function checkKeyCodes(
  eventKeyCode,
  key,
  buildInKeyCode,
  eventKeyName,
  buildInKeyName
) {
  const mappedKeyCode = config.keyCodes[key] || buildInKeyCode
  if (buildInKeyName && eventKeyCode && !config.keyCodes[key]) {
    return isKeyNotMatch(buildInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    return hyphenate(eventKeyCode) !== key
  }
}