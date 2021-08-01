import { isRegExp, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'

function getComponentName (opts) {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  return false
}


function pruneCache (keepAliveInstance, filter) {
  const { cache, keys, _vnode } = keepAliveInstance
  for (const key in cache) {
    const entry = cache[key]
    if (entry) {
      const name = entry.name
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}


function pruneCacheEntry(cache, key, keys, current) {
  const entry = cache[key]
  if (entry && (!current || entry.tag !== current.tag)) {
    entry.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}

export default {
  name: 'keep-alive',
  abstract: true,

  props: ['include', 'exclue', 'max'],

  methods: {
    cacheVNode () {
      const { cache, keys, vnodeToCache, keyToCache } = this
      if (vnodeToCache) {
        const { tag, componentInstance, componentOptions } = vnodeToCache
        cache[keyToCache] = {
          name: getComponentName(componentOptions),
          tag,
          componentInstance
        }
        keys.push(keyToCache)
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
        this.vnodeToCache = null
      }
    }
  },

  created () {
    this.cache = Object.create(null)
    this.keys = []
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mountd () {
    this.cacheVNode()
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })

    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  render () {
    const slot = this.$slot.default
    const vnode = getFirstComponentChild(slot)
    const componentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      const name = getComponentName(componentOptions)
      const { include, exclude } = this
      if (
        (include && (!name || !matches(include, name))) ||
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      const key = vnode.key == null
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key

      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        remove(keys, key)
        keys.push(key)
      } else {
        this.vnodeToCache = vnode
        this.keyToCache = key
      }
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
  
}