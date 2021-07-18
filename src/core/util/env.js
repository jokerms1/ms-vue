
export const inBrowser = typeof window !== 'undefined'

export const hasSymbol = 
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys)

export function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}
