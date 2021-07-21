import {
  warn,
  emptyObject,
  defineReactive,
  nextTick,
  handleError,
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from './render-helpers/resolve-slots.js'
import { normalizeScopedSlots } from '../vdom/helper/normalize-scoped-slots'

import { isUpdatingChildComponent } from './lifecycle'
import VNode, { createEmptyVNode } from '../vdom/vnode'


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

export function renderMixin(Vue) {
  
  installRenderHelpers(Vue.prototype)

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  }

  Vue.prototype._render = function () {
    const vm = this
    const { render, _parentVnode } = vm.$options

    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots
      )
    }

    vm.$vnode = _parentVnode
    let vnode
    try {
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch(e) {
      handleError(e, vm, `render`)
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
        } catch (e) {
          handleError(e, vm, `renderError`)
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    }

    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    vnode.parent = _parentVnode
    return vnode
  }

}