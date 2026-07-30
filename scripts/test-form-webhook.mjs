import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildContactFormPayload, submitContactForm } from '../src/lib/submitContactForm.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'))
}

async function withMockWebhook(handler, run) {
  const server = createServer((req, res) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8')
      handler(req, res, body)
    })
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const url = `http://127.0.0.1:${port}/webhook/ledgerxtr-contact`

  try {
    await run(url)
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
  }
}

async function main() {
  const workflow = loadJson('n8n/ledgerxtr-contact-form.workflow.json')
  assert.equal(workflow.name, 'LedgerXtR Contact Form')
  assert.ok(workflow.nodes.some((n) => n.type === 'n8n-nodes-base.webhook'))
  assert.ok(workflow.nodes.some((n) => n.type === 'n8n-nodes-base.googleSheets'))
  assert.ok(workflow.nodes.some((n) => n.type === 'n8n-nodes-base.microsoftOutlook'))

  const headers = readFileSync(join(root, 'n8n/google-sheet-headers.csv'), 'utf8').trim().split(',')
  assert.ok(headers.includes('Full Name'))
  assert.ok(headers.includes('Services Needed'))
  assert.ok(headers.includes('Submitted At'))

  const payload = buildContactFormPayload({
    fullName: ' Terence Absolon ',
    email: 'test@example.com',
    businessName: 'Absolon Designs',
    orgType: 'Small Business',
    industry: 'Design',
    yearsInBusiness: '5+ years',
    servicesNeeded: ['Monthly bookkeeping', 'Financial reporting'],
    accountingSoftware: 'QuickBooks Online',
    booksStatus: 'Need full cleanup',
    startTimeline: 'Just exploring',
    transactionVolume: 'Medium (100–300)',
    additionalNotes: 'Please call next week.',
    preferredNextStep: 'Email follow-up',
  })

  assert.equal(payload.full_name, 'Terence Absolon')
  assert.equal(payload.email, 'test@example.com')
  assert.equal(payload.services_needed_text, 'Monthly bookkeeping, Financial reporting')
  assert.equal(payload.source, 'ledgerxtr.com')
  assert.equal(payload.status, 'new')
  assert.ok(payload.submitted_at)
  assert.match(payload.message, /Monthly bookkeeping/)

  let received = null
  await withMockWebhook((req, res, body) => {
    received = {
      method: req.method,
      contentType: req.headers['content-type'],
      body,
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify({ ok: true }))
  }, async (url) => {
    await submitContactForm(url, payload)
  })

  assert.equal(received.method, 'POST')
  assert.match(received.contentType, /text\/plain/)
  const parsed = JSON.parse(received.body)
  assert.equal(parsed.full_name, 'Terence Absolon')
  assert.equal(parsed.email, 'test@example.com')

  let failed = false
  await withMockWebhook((_req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('upstream failed')
  }, async (url) => {
    try {
      await submitContactForm(url, payload)
    } catch (error) {
      failed = true
      assert.match(String(error.message), /500/)
    }
  })
  assert.equal(failed, true)

  console.log('test:form passed')
}

main().catch((error) => {
  console.error('test:form failed')
  console.error(error)
  process.exit(1)
})
