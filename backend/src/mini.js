// 极简 Express 兼容层（零依赖，仅用 Node 标准库）
// 提供 app.use / get / post / put / delete / listen、express.Router()、express.json()
// 足以支撑本项目的路由需求；生产可平滑替换为真正的 Express + 数据库。
import http from 'node:http'

class Router {
  constructor() { this.routes = [] }
  _add(method, path, handlers) { this.routes.push({ method, path, handlers: [...handlers] }) }
  get(p, ...h) { this._add('GET', p, h) }
  post(p, ...h) { this._add('POST', p, h) }
  put(p, ...h) { this._add('PUT', p, h) }
  delete(p, ...h) { this._add('DELETE', p, h) }
}

function matchPath(pattern, pathname) {
  const pp = pattern.split('/').filter(Boolean)
  const sp = pathname.split('/').filter(Boolean)
  if (pp.length !== sp.length) return null
  const params = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(sp[i])
    else if (pp[i] !== sp[i]) return null
  }
  return params
}

function runHandlers(handlers, req, res, next) {
  let i = 0
  const nxt = (err) => {
    if (err) return next(err)
    if (i < handlers.length) handlers[i++](req, res, nxt)
    else next()
  }
  nxt()
}

function jsonMw(req, res, next) {
  if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'HEAD' || req.method === 'OPTIONS') return next()
  let data = ''
  req.on('data', (c) => (data += c))
  req.on('end', () => { try { req.body = data ? JSON.parse(data) : {} } catch { req.body = {} } next() })
}

function corsMw(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }
  next()
}

function makeApp() {
  const layers = []
  const app = {
    layers,
    use(pathOrHandler, maybeHandler) {
      let prefix = null
      let target = pathOrHandler
      if (typeof pathOrHandler === 'string') {
        prefix = pathOrHandler.replace(/\/+$/, '')
        target = maybeHandler
      }
      if (target instanceof Router) {
        // 挂载子路由：把其所有路由拼上前缀
        for (const r of target.routes) {
          layers.push({ method: r.method, path: prefix + r.path, handlers: r.handlers })
        }
      } else if (typeof target === 'function') {
        layers.push({ mw: true, path: prefix, handler: target })
      }
      return app
    },
    get(p, ...h) { layers.push({ method: 'GET', path: p, handlers: h }) },
    post(p, ...h) { layers.push({ method: 'POST', path: p, handlers: h }) },
    put(p, ...h) { layers.push({ method: 'PUT', path: p, handlers: h }) },
    delete(p, ...h) { layers.push({ method: 'DELETE', path: p, handlers: h }) },
    listen(port, cb) {
      const server = http.createServer((req, res) => {
        const u = new URL(req.url, 'http://localhost')
        req.pathname = u.pathname
        req.query = Object.fromEntries(u.searchParams)
        res.json = (obj) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)) }
        res.status = (c) => { res.statusCode = c; return res }
        let i = 0
        const next = (err) => {
          if (err) { console.error('[error]', err); res.statusCode = 500; return res.end(JSON.stringify({ error: '服务器内部错误' })) }
          while (i < layers.length) {
            const layer = layers[i++]
            if (layer.mw) {
              if (!layer.path || req.pathname.startsWith(layer.path)) return layer.handler(req, res, next)
              continue
            }
            if (layer.method === req.method) {
              const params = matchPath(layer.path, req.pathname)
              if (params) { req.params = params; return runHandlers(layer.handlers, req, res, next) }
            }
          }
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Not Found' }))
        }
        next()
      })
      server.listen(port, cb)
      return server
    },
  }
  return app
}

function express() { return makeApp() }
// Router 工厂：与真实 Express 一致，express.Router() 返回新实例（无需 new）
express.Router = function () { return new Router() }
express.json = () => jsonMw
express.static = () => () => {}

export default express
