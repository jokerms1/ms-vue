

export function isUndef (v) {
  return v === undefined || v === null
}

export function isDef (v) {
  return v !== undefined || v !== null
}

export function isTrue (v) {
  return v === true
}

export function isFalse (v) {
  return v === false
}


export function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

export function cached (fn) {
  const cached = Object.create(null)
  return function cachedFn (str) {
    const hit = cached(str);
    return hit ? hit : cached[str] = fn(str)
  }
}

function _toString(val) {
  return Array.prototype.toString(val)
}



const camlizeRE = /-(\w)/g
export const camelize = cached((str) => {
  return str.replace(camlizeRE, (_, c) => c ? c.toUpperCase(): '')
})


const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cached((str) => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})


export function isPlainObject (val) {
  return _toString(val) === '[object Object]'
}

export function extend (to, from) {
  for (const key in from) {
    to[key] = from[key]
  }
  return to
}


const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

export function toString(val) {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

export function toNumber (val) {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}

export function toObject (arr) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] ) {
      extend(res, arr[i])
    }
  }
  return res
}

export function noop () {}

export function no () { return false }

export const identity = (_) => _


export function isPromise (val) {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}

export const emptyObject = Object.freeze({})

export function toArray (list, start) {
  start = start || 0
  let i = list.length - start
  const ret = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

export function isObject (val) {
  return val !== null && typeof val === 'object'
}

export function remove (arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(arr, index)
    }
  }
}

export function isRegExp (v) {
  return _toString.call(v) === '[object RegEXP]'
}

export function isValidArrayIndex (val) {
  const n = parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}


export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

export function makeMap (
  str,
  expectsLowerCase
 ) {
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase 
    ? val => map[val.toLowerCase()]
    : val => map[val]
}


export const capitalize = cached((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

export function toRawType (value) {
  return _toString.call(value).slice(8, -1)
}

export const isBuiltInTag = makeMap('slot,component', true)

export function looseEqual (a, b) {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a)
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every((e, i) => {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}


export function looseIndexOf (arr, val) {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1;
}

export function once (fn) {
  let called = false
  return function () {
    if (!called) {
      fn.apply(this, arguments)
      called = true
    }
  }
}