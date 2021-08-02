import { camelize, emptyObject, hasOwn, isDef, isTrue} from "../../shared/util"
import { resolveSlots } from "../instance/render-helpers/resolve-slots"
import { normalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import { createElement } from './create-element'
import { resolveInject } from '../instance/inject'
import { validateProp } from "../util/index"
import {  normalizeChildren } from "./helpers/normalize-children"
import VNode, { cloneVNode } from "./vnode"
import { installRenderHelpers } from '../instance/render-helpers/index'

export function FunctionalRenderContext(
  data,
  props,
  children,
  parent,
  Ctor
) {
  const options = Ctor.options
  let contextVm
  if (hasOwn(parent, '_uid')) {
    contextVm = Object.create(parent)
    contextVm._original = parent
  } else {
    contextVm = parent
    parent = parent._original
  }

  const isCompiled = isTrue(options._compiled)
  const needNormailization = !isCompiled

  this.data = data
  this.props = props
  this.children = children
  this.parent = parent
  this.listeners = data.on || emptyObject
  this.injections = resolveInject(options.inject, parent)
  this.slots = () => resolveSlots(children, parent)

  Object.defineProperty(this, 'scopedSlots', ({
    enumerable: true,
    get () {
      return normalizeScopedSlots(data.scopedSlots, this.slots())
    }
  }))

  if (isCompiled) {
    this.$options = options
    this.$slots = this.slots()
    this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots)
  }

  if (options._scopeId) {
    this._c = (a, b, c, d) => {
      const vnode = createElement(contextVm, a, b, c, d, needNormailization)
      if (vnode && !Array.isArray(vnode)) {
        vnode.fnScopeId = options._scopeId
        vnode.fnContext = parent
      }
      return vnode
    }
  } else {
    this._c = (a, b, c, d) => createElement(contextVm, a, b, c, d, needNormailization)
  }
}

installRenderHelpers(FunctionalRenderContext.prototype)


export function createFunctionalComponent (
  Ctor,
  propsData,
  data,
  contextVm,
  children
) {
  const options = Ctor.options
  const props = {}
  const propsOptions = options.props
  if (isDef(propsOptions)) {
    for (const key in propsOptions) {
      props[key] = validateProp(key, propsOptions, propsData || emptyObject)
    }
  } else {
    if (isDef(data.attrs)) mergeProps(props, data.attrs) 
    if (isDef(data.props)) mergeProps(props, data.props)
  }

  const renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  )

  const vnode = options.render.call(null, renderContext._c, renderContext._c, renderContext)


  if (vnode instanceof VNode) {
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
  } else if (Array.isArray(vnode)) {
    const vnodes = normalizeChildren(vnode) || []
    const res = new Array(vnodes.length)
    for (let i = 0; i < vnodes.length; i++) {
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext)
    }
    return res
  }
}

function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
  const clone = cloneVNode(vnode)
  clone.fnContext = contextVm
  clone.fnOptions = options
  if (process.env.NODE_ENV !== 'production') {
    (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext
  }
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot
  }
  return clone
}

function mergeProps (to, from) {
  for (const key in from) {
    to[camelize(key)] = from[key]
  }
}