import he from 'he'
import { parseHTML } from './html-parser'
import { parseText } from './text-parser'
import { parseFilters} from './filter-parser'
import { genAssignmentCode } from '../directives/model'
import { extend, cached, no, camelize, hyphenate, hasOwn } from 'shared/util'
import { isIE, isEdge, isServerRendering } from 'core/util/env'

import {
  addProp,
  addAttr,
  baseWarn,
  addHandler,
  addDirective,
  getAndRemoveAttr,
  getRawBindingAttr,
  pluckModuleFunction,
  getBindingAttr
} from '../helpers'



export const onRE = /^@|^v-on:/
export const dirRE = /^v-|^@|^:|^\./
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s_([\s\S]*)/
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\?\}]*))?$/
const striptParentsRE = /^\(|\)$/g
const argRE = /:(.*)$/
export const bindRE = /^:|^\.|^v-bind:/
const propBindRE = /^\./
const modifierRE = /\.[^\.]+/g
const lineBreakRE = /[\r\n]/
const whitespaceRE = /\s+/g

const decodeHTMLCached = cached(he.decode)

export let warn
let delimiters
let transforms
let preTransforms
let postTransforms
let platformIsPreTag
let platformMustUseProp
let platformGetTagNamespace
let maybeComponent

export function createASTElement(
  tag,
  attrs,
  parent
) {
  return {
    type: 1,
    tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    rawAttrsMap: {},
    parent,
    children: []
  }
}

export function parse(
  template,
  options
) {
  warn = options.warn || baseWarn

  platformIsPreTag = options.isPreTag || no
  platformMustUseProp = options.mustUseProp || no
  platformGetTagNamespace = options.getTagNamespace || no
  const isReservedTag = options.isReservedTag || no
  maybeComponent = el => !!el.component || !isReservedTag(el.tag)

  transforms = pluckModuleFunction(options.modules, 'transformNode')
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')

  delimiters = options.delimiters

  const stack = []
  const preserveWhitespace = options.preserveWhitespace !== false
  const whitespaceOption = options.whitespace
  let root
  let currentParent
  let inVPre = false
  let inPre = false
  let warned = false

  function warnOnce (msg, range) {
    if (!warned) {
      warned = true
      warn(msg, range)
    }
  }

  function closeElement (element) {
    if (!inVPre && !element.processed) {
      element = processElement(element, options)
    }

    if (!stack.length && element !== root) {
      if (root.if && (element.elseif || element.else)) {
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(element)
        }
        addIfCondition(root, {
          exp: element.elseif,
          block: element
        })
      } else if (process.env.NODE_ENV !== 'production') {
        warnOnce(
          `Component template should contain exactly one root element. ` +
          `If you are using v-if on multiple elements, ` +
          `use v-else-if to chain them instead.`,
          { start: element.start }
        )
      }
    }
    if (currentParent && !element.forBidden) {
      if (element.elseif || element.else) {
        processIfConditions(element, currentParent)
      } else if (element.slotScope) {
        const name = element.slotTarget || 'default'
        ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element
      } else {
        currentParent.children.push(element)
        element.parent = currentParent
      }
    }

    if (element.pre) {
      inVPre = false
    }

    if (platformIsPreTag(element.tag)) {
      inPre = false
    }

    for (let i = 0; i < postTransforms.length; i++) {
      postTransforms[i](element, options)
    }
  }

  function checkRootConstraints (el) {
    if (el.tag === 'slot' || el.tag === 'template') {
      warnOnce(
        `Cannot use <${el.tag}> as component root element because it may ` +
        'contain multiple nodes.',
        { start: el.start }
      )
    }
    if (hasOwn(el.attrsMap, 'v-for')) {
      warnOnce(
        'Cannot use v-for on stateful component root element because ' +
        'it renders multiple elements.',
        el.rawAttrsMap['v-for']
      )
    }
  }

  parseHTML(template, {
    warn,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    start (tag, attrs, unary, start) {
      const ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag)

      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs)
      }

      let element = createASTElement(tag, attrs, currentParent)
      if (ns) {
        element.ns = ns
      }

      if (process.env.NODE_ENV == 'production' && options.outputSourceRange) {
        element.start = start
        element.rawAttrsMap = element.attrsList.reduce((cumulated, attr) => {
          cumulated[attr.name] = attr
          return cumulated
        }, {})
      }

      if (isForbiddenTag(element) && !isServerRendering()) {
        element.forBidden = true
        process.env.NODE_ENV !== 'production' && warn(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          `<${tag}>` + ', as they will not be parsed.',
          { start: element.start }
        )
      }

      for (let i = 0; i < preTransforms.length; i++) {
        element = preTransforms[i](element, options) || element
      }

      if (!inVPre) {
        processPre(element)
        if (element.pre) {
          inVPre = true
        }
      }

      if (platformIsPreTag(element.tag)) {
        inPre = true
      }

      if (inPre) {
        processRawAttrs(element)
      } else if (!element.processed) {
        processFor(element)
        processIf(element)
        processOnce(element)
      }

      if (!root) {
        root = element
        stack.push(element)
      } else {
        closeElement(element)
      }

    },

    end (tag, start, end) {
      const element = stack[stack.length - 1]
      if (!inPre) {
        const lastNode = element.children[element.children.length - 1]
        if (lastNode && lastNode.type === 3 && lastNode.text === ' ') {
          element.children.pop()
        }
      }

      stack.length -= 1
      currentParent = stack[stack.length - 1]
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        element.end = end
      }

      closeElement(element)
    },

    chars (text, start, end) {
      if (!currentParent) {
        if (process.env.NODE_ENV !== 'production') {
          if (text === template) {
            warnOnce(
              'Component template requires a root element, rather than just text.',
              { start }
            )
          } else if ((text = text.trim())) {
            warnOnce(
              `text "${text}" outside root element will be ignored.`,
              { start }
            )
          }
        }
        return
      }

      if (
        isIE &&
        currentParent.tag === 'textarea' && 
        currentParent.attrsMap.placeholder === text
      ) {
        return
      }
      const children = currentParent.children
      if (inPre || text.trim()) {
        text = isTextTag(currentParent) ? text : decodeHTMLCached(text)
      } else if (!children.length) {
        text = ''
      } else if (whitespaceOption) {
        if (whitespaceOption === 'codense') {
          text = lineBreakRE.test(text) ? '' : ' '
        } else {
          text = ' '
        }
      } else {
        text = preserveWhitespace ? ' ' : ''
      }
      if (text) {
        if (whitespaceOption === 'codense') {
          text = text.replace(whitespaceRE, ' ')
        }
        let res
        let child
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          child = {
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text
          }
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          child = {
            type: 3,
            text
          }
        }
        if (child) {
          if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
            child.start = start
            child.end = end
          }
          children.push(child)
        }
      }
    },

    comment (text, start, end) {
      const child = {
        type: 3,
        text,
        isComment: true
      }
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        child.start = start
        child.end = end
      }
      currentParent.children.push(child)
    }

  })
}

function processPre (el) {
  if (getAndRemoveAttr(el, 'v-pre') != null) {
    el.pre = true
  }
}

function processOnce (el) {
  const once = getAndRemoveAttr(el, 'v-once')
  if (once != null) {
    el.once = true
  }
}

function processRawAttrs (el) {
  const list = el.attrsList
  const len = list.length
  if (len) {
    const attrs = el.attrs = new Array(len)
    for (let i = 0; i < len; i++) {
      attrs[i] = {
        name: list[i].name,
        value: JSON.stringify(list[i].value)
      }
      if (list[i].start != null) {
        attrs[i].start = list[i].start
        attrs[i].end = list[i].end
      }
    }
  } else if (!el.pre) {
    el.plain = true
  }
}


function processAttrs (el) {
  const list = el.attrsList
  let i, l, name, rawName, value, modifiers, isProp, syncGen
  for (i = 0, l = list.length; i < l; i++) {
    name = rawName = list[i].name
    value = list[i].value
    if (dirRE.test(name)) {
      el.hasBindings = true
      modifiers = parseModifiers(name.replace(dirRE, ''))
      if (propBindRE.test(name)) {
        modifiers = modifiers || {}
        modifiers.prop = true
        name = `.` + name.slice(1).replace(modifierRE, '')
      } else if (modifiers) {
        name = name.replace(modifierRE, '')
      }
      if (bindRE.test(name)) {
        name = name.replace(bindRE, '')
        isProp = false
        value = parseFilters(value)
        isProp = false
        if (
          process.env.NODE_ENV !== 'production' &&
          value.trim().length === 0
        )  {
          warn(
            `The value for a v-bind expression cannot be empty. Found in "v-bind:${name}"`
          )
        }
        if (modifiers) {
          if (modifiers.prop) {
            isProp = true
            name = camelize(name)
            if (name === 'innerHtml') name = 'innerHTML'
          }

          if (modifiers.camel) {
            name = camelize(name)
          }

          if (modifiers.sync) {
            syncGen = genAssignmentCode(value, `$event`)
            addHandler(
              el,
              `update:${camelize(name)}`,
              syncGen,
              null,
              false,
              warn,
              list[i]
            )
            if (hyphenate(name) !== camelize(name)) {
              addHandler(
                el,
                `update:${hyphenate(name)}`,
                syncGen,
                null,
                false,
                warn,
                list[i]
              )
            }
          }
        }

        if (
          isProp || (
            !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
          )
        ) {
          addProp(el, name, value, list[i])
        } else {
          addAttr(el, name, value, list[i])
        }
      } else if (onRE.test(name)) {
        name = name.replace(onRE, '')
        addHandler(el, name, value, modifiers, false, warn, list[i])
      } else {
        name = name.replace(dirRE, '')

        const argMatch = name.match(argRE)
        const arg = argMatch && argMatch[1]

        if (arg) {
          name = name.slice(0, -(arg.length + 1))
        }
        addDirective(el, name, rawName, value, arg, modifiers, list[i])
        if (process.env.NODE_ENV !== 'production' && name === 'model') {
          checkForAliasModel(el, value)
        }
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        const res = parseText(value, delimiters)
        if (res) {
          warn(
            `${name}="${value}": ` +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div id="{{ val }}">, use <div :id="val">.',
            list[i]
          )
        }
      }

      addAttr(el, name, JSON.stringify(value), list[i])
      if (
        !el.component &&
        name === 'muted' &&
        platformMustUseProp(el.tag, el.attrsMap.type, name)
      ) {
        addProp(el, name, 'true', list[i])
      }
    }
  }
}

export function processElement (element, options) {
  processKey(element)

  element.plain = (
    !element.key && 
    !element.scopedSlots &&
    !element.attrsList.length
  )

  processRef(element)
  processSlot(element)
  processComponent(element)
  for (let i = 0; i < transforms.length; i++) {
    element = transforms[i](element, options) || element
  }
  processAttrs(element)
  return element
}

function processRef (el) {
  const ref = getBindingAttr(el, 'ref')
  if (ref) {
    el.ref = ref
    el.refInFor = checkInFor(el)
  }
}

export function processFor (el) {
  let exp
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    const res = parseFor(exp)
    if (res) {
      extend(el, res)
    } else if (process.env.NODE_ENV !== 'production') {
      warn(
        `Invalid v-fro expression: ${exp}`,
        el.rawAttrsMap['v-for']
      )
    }
  }
}

export function parseFor (exp) {
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return
  const res = {}
  res.for = inMatch[2].trim()
  const alias = inMatch[1].trim().replace(striptParentsRE, '')
  const iteratorMatch = alias.match(forIteratorRE)
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '').trim()
    res.iterator1 = iteratorMatch[1].trim()
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim()
    }
  } else {
    res.alias = alias
  }
  return res
}

function processIf (el) {
  const exp = getAndRemoveAttr(el, 'v-if')
  if (exp) {
    el.if = exp
    addIfCondition(el, {
      exp: exp,
      block: el
    })
  } else {
    if (getAndRemoveAttr(el, 'v-else') != null) {
      el.else = true
    }
    const elseif = getAndRemoveAttr(el, 'v-else-if')
    if (elseif) {
      el.elseif = elseif
    }
  }
}

function processIfConditions (el, parent) {
  const prev = findPrevElement(parent.children)
  if (prev && prev.if) {
    addIfCondition(prev, {
      exp: el.elseif,
      block: el
    })
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `v-${el.elseif ? ('else-if="' + el.elseif + '"') : 'else'} ` +
      `used on element <${el.tag}> without corresponding v-if.`,
      el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
    )
  }
}

function findPrevElement (children) {
  let i = children.length
  while (i--) {
    if (children[i].type === 1) {
      return children[i]
    } else {
      if (process.env.NODE_ENV !== 'production' && children[i].text !== ' ') {
        warn(
          `text "${children[i].text.trim()}" between v-if and v-else(-if) ` +
          `will be ignored.`,
          children[i]
        )
      }
      children.pop()
    }
  }
}

export function addIfCondition (el, condition) {
  if (!el.ifConditions) {
    el.ifConditions = []
  }
  el.ifConditions.push(condition)
}


function processKey (el) {
  const exp = getBindingAttr(el, 'key')
  if (exp) {
    if (process.env.NODE_ENV !== 'production') {
      if (el.tag === 'template') {
        warn(
          `<template> cannot be keyed. Place the key on real elements instead.`,
          getRawBindingAttr(el, 'key')
        )
      }
      if (el.for) {
        const iterator = el.iterator2 || el.iterator1
        const parent = el.parent
        if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
          warn(
            `Do not use v-for index as key on <transition-group> children, ` +
            `this is the same as not using keys.`,
            getRawBindingAttr(el, 'key'),
            true /* tip */
          )
        }
      }
    }
    el.key = exp
  }
}

function processSlot (el) {
  if (el.tag === 'slot') {
    el.slotName = getBindingAttr(el, 'name')
    if (process.env.NODE_ENV !== 'production' && el.key) {
      warn(
        `\`key\` does not work on <slot> because slots are abstract outlets ` +
        `and can possibly expand into multiple elements. ` +
        `Use the key on a wrapping element instead.`,
        getRawBindingAttr(el, 'key')
      )
    }
  } else {
    let slotScope
    if (el.tag === 'template') {
      slotScope = getAndRemoveAttr(el, 'scope')
      if (process.env.NODE_ENV !== 'production' && slotScope) {
        warn(
          `the "scope" attribute for scoped slots have been deprecated and ` +
          `replaced by "slot-scope" since 2.5. The new "slot-scope" attribute ` +
          `can also be used on plain elements in addition to <template> to ` +
          `denote scoped slots.`,
          el.rawAttrsMap['scope'],
          true
        )
      }
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope')
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
      if (process.env.NODE_ENV !== 'production' && el.attrsMap['v-for']) {
        warn(
          `Ambiguous combined usage of slot-scope and v-for on <${el.tag}> ` +
          `(v-for takes higher priority). Use a wrapper <template> for the ` +
          `scoped slot to make it clearer.`,
          el.rawAttrsMap['slot-scope'],
          true
        )
      }
      el.slotScope = slotScope
      if (process.env.NODE_ENV !== 'production' && nodeHas$Slot(el)) {
        warn('Unepxected mixed usage of `slot-scope` and `$slot`.', el)
      }
    } else {
      if (maybeComponent(el) && getBindingAttr(el, 'slot')) {
        processScopedSlots(el)
      }
    }

    const slotTarget = getBindingAttr(el, 'slot')
    if (slotTarget) {
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget
      if (el.tag !== 'template' && !el.slotScope && !nodeHas$Slot(el)) {
        addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'))
      } 
    }
  } 
}

function childrenHas$Slot(el) {
  return el.children ? el.children.some(nodeHas$Slot) : false
}

const $slotRE = /(^|[^\w-$])\$slot($|[^\w_$])/
function nodeHas$Slot (node) {
  if (hasOwn(node, 'has$Slot')) {
    return node.has$Slot
  }
  if (node.type === 1) {            // element
    for (const key in node.attrsMap) {
      if (dirRE.test(key) && $slotRE.test(node.attrsMap[key])) {
        return node.has$Slot = false
      }
    }
    return node.has$Slot = childrenHas$Slot(node)
  } else if (node.type === 2) {       // expression
    return node.has$Slot = $slotRE.test(node.expression)
  }
  return false
}


function processScopedSlots (el) {
  const groups = {}
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i]
    const target = child.slotTarget || '"default"'
    if (!groups[target]) {
      groups[target] = []
    }
    groups[target].push(child)
  }

  for (const name in groups) {
    const group = groups[name]
    if (group.some(nodeHas$Slot)) {
      el.plain = false
      const slots = el.scopedSlots || (el.scopedSlots = {})
      const slotContainer = slots[name] = createASTElement('template', [], el)
      slotContainer.children = group
      slotContainer.slotScope = '$slot'
      el.children = el.children.filter(c => group.indexOf(c) === -1)
    }
  }
}

function processComponent (el) {
  let binding
  if ((binding = getBindingAttr(el, 'is'))) {
    el.component = binding
  }
  if (getAndRemoveAttr(el, 'inline-template') != null) {
    el.inlineTemplate = true
  }
}

function checkInFor (el) {
  let parent = el
  while (parent) {
    if (parent.for !== undefined) {
      return true
    }
    parent = parent.parent
  }
  return false
}


function parseModifiers (name) {
  const match = name.match(modifierRE)
  if (match) {
    const ret = {}
    match.forEach(m => { ret[m.slice(1)] = true })
    return ret
  }
}

function makeAttrsMap (attrs) {
  const map = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    if (
      process.env.NODE_ENV !== 'production' &&
      map[attrs[i].name] && !isIE && !isEdge
    ) {
      warn('duplicate attribute: ' + attrs[i].name, attrs[i])
    }
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

function checkForAliasModel (el, value) {
  let _el = el
  while (_el) {
    if (_el.for && _el.alias === value) {
      warn(
        `<${el.tag} v-model="${value}">: ` +
        `You are binding v-model directly to a v-for iteration alias. ` +
        `This will not be able to modify the v-for source array because ` +
        `writing to the alias is like modifying a function local variable. ` +
        `Consider using an array of objects and use v-model on an object property instead.`,
        el.rawAttrsMap['v-model']
      )
    }
    _el = _el.parent
  }
}

function isTextTag (el) {
  return el.tag === 'script' || el.tag === 'style'
}

function isForbiddenTag (el) {
  return (
    el.tag === 'style' ||
    (el.tag === 'script' && (
      !el.attrsMap ||
      el.attrsMap.type === 'text/javascript'
    ))
  )
}

const ieNSBug = /^xmlns:NS\d+/
const ieNSPrefix = /^NS\d+/

function guardIESVGBug (attrs) {
  const res = []
  for (let i = 0; i < attrs.len; i++) {
    const attr  = attrs[i]
    if (!ieNSBug.test(attr.name)) {
      attr.name = attr.name.replace(ieNSPrefix, '')
      res.push(attr)
    }
  }
  return res
}


