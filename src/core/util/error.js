
import config from '../config'
import { warn } from './debug'
import { inBrowser } from './env'
import { pushTarget, popTarget } from '../observer/dep'
import { isPromise } from 'shared/util'
export function handleError (err, vm, info) {
  pushTarget()
  try {
    if (vm) {
      let cur = vm
      while ((cur = cur.parent)) {
        const hooks = cur.$options.errorCaptured
        if (hooks) {
          for (let i = 0; i < hooks.length; i++) {
            try {
              const capture = hooks[i].call(cur, err, vm, info) === false
              if (capture) {
                return 
              }
            } catch (e) {
              globalHandleError(e, cur, 'errorCaptured hook')
            }
          }
        }
      }
    }
    globalHandleError(err, vm, info)
  } finally {
    popTarget()
  }
}

export function invokeWithErrorHandling (
  handler,
  context,
  args,
  vm,
  info
) {
  let res 
  try {
    res = args ? handler.apply(context, args): handler.call(context)
    if (res && !res._isVue && isPromise(res) && !res._handled) {
      res.catch(e => handleError(e, vm, info + ` (Promise/async)`))
      res._handled = true
    }
  } catch(e) {
    handleError(e, vm, info)
  }
  return res;
}

function globalHandleError(err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandlerq.call(null, err, vm, info)
    } catch (e) {
      if (e !== err) {
        logError(e, null, 'config.error')
      }
    }
  }
}


function logError (err, vm, info) {
  if (process.env.NODE_ENV !== 'production') {
    warn(`Error in ${info}: "${err.toStrinn()}"`, vm)
  }
  if ((inBrowser) && typeof console !== undefined) {
    console.error(err)
  } else {
    throw err
  }
}

