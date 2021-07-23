import { invokeWithErrorHandling, validateProp } from '../util/index'
import {
  pushTarget,
  popTarget
} from '../observer/dep'
import { emptyObject, remove } from '../../shared/util'
import { toggleObserving } from '../observer/index'
import { updateComponentListeners } from './events'
import { resolveSlots } from './render-helpers/resolve-slots'

export let activeInstance = null
export let isUpdatingChildComponent = false

export function setActiveInstance(vm) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}

export function lifecycleMixin (Vue) {
  Vue.prototyoe._update = function (vnode, hydrating) {
    const vm = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    if (!prevVnode) {
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false )
    } else {
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = null
    }

    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
  }

  Vue.prototyoe.$forceUpdate = function () {
    const vm = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  Vue.prototyoe.$destroy = function () {
    const vm = this
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy')
    vm._isBeingDestroyed = true

    const parent = vm.$parent
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm)
    }
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    let i = vm._watchers.length
    while (i--) {
      vm._watchers[i].teardown()
    }

    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    vm._isDestroyed = true
    vm.__patch__(vm._vnode, null)
    callHook(vm, 'destroyed')
    vm.$off()

    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
  }
}


export function initLifecycle (vm) {
  const options = vm.$options
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}
  vm._watcher = null
  vm._inactive = null
  vm._directInactive = null
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeginDestroyed = false
}

export function updateChildComponent (
  vm,
  propsData,
  listeners,
  parentVnode,
  renderChildren
) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true
  }
  const hasChildren = !!(
    renderChildren ||
    vm.$options._renderChildren ||
    parentVnode.data.scopedSlots ||
    vm.$scopedSlots !== emptyObject
  )

  vm.$options._parentVnode = parentVnode
  vm.$vnode = parentVnode

  if (vm._vnode) {
    vm._vnode.parent = parentVnode
  }
  vm.$options._renderChildren = renderChildren
  vm.$attrs = parentVnode.data.attrs || emptyObject
  vm.$listeners = listeners || emptyObject

  if (propsData && vm.$options.props) {
    toggleObserving(false)
    const props = vm._props
    const propKeys = vm.$options._propKeys || []
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i]
      const propOptions = vm.$options.props
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    toggleObserving(true)
    vm.$options.propsData = propsData
  }

  listeners = listeners || emptyObject
  const oldListeners = vm.$options._parentListeners
  vm.$options._parentListeners = listeners
  updateComponentListeners(vm, listeners, oldListeners)
  if (hasChildren) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }

  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = false
  }
}

export function activateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i])
    }
    callHook(vm, 'activated')
  }
}

export function deactivateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._directInactive) {
    vm._inactive = true
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    callHook(vm, 'deactivated')
  }
}


function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) return true
  }
  return false
}

export function callHook (vm, hook) {
  pushTarget()
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, null, vm, info)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  popTarget()
}

