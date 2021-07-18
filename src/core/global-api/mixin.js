import { mergeOptions } from '../util'


export function initMixin (Vue) {
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(mixin)
    return this
  }
}