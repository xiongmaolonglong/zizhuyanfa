// Express 4.x 不自动捕获 async handler 内的 rejected promise，
// 会导致进程崩溃。此 patch 在 Router 静态方法上包装所有 route 方法，
// 自动将 async 函数的 rejected promise 传给 next(err)。
// 只需在 app.js 中 require 一次，所有路由自动生效。
const Router = require('express').Router

const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']

for (const method of httpMethods) {
  const original = Router[method]
  if (!original) continue

  Router[method] = function (path) {
    // arguments: path, handler1, handler2, ...
    const args = [path]
    for (let i = 1; i < arguments.length; i++) {
      const handler = arguments[i]
      if (typeof handler !== 'function') {
        args.push(handler)
        continue
      }
      args.push(function wrappedHandler(req, res, next) {
        const result = handler(req, res, next)
        if (result && typeof result.catch === 'function') {
          result.catch(next)
        }
        return result
      })
    }
    return original.apply(this, args)
  }
}
