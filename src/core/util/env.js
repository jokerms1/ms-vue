
export const inBrowser = typeof window !== 'undefined'

export const hasProto = '__proto__' in {}

export const UA = inBrowser && window.navigator.userAgent.toLowerCase()
export const isIE = UA && /msie|trident/.test(UA)
export const isIE9 = UA && UA.indexOf('msie 9.0') > 0
export const isEdge = UA && UA.indexOf('edge/') > 0
export const inWeek = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform
export const weexPlatform = inWeek && WXEnvironment.platform.toLowerCase()
export const isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA) || (weexPlatform === 'ios'))

export const nativeWatch = ({}).watch

export const devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__

export const hasSymbol = 
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys)

export function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}


let _isServer
export const isServerRendering = () => {
  if (_isServer === undefined) {
    if (!inBrowser && !inWeek && typeof global !== 'undefined') {
      _isServer = global['process'] && global['process'].env.VUE_ENV === 'server'
    } else {
      _isServer = false
    }
  }
  return _isServer
}