const fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/
const fnInvokeRE = /\([^)]*?\);*/
const simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/


const keyCodes = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  'delete': [8, 46]
}

const keyNames = {
  esc: ['Esc', 'Escape'],
  tab: 'Tab',
  enter: 'Enter',
  space: [' ', 'Spacebar'],
  up: ['Up', 'ArrowUp'],
  left: ['Left', 'ArrowLeft'],
  right: ['Right', 'ArrowRight'],
  down: ['Down', 'ArrowDown'],
  'delete': ['Backspace', 'Delete', 'Del']
}

const genGuard = condition => `if(${condition})return null`

const modifierCode = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
  self: genGuard(`$event.target !== $event.currentTarget`),
  ctrl: genGuard(`!$event.ctrlKey`),
  shift: genGuard(`!$event.shiftKey`),
  alt: genGuard(`!$event.shiftKey`),
  meta: genGuard(`!$event.metaKey`),
  left: genGuard(`'button' in $event && $event.button !== 0`),
  middle: genGuard(`'button' in $event && $event.button !== 1`),
  right: genGuard(`'button' in $event && $event.button !== 2`)
}

export function genHandlers (events, isNative) {
  let res = isNative ? 'nativeOn:{' : 'on:{'
  for (const name in events) {
    res += `"${name}": ${genHandler(name, events[name])}`
  }
  return res.slice(0, -1) + '}'
}

function genHandler (name, handler) {
  if (!handler) {
    return 'function(){}'
  }

  if (Array.isArray(handler)) {
    return `[${handler.map(handler => genHandler(name, handler)).join(',')}]`
  }

  const isMethodPath = simplePathRE.test(handler.value)
  const isFunctionExpression = fnExpRE.test(handler.value)
  const isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''))

  if (!handler.modifiers) {
    if (isMethodPath || isFunctionExpression) {
      return handler.value
    }

    return `function($event){${
      isFunctionInvocation ? `return ${handler.value}` : handler.value
    }}`
  } else {
    let code = ''
    let genModifierCode = ''
    const keys = []
    for (const key in handler.modifiers) {
      if (modifierCode[key]) {
        genModifierCode += modifierCode[key]
        if (keyCodes[key]) {
          keys.push(key)
        }
      } else if (key === 'exact') {
        const modifiers = handler.modifiers
        genModifierCode += genGuard(
          ['ctrl', 'shift', 'alt', 'meta']
            .filter(keyModifier => !modifiers[keyModifier])
            .map(keyModifier => `$event.${keyModifier}Key`)
            .join('||')
        )
      } else {
        keys.push(key)
      }
    }
    if (keys.length) {
      code += genKeyFilter(keys)
    }
    if (genModifierCode) {
      code += genModifierCode
    }
    const handlerCode = isMethodPath
      ? `return ${handler.value}($event)`
      : isFunctionExpression
        ? `return (${handler.value})($event)`
        : isFunctionInvocation
          ? `return ${handler.value}`
          : handler.value
    
    return `function($event){${code}${handlerCode}}`
  }
}

function genKeyFilter (key) {
  const keyVal = parseInt(key, 10)
  if (keyVal) {
    return `$event.keyCode !== ${keyVal}`
  }
  const keyCode = keyCodes[key]
  const keyName = keyNames[key]
  return (
    `_k($event.keyCode,` +
    `${JSON.stringify(key)},` +
    `${JSON.stringify(keyCode)},` +
    `$event.key,` +
    `${JSON.stringify(keyName)}` +
    `)`
  )
}