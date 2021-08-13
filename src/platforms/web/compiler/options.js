
import { isUnaryTag, canBeLeftOpenTag } from './util'
import modules from './modules/index'
import directives from './directives/index'
import { genStaticKeys } from 'shared/util'

export const baseOptions = {
  expectHTML: true,
  modules,
  directives,
  isUnaryTag,
  canBeLeftOpenTag,
  staticKeys: genStaticKeys(modules)
}