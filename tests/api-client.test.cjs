const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const source = ts.transpileModule(fs.readFileSync('src/lib/api/client.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function load(fetch) {
  const context = {
    exports: {}, fetch, Response, AbortSignal,
    process: { env: { NODE_ENV: 'development', NEXT_PUBLIC_API_URL: 'http://localhost:8010' } },
  }
  vm.runInNewContext(source, context)
  return context.exports
}

test('dashboard reads use same-origin cookies and a finite deadline', async () => {
  const { apiClient } = load(async (url, options) => {
    assert.equal(url, '/api/auth/me')
    assert.equal(options.credentials, 'include')
    assert.ok(options.signal instanceof AbortSignal)
    return Response.json({ id: 'user' })
  })
  assert.equal((await apiClient.get('/api/auth/me')).id, 'user')
})

test('a stalled request becomes a recoverable network error', async () => {
  const { apiClient, NetworkError } = load(async () => {
    throw new DOMException('Timed out', 'TimeoutError')
  })
  await assert.rejects(apiClient.get('/api/workspaces'), NetworkError)
})

test('a failed refresh connection does not masquerade as a logged-out session', async () => {
  const { apiClient, NetworkError } = load(async (url) => {
    if (url.endsWith('/refresh')) throw new TypeError('Failed to fetch')
    return Response.json({ detail: 'Expired' }, { status: 401 })
  })
  await assert.rejects(apiClient.get('/api/auth/me'), NetworkError)
})

test('refresh server errors remain retryable server errors', async () => {
  const { apiClient, ApiError } = load(async (url) =>
    Response.json({}, { status: url.endsWith('/refresh') ? 503 : 401 }))
  await assert.rejects(apiClient.get('/api/auth/me'), (err) => err instanceof ApiError && err.status === 503)
})

test('invalid sessions return 401 without an endless refresh loop', async () => {
  let calls = 0
  const { apiClient, ApiError } = load(async () => {
    calls++
    return Response.json({ detail: 'Expired' }, { status: 401 })
  })
  await assert.rejects(apiClient.get('/api/auth/me'), (err) => err instanceof ApiError && err.status === 401)
  assert.equal(calls, 2)
})
