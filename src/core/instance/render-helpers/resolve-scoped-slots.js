export function resolveScopedSlots (
  fns,
  res,
  hasDynamicKeys,
  contentHashKey
) {
  res = res || { $stable: !hasDynamicKeys }
  for (let i = 0; i < fns.length; i++) {
    const slot = fns[i]
    if (Array.isArray(slot)) {
      resolveScopedSlots(slot, res, hasDynamicKeys)
    } else if (slot) {
      if (slot.proxy) {
        slot.fn.proxy = true
      }

      res[slot.key] = slot.fn
    }
  }
  if (contentHashKey) {
    res.$key = contentHashKey
  }
  return res
}