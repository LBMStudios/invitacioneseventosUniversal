const fs  = require('fs');
const os  = require('os');
const path = require('path');

const clasprc = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.clasprc.json'), 'utf8'));
const creds   = clasprc.tokens.default;

const SPREADSHEET_ID = '1G2UZRdXCRipVmOecsF5zQMh2jHB--LJqTzjxCxDv1H0';
const SHEET_NAME     = 'Invitados';

async function refreshToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type:    'refresh_token'
    }),
    signal: AbortSignal.timeout(10000)
  });
  const d = await r.json();
  if (d.error) throw new Error('Token refresh failed: ' + d.error + ' - ' + d.error_description);
  return d.access_token;
}

async function sheetsReq(token, method, endpoint, body = null) {
  const opts = {
    method,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000)
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + SPREADSHEET_ID + endpoint, opts);
  const text = await r.text();
  try { return JSON.parse(text); }
  catch { return { _raw: text }; }
}

(async () => {
  console.log('\n  Refrescando token OAuth...');
  let token;
  try {
    token = await refreshToken();
    console.log('  ✅ Token refrescado OK');
  } catch(e) {
    console.log('  ⚠️  Usando token existente: ' + e.message);
    token = creds.access_token;
  }

  console.log('\n  Leyendo info del spreadsheet...');
  const info = await sheetsReq(token, 'GET', '?fields=sheets.properties');
  
  if (info.error) {
    console.log('  ❌ Error API:', JSON.stringify(info.error));
    process.exit(1);
  }
  
  const sheetMeta = info.sheets?.find(s => s.properties.title === SHEET_NAME);
  if (!sheetMeta) {
    console.log('  Hojas disponibles:', info.sheets?.map(s => s.properties.title));
    process.exit(1);
  }
  
  const sheetId = sheetMeta.properties.sheetId;
  console.log('  Hoja encontrada. sheetId:', sheetId);

  const vals = await sheetsReq(token, 'GET', '/values/' + encodeURIComponent(SHEET_NAME + '!A:A'));
  const dataRows = vals.values ? vals.values.length - 1 : 0;
  console.log('  Filas de datos:', dataRows);

  if (dataRows <= 0) {
    console.log('  La hoja ya esta vacia.');
    process.exit(0);
  }

  console.log('  Borrando ' + dataRows + ' fila(s)...');
  const res = await sheetsReq(token, 'POST', ':batchUpdate', {
    requests: [{
      deleteDimension: {
        range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: dataRows + 1 }
      }
    }]
  });

  if (res.error) {
    console.log('  ❌ Error borrando:', JSON.stringify(res.error));
    process.exit(1);
  }

  console.log('  ✅ ' + dataRows + ' filas borradas. Hoja lista para produccion.');
})();
