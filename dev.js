// 一键启动：同时拉起后端（8787）与前端（5173），Ctrl+C 一起退出
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = __dirname

const backendDir = path.join(ROOT, 'backend')
const frontendDir = path.join(ROOT, 'frontend')

const colors = { backend: '\x1b[36m[后端]\x1b[0m', frontend: '\x1b[35m[前端]\x1b[0m' }

function run(name, cmd, args, cwd, env) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, shell: process.platform === 'win32' })
  child.stdout.on('data', (d) => process.stdout.write(`${colors[name]} ${d}`))
  child.stderr.on('data', (d) => process.stderr.write(`${colors[name]} ${d}`))
  child.on('exit', (code) => { if (code) console.error(`${name} 退出，码 ${code}`) })
  return child
}

const backend = run('backend', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], backendDir, { PORT: '8787' })
const frontend = run('frontend', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], frontendDir, { PORT: '5173' })

function shutdown() {
  console.log('\n正在关闭服务…')
  backend.kill('SIGTERM'); frontend.kill('SIGTERM')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
