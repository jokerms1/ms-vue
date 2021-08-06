
import { noop, extend } from 'shared/util';
import { warn as baseWarn } from 'core/util/debug'

function createFunction (code, errors) {
  try {
    return new Function(code)
  } catch(err) {
    errors.push({ err, code })
    return noop
  }
}


export function createCompileToFunctionFn (compile) {
  const cache = Object.create(null)

  return function compileToFunctions (
    template,
    options,
    vm
  ) {
    options = extend({}, options)
    const warn = options.warn || baseWarn
    delete options.warn

    if (process.env.NODE_ENV !== 'production') {
      try {
        new Function('return 1')
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          )
        }
      }
    }

    const key = options.delimiters
      ? String(options.delimiters) + template
      : template
    
    if (cache[key]) {
      return cache[key]
    }

    const compiled = compile(template, options)

    const res = {}
    const fnGenErrors = []
    res.render = createFunction(compile.render, fnGenErrors)
    res.staticRenderFns = compile.staticRenderFns.map(code => {
      return createFunction(code, fnGenErrors)
    })

    if (process.env.NODE_ENV !== 'production') {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn(
          `Failed to generate render function:\n\n` +
          fnGenErrors.map(({ err, code }) => `${err.toString()} in \n\n${code}\n`).join('\n'),
          vm
        )
      }
    }
    return (cache[key] = res)
  }
}
