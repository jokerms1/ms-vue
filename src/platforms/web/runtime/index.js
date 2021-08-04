import Vue from 'core/index'
import { inBrowser } from '/core/util';
import { mountComponent } from 'core/instance/lifecycle'

import { patch } from './patch'

import {
  query,
} from 'web/util/index'

Vue.prototype.__patch__ = inBrowser ? patch : null

Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

export default Vue;