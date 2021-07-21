import { renderList } from './render-list'
export function installRenderHelpers (target) {
  target._l = renderList
}