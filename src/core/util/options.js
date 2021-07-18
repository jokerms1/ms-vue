import {
  extend,
  camelize,
  isPlainObject
} from 'shared/util'

export function mergeOptions (parent, child, vm) {
  if (typeof child === 'function') {
    child = child.options
  }

  normalizeProps(child, vm)
  normalizeInject(child, vm)
  normalizeDirective(child)
}

function normalizeProps (options) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = name;
      } else {

      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(val)
      res[name] = isPlainObject(val) 
        ? val
        : { type: val }
    }
  }
  options.props = res
}



function normalizeInject (options) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[val]
      normalized[key] = isPlainObject(val)
        ? extend({ form: key }, val)
        : { from: val }
    }
  }
}

function normalizeDirective (options) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}