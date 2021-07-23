import { camelize, emptyObject, isDef } from "../../shared/util"
import { validateProp } from "../util/index"
import {  normalizeChildren } from "./helpers/normalize-children"
import VNode, { cloneVNode } from "./vnode"

export function FunctionalRenderContext() {

}


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