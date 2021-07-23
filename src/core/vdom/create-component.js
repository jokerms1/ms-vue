import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isObject
} from '../util/index'

import VNode from "./vnode";
import { resolveConstructorOptions } from 'core/instance/init'
import { queueActivatedComponent } from 'core/observer/scheduler'
import { createFunctionalComponent } from './create-functional-component'

import {
  callHook,
  activeInstance,
  updateChildComponent,
  activateChildComponent,
  deactivateChildComponent,
} from '../instance/lifecycle'

import {
  resolveAsyncComponent,
  createAsyncPlaceholder,
  extractPropsFromVNodeData,
} from './helpers/index'

export function createComponent (
  Ctor,
  data,
  context,
  children,
  tag
) {
  if (isUndef(Ctor)) {
    return
  }

  const baseCtor = context.$options._base

  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }

  if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      warn(`Invalid Component definition: ${String(Ctor)}`, context)
    }
    return
  }

  let asyncFactory
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context)
    if (Ctor === undefined) {
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {}

  resolveConstructorOptions(Ctor)

  if (isDef(data.model)) {
    transformModel(Ctor.options, data)
  }


  const propsData = extractPropsFromVNodeData(data, Ctor, tag)

  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  const listeners = data.on
  data.on = data.nativeOn

  if (isTrue(Ctor.options.abstract)) {
    const slot = data.slot
    data = {}
    if (slot) {
      data.slot = slot
    }
  }

  installComponentHooks(data)

  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )

  return vnode
}

const componentVNodeHooks = {
  init (vnode, hydrating) {
    if (
      vnode.componentInstance && 
      !vnode.componentInstance._isDestroyed && 
      vnode.data.keeyAlive
    ) {
      const mountedNode = vnode
      componentVNodeHooks.propatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm: undefined, hydrating)
    }
  },

  prepatch (oldVnode, vnode) {
    const options = vnode.componentOptions
    const child = vnode.componentInstance = oldVnode.componentInstance
    updateChildComponent(
      child,
      options.propsData,
      options.listeners,
      vnode,
      options.children
    )
  },

  insert (vnode) {
    const { context, componentInstance } = vnode
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }

    if (vnode.data.keeyAlive) {
      if (context._isMounted) {
        queueActivatedComponent(componentInstance)
      } else {
        activateChildComponent(componentInstance)
      }
    }
  },

  destroy (vnode) {
    const { componentInstance } = vnode
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keeyAlive) {
        componentInstance.$destroy()
      } else {
        deactivateChildComponent(componentInstance, true)
      }
    }
  }
}

const hooksToMerge = Object.keys(componentVNodeHooks)

export function createComponentInstanceForVnode(
  vnode,
  parent
) {
  const options = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }

  const inlineTemplate = vnode.data.inlineTemplate
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render
    options.staticRenderFns = inlineTemplate.staticRenderFns
  }
  return new vnode.componentOptions.Ctor(options)
}

function installComponentHooks (data) {
  const hooks = data.hook || (data.hook = {}) 
  for (let i = 0; i< hooksToMerge.length; i++) {
    const key = hooksToMerge[i]
    const existing = hooks[key]
    const toMerge = componentVNodeHooks[key]
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge
    }
  }
}

function mergeHook (f1, f2) {
  const merged = (a, b) => {
    f1(a, b)
    f2(a, b)
  }
  merged._merged = true
  return merged
}


function transformModel (options, data) {
  const prop = (options.model && options.model.prop) || 'value'
  const event = (options.model && options.model.event) || 'input'
  ;(data.props || (data.props = {}))[prop] = data.model.value
  const on = data.on || (data.on = {})
  const existing = on[event]
  const callback = data.model.callback
  if (isDef(existing)) {
    if (
      Array.isArray(existing) 
        ? existing.indexOf(callback) === -1
        : existing !== callback
    ) {
      on[event] = [callback].concat(existing)
    }
  } else {
    on[event] = callback
  }
}

