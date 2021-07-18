import {
  warn,
  emptyObject,
  defineReactive,
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { resolveSlots } from './render-helpers/resolve-slots.js'

import { isUpdatingChildComponent } from './lifecycle'


export function initRender (vm) {
  vm._vnode = null
  vm._staticTrees = null
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject

  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)

  vm.$creatreElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)


  const parentData = parentVnode && parentVnode.data

  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly`, vm)
    }, true)

    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}