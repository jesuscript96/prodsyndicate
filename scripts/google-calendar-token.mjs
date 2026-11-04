#!/usr/bin/env node
/**
 * Obtiene, una sola vez, el refresh token con el que la web consulta la disponibilidad y crea
 * las llamadas en tu Google Calendar. Guía completa: docs/agenda-google.md.
 *
 *   GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… npm run agenda:token
 *
 * Abre el navegador, inicias sesión con la cuenta dueña del calendario, aceptas y el token
 * aparece en esta terminal. No se guarda en ningún archivo.
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET. Míralo en docs/agenda-google.md.');
  process.exit(1);
}

// Permisos mínimos: ver ocupado/libre y gestionar eventos. Se pueden cambiar con GOOGLE_SCOPES.
const scopes =
  process.env.GOOGLE_SCOPES ??
  'https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.events';
const state = randomBytes(16).toString('hex');
let redirectUri = '';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', redirectUri);
  if (url.pathname !== '/') return res.writeHead(404).end();
  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  if (error || !code || url.searchParams.get('state') !== state) {
    res.writeHead(400).end(`No se ha podido autorizar (${error ?? 'respuesta incompleta'}). Vuelve a la terminal.`);
    console.error(`\nGoogle respondió: ${error ?? 'sin código o con un estado distinto'}.`);
    server.close();
    process.exitCode = 1;
    return;
  }
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const data = await r.json();
    if (!data.refresh_token) throw new Error(data.error_description ?? data.error ?? 'sin refresh_token');
    res.end('Listo. Ya puedes cerrar esta pestaña y volver a la terminal.');
    console.log('\nCopia esta línea en .env.local y en las variables de entorno de Vercel:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${data.refresh_token}\n`);
  } catch (e) {
    res.writeHead(500).end('No se ha podido obtener el token. Mira la terminal.');
    console.error(`\nNo se ha podido obtener el token: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  }
  server.close();
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  redirectUri = `http://127.0.0.1:${port}`;
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  }).toString();
  console.log('Abre este enlace e inicia sesión con la cuenta dueña del calendario:\n');
  console.log(`${auth}\n`);
  if (process.platform === 'darwin') spawn('open', [auth.toString()], { stdio: 'ignore', detached: true }).unref();
});
