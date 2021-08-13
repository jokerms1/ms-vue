import { 
  baseWarn 
} from "compiler/helpers";
import { parseText } from 'compiler/parser/text-parser'
import { getAndRemoveAttr, getBindingAttr} from "ompiler/helpers";
import { parseStyleText } from "../../util/style";


function transformNode (el, options) {
  const warn = options.warn || baseWarn
  const staticStyle = getAndRemoveAttr(el, 'style')

  if (staticStyle) {
    if (process.env.NODE_ENV !== 'production') {
      const res = parseText(staticStyle, options.delimiters)
      if (res) {
        warn(
          `style="${staticStyle}": ` +
          'Interpolation inside attributes has been removed.' + 
          'Use v-bind or the colon shorthand instead. For example, ' + 
          'instead of <div style="{{val}}">, use <div :style="val">.',
          el.rawAttrsMap['style']
        )
      }
    }
    el.staticStyle = JSON.stringify(parseStyleText(staticStyle))
  }

  const styleBinding = getBindingAttr(el, 'style', false)
  if (styleBinding) {
    el.styleBinding = styleBinding
  }
}

function genData (el) {
  let data = ''
  if (el.staticStyle) {
    data += `staticStyle:${el.staticStyle},`
  }
  if (el.styleBinding) {
    data += `style:(${el.styleBinding})`
  }
  return data
}

export default {
  staticKeys: ['staticStyle'],
  transformNode,
  genData
}