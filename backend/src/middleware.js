// 鉴权中间件：从 Authorization: Bearer <token> 解析当前用户
import { db } from './db.js'

export function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: '未登录或登录已过期' })
  const uid = db.data.tokens[token]
  if (!uid || !db.data.users[uid]) return res.status(401).json({ error: '登录态无效，请重新登录' })
  req.uid = uid
  next()
}

/** 把作品/草稿的归属字段补齐，并附带当前用户是否点赞 */
export function decorateWork(work, uid) {
  return {
    ...work,
    likes: work.likedBy?.length ?? work.likes ?? 0,
    liked: !!work.likedBy?.includes(uid),
  }
}
