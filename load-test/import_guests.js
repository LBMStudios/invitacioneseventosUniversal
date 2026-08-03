const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SPREADSHEET_ID = '1G2UZRdXCRipVmOecsF5zQMh2jHB--LJqTzjxCxDv1H0';
const SHEET_NAME     = 'Invitados';
const LANDING_URL    = 'https://ua-eventos-uy.web.app/coyote-vs-acme';

const clasprc = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.clasprc.json'), 'utf8'));
const creds   = clasprc.tokens.default;

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
  if (d.error) throw new Error('Token refresh failed: ' + d.error_description);
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
  try { return JSON.parse(text); } catch { return { _raw: text }; }
}

function titleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Datos proporcionados por el usuario
const rawText = `MARIANNA 	TOMASI	FUNCIONARIO SURVIEW	OFICINA	2	AM/MT
LAURA	CAPRIO	SALUD	SEMM	2	AM/MT
ANDRES	RODRIGUEZ	SALUD	SEMM	2	AM/MT
DIEGO 	DE CARLINI	SALUD	SEMM	2	AM/MT
EXTRA	VENDEDOR	SALUD	SEMM	2	AM/MT
KARINA	MACADAR	SALUD	SEMM	2	AM/MT
EXTRA	VENDEDOR	SALUD	SEMM	2	AM/MT
PAOLA	PRADIE	SALUD	SEMM CALL	3	AM/MT
ANDRES	VOELKER	SALUD	SEMM	2	AM/MT
JUAN	BORRELI	SALUD	SEMM	3	AM/MT
EXTRA 	VENDEDOR 	SALUD	SEMM CALL	2	AM/MT
EXTRA 	VENDEDOR	SALUD	SEMM CALL	2	AM/MT
EXTRA 	VENDEDOR	SALUD	SEMM CALL	2	AM/MT
NESTOR 	CONDE	SALUD	ASOC ESPAÑOLA	2	AM/MT
ANGELA	HOFFMAN	SALUD	ASOC ESPAÑOLA	2	AM/MT
MONICA	NAUMIS 	SALUD	ASOC ESPAÑOLA	2	AM/MT
LUCY 	HERNANDEZ	SALUD	ASOC ESPAÑOLA	2	AM/MT
ALBERTO 	YAFFE	SALUD	ASOC ESPAÑOLA	2	AM/MT
EXTRA	VENDEDOR	SALUD	ASOC ESPAÑOLA	2	AM/MT
EXTRA	VENDEDOR	SALUD	ASOC ESPAÑOLA	2	AM/MT
EXTRA	VENDEDOR	SALUD	ASOC ESPAÑOLA	2	AM/MT
EXTRA	VENDEDOR	SALUD	ASOC ESPAÑOLA	2	AM/MT
EXTRA	VENDEDOR	SALUD	ASOC ESPAÑOLA	2	AM/MT
KAREN	RAMILLO	SALUD	EVANGELICO	2	AM/MT
MYRIAM	CARDOZO	SALUD	EVANGELICO	2	AM/MT
JORGE	MUÑOZ	SALUD	EVANGELICO	2	AM/MT
IGNACIO	BARBOT	SALUD	EVANGELICO	2	AM/MT
EXTRA	VENDEDOR	SALUD	EVANGELICO	2	AM/MT
SANTIAGO	DE LUCA	SALUD	CASMU	2	AM/MT
NADIA	NUÑEZ	SALUD	CASMU	2	AM/MT
EXTRA 	VENDEDOR	SALUD	CASMU	2	AM/MT
EXTRA	VENDEDOR	SALUD	CASMU	2	AM/MT
EXTRA 	VENDEDOR	SALUD	CASMU	2	AM/MT
EXTRA	VENDEDOR	SALUD	CASMU	2	AM/MT
ANA	LOPEZ	SALUD	SUMMUM	2	AM/MT
NATALIA	LABAT	SALUD	SUMMUM	2	AM/MT
MARIANA	FIRPO	SALUD	SUMMUM	2	AM/MT
ALEJANDRA	SAAVEDRA	CORREDOR DE SEGUROS	SAAVEDRA SEGUROS	2	MT
DELIA	VILARO	CORREDOR DE SEGUROS	DVS SEGUROS	2	MT
ELISA	COSTA	SALUD	COSEM	2	AM/MT
SANTIAGO	FLEITAS	SALUD	COSEM	2	AM/MT
EXTRA 	VENDEDOR	SALUD	COSEM	2	AM/MT
EXTRA	VENDEDOR	SALUD	COSEM	2	AM/MT
EXTRA	VENDEDOR	SALUD	COSEM	2	AM/MT
JOAQUIN 	BARRETO	SALUD	AMSJ	2	AM/MT
GUSTAVO 	AMORIN	SALUD	ASISTENCIAL MEDICA	2	AM/MT
JOAQUIN 	GUILLEN	SALUD	ASISTENCIAL MEDICA	2	AM/MT
GUSTAVO 	BURGHI	SALUD	ASISTENCIAL MEDICA	2	AM/MT
SILVINA	TORTORELLA	SALUD	ASISTENCIAL MEDICA	2	AM/MT
FERNANDO 	BERVEJILLO	CORREDOR DE SEGUROS		2	MT
LAURA	FERNANDEZ	SALUD	SEGURO AMERICANO	2	AM/MT
FACUNDO	QUIROZ	SALUD	SEGURO AMERICANO	2	AM/MT
FERNANDA 	CABRERA	SALUD	SEGURO AMERICANO	2	AM/MT
EXTRA	DIRECTIVA	SALUD	SEGURO AMERICANO	2	AM/MT
LAURA	SUAREZ	CORREDOR DE SEGUROS	RISSO SEGUROS	2	MT
JORGE	JEREZ	SALUD	MP	2	AM/MT
JORGE 	FERRAGUZ	SALUD	MP	2	AM/MT
NATALIA	CAIMI	BANCO	OCA	2	AM/MT
GABRIELA	PEREZ	BANCO	OCA	2	AM/MT
JUAN PABLO	FERNANDEZ	BANCO	OCA	2	AM/MT
FLORENCIA	DIAZ	BANCO	OCA	2	AM/MT
IGNACIO	MARIÑO	BANCO	OCA	2	AM/MT
RAUL	MONTOSSI	BANCO	ITAU	3	AM/MT
EXTRA	DIRECTIVA	BANCO	ITAU	2	AM/MT
EXTRA	DIRECTIVA	BANCO	ITAU	2	AM/MT
ROSINA	URIOSTE	BANCO	BBVA	2	AM/MT
JOAQUIN 	TOLOSA	BANCO	BBVA	2	AM/MT
AGUSTIN	CIRILI	CORREDOR DE SEGUROS	SBI	2	AM/MT
GUSTAVO 	SPINELLA	CORREDOR DE SEGUROS	SBI	2	AM/MT
FABIAN	GIOVANOLA	CORREDOR DE SEGUROS	SBI	2	AM/MT
CAMILA	MIGALES	CORREDOR DE SEGUROS	SBI	2	AM/MT
YAMILA	BARRERA	CORREDOR DE SEGUROS	SBI	2	AM/MT
EXTRA	DIRECCION	BANCO	SANTANDER	2	AM/UA AR
EXTRA	DIRECCION	BANCO	SANTANDER	2	AM/UA AR
VERONICA	CORREA	CORREDOR DE SEGUROS	PORTO SERVICIOS	2	AM/MT
ANA	CAMIOU	FUNCIONARIO SURVIEW		2	FUNCIONARIO
ANA LAURA	BRITOS	FUNCIONARIO SURVIEW		2	FUNCIONARIO
SILVANA	SAGARIO	EMPRESA	BIG CHESSE	2	MT
CECILIA	MENDEZ	FUNCIONARIO SURVIEW		2	FUNCIONARIO
JIMENA	QUINTANA	FUNCIONARIO SURVIEW		2	FUNCIONARIO
SEBASTIAN	MARTINEZ	FUNCIONARIO SURVIEW		2	FUNCIONARIO
THOILME	SILVA	FUNCIONARIO SURVIEW		3	FUNCIONARIO
GABRIELA 	CONTI	AGENCIA	COIT	2	AB
VICTORIA 	MENDEZ	AGENCIA	JM	2	AB
VALENTINA	MENDEZ	FUNCIONARIO SURVIEW		1	FUNCIONARIO
SOFIA	RAMIREZ	FUNCIONARIO SURVIEW		2	FUNCIONARIO
VICTORIA 	PEREIRA	AGENCIA	CONOSUR	2	AB
MARIO	ETCHESURE	AGENCIA	CONOSUR	2	AB
YHONSON	CHOCA	FUNCIONARIO SURVIEW		2	FUNCIONARIO
PABLO 	ANANIKIAN	AGENCIA	SUNLIVE	2	AB
ALEJANDRO	MENDEZ	FUNCIONARIO SURVIEW		1	FUNCIONARIO
PAULA	ARAMENDIA	FUNCIONARIO SURVIEW		1	FUNCIONARIO
ADRIANA	FRAGA	AGENCIA	NUEVOS MUNDOS	3	ANA C.
DIEGO	CORREA	AGENCIA	MELITOUR	2	AB
GIULIA	BARROS	EMPRESA	TRYOLABS	1	MT
SABRINA	USTINELLI	EMPRESA	TRYOLABS	1	MT
ROSINA	INTROINI	EMPRESA	PWC	2	MT
VERONICA	SANCHIZ	EMPRESA	PWC	2	MT
ADRIANA	RUMBOS	AGENCIA	RUMBOS	2	AB
MAIRA	PEREZ	EMPRESA	GENERSOL DISEL	2	MT
MARIA EUGENIA 	DÍAZ	EMPRESA	BIOERIX	1	MT
FLORENCIA	NAVIA	EMPRESA	BIOERIX	1	MT
ALEJO	QUINTA	EMPRESA	BIOERIX	1	MT
INES	GIRO	EMPRESA	AMS	2	MT
ZOILA	ZELA	EMPRESA	AIR CLASS	2	MT
ABEL	GARCIA	EMPRESA	BRENDISOL	2	MT
INES 	BARRABINO	CORREDOR DE SEGUROS	NGS	2	MT
JOEL	FELDER	CORREDOR DE SEGUROS	EDF	3	MT
CAROLINA	GOÑI	EMPRESA	GREYCON	2	MT
FABIANA	MASINI	CORREDOR DE SEGUROS	MASINI SEGUROS	2	MT
GONZALO	MASINI	CORREDOR DE SEGUROS	MASINI SEGUROS	2	MT
LAURA	RISSO	CORREDOR DE SEGUROS	RISSO SEGUROS	2	MT
VERONICA	BONFIGLIO	EMPRESA	NUEVO SIGLO	2	MT
RICARDO	HAUSMAN	CORREDOR DE SEGUROS	RICARDO HAUSMAN	2	MT
SUSANA	GARCIA	CORREDOR DE SEGUROS	SUSANA GARCIA SEGUROS	2	MT
JORGE 	VIDIELLA	EMPRESA	LABORATORIO LIBRA	2	MT
CRISTOBAL 	FERNANDEZ	CORREDOR DE SEGUROS	FL SEGUROS	2	MT
TRAVELOZ		AGENCIA	TRAVELOZ	2	AB
TRAVELOZ		AGENCIA	TRAVELOZ	2	AB
TRAVELOZ		AGENCIA	TRAVELOZ	2	AB
DESTINICO		AGENCIA	DESTINICO	2	AB
DESTINICO		AGENCIA	DESTINICO	2	AB
DESTINICO		AGENCIA	DESTINICO	2	AB
OM TRAVEL		AGENCIA	OM TRAVEL	2	AB
OM TRAVEL		AGENCIA	OM TRAVEL	2	AB
OM TRAVEL		AGENCIA	OM TRAVEL	2	AB`;

(async () => {
  console.log('\n============================================================');
  console.log('  PROCESANDO E IMPORTANDO LISTA OFICIAL DE INVITADOS');
  console.log('============================================================');

  const token = await refreshToken();

  // 1. Definir los headers completos de la planilla (Col A a O)
  const headers = [
    'Código',
    'Nombre Completo',
    'Email',
    'Teléfono',
    'Estado',
    'Acompañante',
    'Nombre Acompañante',
    'Total Lugares',
    'Fecha Respuesta',
    'Link Invitación',
    'Estado Email',
    'DEMO',
    'Canal',
    'Agencia / Convenio',
    'Referente UA'
  ];

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [headers];

  let counter = 1;

  for (const line of lines) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length < 2) continue;

    // Si es una linea repetida de header o no valida, saltar
    if (parts[0] === 'CANAL - CLIENTE' || parts[0] === 'NOMBRE') continue;

    const nombre   = parts[0] || '';
    const apellido = parts[1] || '';
    const canal    = parts[2] || '';
    const convenio = parts[3] || '';
    const asientos = parseInt(parts[4], 10) || 2;
    const referente = parts[5] || '';

    // Generar código con padding 3 dígitos: UA-001, UA-002, etc.
    const code = 'UA-' + String(counter).padStart(3, '0');
    counter++;

    // Formatear nombre completo
    let fullName = (titleCase(nombre) + ' ' + titleCase(apellido)).trim();
    if (nombre.toUpperCase() === 'EXTRA') {
      fullName = `Extra ${titleCase(apellido)} (${convenio || canal || 'UA'})`;
    } else if (nombre.toUpperCase() === 'TRAVELOZ' || nombre.toUpperCase() === 'DESTINICO' || nombre.toUpperCase() === 'OM TRAVEL') {
      fullName = `Cupo ${titleCase(nombre)} (${convenio || canal || 'Agencia'})`;
    }

    const inviteLink = `${LANDING_URL}?i=${code}`;

    rows.push([
      code,                 // A: Código
      fullName,             // B: Nombre Completo
      '',                   // C: Email (vacío para completar)
      '',                   // D: Teléfono (vacío)
      'Pendiente',          // E: Estado
      'No',                 // F: Acompañante
      '',                   // G: Nombre Acompañante
      asientos,             // H: Total Lugares
      '',                   // I: Fecha Respuesta
      inviteLink,           // J: Link Invitación
      'Pendiente de envío', // K: Estado Email
      '0',                  // L: DEMO
      canal,                // M: Canal
      convenio,             // N: Agencia / Convenio
      referente             // O: Referente UA
    ]);
  }

  console.log(`\n  ✅ Se procesaron ${rows.length - 1} invitados correctamente.`);

  // 2. Limpiar y escribir la hoja Invitados con los nuevos headers y datos
  console.log('\n  Escribiendo datos en Google Sheets...');
  
  // Limpiar hoja completa primero
  await sheetsReq(token, 'POST', '/values/' + encodeURIComponent(SHEET_NAME + '!A1:Z500') + ':clear');

  // Escribir nuevos valores
  const writeRes = await sheetsReq(token, 'PUT', '/values/' + encodeURIComponent(SHEET_NAME + '!A1') + '?valueInputOption=USER_ENTERED', {
    range: `${SHEET_NAME}!A1`,
    majorDimension: 'ROWS',
    values: rows
  });

  if (writeRes.error) {
    console.error('  ❌ Error escribiendo:', JSON.stringify(writeRes.error));
    process.exit(1);
  }

  console.log('  ✅ Lista oficial de invitados importada en Sheets con éxito!');
  console.log(`  Total filas escritas: ${rows.length}`);
  console.log('============================================================\n');
})();
