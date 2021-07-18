import { hasOwn } from 'shared/util'
import { hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'

export function initProvide(vm) {
  const provide = vm.$options.provide
  if (provide) {
    vm._provide = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}

export function initInjections (vm) {
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    Object.keys(result).forEach(key => {
      if (process.env.NODE_ENV !== 'production') {
       
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}


export function resolveInject(inject, vm) {
  if (inject) {
    const result = Object.create(null)
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject)


    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (key === '__ob__' ) continue
      const provideKey = inject[key].from
      let source = vm
      while (source) {
        if (source._provide && hasOwn(source._provide, provideKey)) {
          result[key] = source._provide[provideKey]
          break;
        }
        source = source.$parent
      }
      if (!source) {
        if ('default' in inject[key]) {
          const provideDefault = inject[key].default
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        } else if (process.env.NODE_ENV !== 'production') {

        }
      }
    }
    return result
  }
}