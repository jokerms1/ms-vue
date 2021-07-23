import { isUndef, isDef, isFalse, isPrimitive, isTrue,} from 'shared/util'
import { createTextVNode } from 'core/vdom/vnode'






function isTextNode (node) {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

export function simpleNormailzeChildren (children) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}


export function normalizeChildren (children) {
  return isPrimitive(children) 
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
} 


export function normalizeArrayChildren (children, nestedIndex) {
  const res = []
  let i, c, lastIndex, last
  for (i = 0; i < children.length; i++) {
    c = children[i]
    if (isUndef(c) || typeof c === 'boolean') continue;
    lastIndex = res.length - 1
    last = res[lastIndex]
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`)
        if (isTextNode(c[0] && isTextNode(last))) {
          res[lastIndex] = createTextVNode(last.text + c[0].text)
          c.shift()
        }
        res.push.apply(res, c)
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        res[lastIndex] = createTextVNode(last.text + c)
      } else if (c !== '') {
        res.push(createTextVNode(c))
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        res[lastIndex] = createTextVNode(last.text + c.text)
      } else {
        if (isTrue(children._isVList) && 
          isDef(c.tag) && 
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = `__vlist${nestedIndex}_${i}__`
        }
        res.push(c)
      }
    }
  }
  return res
}