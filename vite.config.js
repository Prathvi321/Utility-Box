import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load local .env file for local functions execution
const envPath = path.resolve(__dirname, '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const val = parts.slice(1).join('=').trim()
      process.env[key] = val
    }
  })
}

// Vite plugin to route and execute Netlify functions locally
function localNetlifyFunctions() {
  return {
    name: 'local-netlify-functions',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/.netlify/functions/')) {
          const functionName = req.url.split('/.netlify/functions/')[1].split('?')[0]
          const functionPath = path.resolve(__dirname, `netlify/functions/${functionName}.js`)

          if (fs.existsSync(functionPath)) {
            try {
              let body = ''
              req.on('data', chunk => {
                body += chunk
              })

              req.on('end', async () => {
                try {
                  // Bypass ES module cache using dynamic import with query parameter
                  const fileUrl = `file://${functionPath.replace(/\\/g, '/')}`
                  const handlerModule = await import(`${fileUrl}?t=${Date.now()}`)
                  const handler = handlerModule.handler || handlerModule.default

                  const event = {
                    httpMethod: req.method,
                    body: body,
                    headers: req.headers,
                    queryStringParameters: Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)
                  }

                  const result = await handler(event, {})
                  res.writeHead(result.statusCode || 200, {
                    'Content-Type': 'application/json',
                    ...(result.headers || {})
                  })
                  res.end(result.body || '')
                } catch (innerErr) {
                  console.error(`Error running function ${functionName}:`, innerErr)
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: innerErr.message }))
                }
              })
              return
            } catch (err) {
              console.error(`Local execution setup error:`, err)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: err.message }))
              return
            }
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localNetlifyFunctions()],
})
