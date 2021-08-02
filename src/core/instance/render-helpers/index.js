import { toNumber, toString, looseEqual, looseIndexOf} from 'shared/util'
import { renderSlot } from './render-slot'
import { renderList } from './render-list'
import { bindObjectProps } from './bind-object-props'
import { bindObjectListeners } from './bind-object-listeners' 
import { resolveScopedSlots } from './resolve-slots'
export function installRenderHelpers (target) {
  target._n = toNumber
  target._s = toString
  target._l = renderList,
  target._t = renderSlot,
  target._q = looseEqual,
  target._i = looseIndexOf,
  target._b = bindObjectProps,
  target._u = resolveScopedSlots,
  target._g = bindObjectListeners
}