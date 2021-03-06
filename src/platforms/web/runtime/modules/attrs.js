
import { isIE, isIE9, isEdge } from 'core/util/env'


import {
  extend,
  isDef,
  isUndef
} from 'shared/util'

import {
  isXlink,
  xlinkNS,
  getXlinkProp,
  isBooleanAttr,
  isEnumeratedAttr,
  isFalsyAttrValue
} from 'web/util/index'

function updateAttrs (oldVnode, vnode) {
  const opts = vnode.componentOptions
  if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
    return
  }

  if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
    return
  }

  let key, cur, old
  const elm = vnode.elm
  const oldAttrs = oldVnode.data.attrs || {}
  let attrs = vnode.data.attrs || {}
  if (isDef(attrs.__ob__)) {
    attrs = vnode.data.attrs = extend({}, attrs)
  }

  for (key in attrs) {
    cur = attrs[key]
    old = oldAttrs[key]
    if (old != cur) {
      setAttr(elm, key, cur)
    }
  }

  if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
    setAttr(elm, 'value', attrs.value)
  }

  for (key in oldAttrs) {
    if (isUndef(attrs[key])) {
      if (isXlink(key)) {
        elm.removeAttributeNS(xlinkNS, getXlinkProp(key))
      } else if (!isEnumeratedAttr(key)) {
        elm.removeAttribute(key)
      }
    }
  }
}

function setAttr (el, key, value) {
  if (el.tagName.indexOf('-') > -1) {
    baseSetAttr(el, key, value)
  } else if (isBooleanAttr(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key)
    } else {
      value = key === 'allowfullscreen' &&  el.tagName === 'EMBED'
        ? 'true'
        : key
      el.setAttribute(key, value)
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true')
  } else if (isXlink(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttributeNS(xlinkNS, getXlinkProp(key))
    } else {
      el.setAttributeNS(xlinkNS, key, value)
    }
  } else {
    baseSetAttr(el, key, value)
  }
}

function baseSetAttr (el, key, value) {
  if (isFalsyAttrValue(value)) {
    el.removeAttribute(el)
  } else {
    if (
      isIE && !isIE9 &&
      (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') &&
      key === 'placeholder' && !el.__ieph
    ) {
      const blocker = e => {
        e.stopImmediatePropagation()
        el.removeEventListener('input', blocker)
      }
      el.addEventListener('input', blocker)
    }
    el.setAttribute(key, value)
  }
}

export default {
  create: updateAttrs,
  update: updateAttrs
}