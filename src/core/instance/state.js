// import {
//   observe,
//   toggleObserving
// } from '../observer/index'



export function initState (vm) {
  vm._wathcers = []
  // const opts = vm.$options
  // if (opts.props) initProps(vm, opts.props)
  // if (opts.methods) initMethods(vm, opts.methods)
  // if (opts.data) {
  //   initData(vm)
  // } else {
  //   observe(vm._data = {}, true)
  // }
  // if (opts.computed) initComputed(vm, opts.computed)
  // if (opts.watch && opts.watch !== nativeWatch) {
  //   initWatch(vm, opts.watch)
  // }
}

// function initProps(vm, propsOptions) {
//   const propsData = vm.$options.propsData || {}
//   const props = vm._props = {}

//   const keys = vm.$options._propKeys = []
//   const isRoot = !vm.$parent

//   if (!isRoot) {
//     toggleObserving(false)
//   }
// }