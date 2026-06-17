import { readFileSync, writeFileSync } from 'fs'
import { createPrivateKey } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certDir = path.join(__dirname, '..', 'dev-certs')
const xml = readFileSync(path.join(certDir, 'rsa-key.xml'), 'utf8')

const tag = (name) => {
  const m = xml.match(new RegExp(`<${name}>([^<]+)</${name}>`))
  return m ? m[1] : undefined
}

const toB64url = (b64) => Buffer.from(b64, 'base64').toString('base64url')

const n = tag('Modulus')
const d = tag('D')
if (!n || !d) {
  console.error('XML RSA inválido')
  process.exit(1)
}

const jwk = {
  kty: 'RSA',
  n: toB64url(n),
  e: 'AQAB',
  d: toB64url(d),
}
for (const [xmlName, jwkName] of [
  ['P', 'p'],
  ['Q', 'q'],
  ['DP', 'dp'],
  ['DQ', 'dq'],
  ['InverseQ', 'qi'],
]) {
  const v = tag(xmlName)
  if (v) jwk[jwkName] = toB64url(v)
}

const priv = createPrivateKey({ key: jwk, format: 'jwk' })
writeFileSync(path.join(certDir, 'key.pem'), priv.export({ format: 'pem', type: 'pkcs8' }))
console.log('key.pem generado')
