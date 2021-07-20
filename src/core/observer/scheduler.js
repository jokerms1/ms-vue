import config from '../config'
import { callHook, activateChildComponent } from '../instance/lifecycle'

import {
  warn,
  nextTick,
  devtools
} from '../util/index'



const queue = []

export const MAX_UPDATE_COUNT = 100

const activitedChildren = []
let has = {}
let circular = {}
let waiting = false
let flushing = false
let index = 0

function resetSchedulerState () {
  index = queue.length = activitedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}

function flushSchedulerQueue () {
  flushing = true
  let watcher, id

  queue.sort((a, b) => a.id - b.id)

  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    watcher.run()
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break
      }
    }
  }

  const activatedQueue = activitedChildren.slice()
  const updatedQueue = queue.slice()

  resetSchedulerState()

  callActivatedHooks(activatedQueue)
  callUpdateHooks(updatedQueue)

  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}

function callUpdateHooks(queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}

export function queueActivatedComponent (vm) {
  vm._inactive = false
  activitedChildren.push(vm)
}

function callActivatedHooks (queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true)
  }
}

export function queueWatcher (watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }

    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}

