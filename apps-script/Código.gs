/**
 * Backend Google Apps Script para Invitaciones Universal Assistance
 * Función Especial Coyote vs. Acme - Movie Montevideo Shopping
 * 
 * VERSIÓN COMPLETA con:
 * - doGet / doPost (API pública)
 * - Reporte Cine Movie (pestaña automática)
 * - Botones WhatsApp (Columna K)
 * - Recordatorio 24hs antes (automático y manual)
 * - Emails de confirmación y recordatorio estilo Ticket VIP con QR
 * - Menú personalizado "🍿 UA Eventos"
 * - Generación automática de códigos faltantes
 */

const SPREADSHEET_ID = '1G2UZRdXCRipVmOecsF5zQMh2jHB--LJqTzjxCxDv1H0';
const SHEET_INVITADOS = 'Invitados';
const SHEET_CONFIG = 'Configuracion';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';
const LOGO_EMAIL_URL = 'https://ua-eventos-uy.web.app/assets/logo-ua-white.png';
const SENDER_EMAIL = 'lucasb@ua.com.uy';

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 1: API PÚBLICA (doGet / doPost)
// ═══════════════════════════════════════════════════════════════════════

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const page   = params.page   || '';
  const action = params.action || 'guest';

  // ── Panel de administración ──────────────────────────────────────────
  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('UA Eventos — Panel de Administración')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── API pública (landing del invitado) ───────────────────────────────
  try {
    let payload;

    if (action === 'guest') {
      payload = getGuest_(params.code || '');
    } else if (action === 'guestListCheckin') {
      payload = getGuestListCheckin_();
    } else if (action === 'health') {
      payload = { ok: true, service: 'UA RSVP', timestamp: new Date().toISOString() };
    } else {
      payload = { ok: false, error: 'Acción no válida.' };
    }

    return jsonOrJsonp_(payload, params.callback);
  } catch (error) {
    return jsonOrJsonp_({ ok: false, error: error.message || String(error) }, params.callback);
  }
}


function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);

    const p = e && e.parameter ? e.parameter : {};
    const action = clean_(p.action);
    const code = clean_(p.code);

    if (action === 'markIngress') {
      const res = markIngress_(code);
      return ContentService
        .createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'addVipDoor') {
      const res = addVipDoor_(clean_(p.name), clean_(p.companionName), clean_(p.seats));
      return ContentService
        .createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const updatedGuestName = clean_(p.guestName);
    const attendance = clean_(p.attendance);
    const companion = clean_(p.companion);
    const companionName = clean_(p.companionName);
    const email = clean_(p.email);
    const phone = clean_(p.phone);
    const testMode = clean_(p.testMode) === '1';
    const allowUpdate = clean_(p.allowUpdate) === '1';

    if (!code) throw new Error('Falta el código de invitación.');
    if (!['yes', 'no'].includes(attendance)) throw new Error('La confirmación no es válida.');

    const sheet = getSheet_(SHEET_INVITADOS);
    let row = findGuestRow_(sheet, code);

    // Si el código no existe (ej. UA-DEMO-001 o prueba), crearlo en la planilla automáticamente
    if (!row) {
      const nextRow = Math.max(sheet.getLastRow() + 1, 2);
      sheet.getRange(nextRow, 1, 1, 2).setValues([[code, updatedGuestName || 'Invitado de prueba']]);
      row = nextRow;
    }

    const values = sheet.getRange(row, 1, 1, 11).getValues()[0];
    let guestName = updatedGuestName || values[1] || 'Invitado VIP';
    const currentStatus = clean_(values[4]);

    const canOverwriteForTesting = testMode && code === 'UA-DEMO-001';

    if (currentStatus && currentStatus !== 'Pendiente' && !canOverwriteForTesting && !allowUpdate) {
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: true,
          alreadyAnswered: true,
          status: currentStatus,
          totalSeats: Number(values[7] || 0),
          guestName: values[1]
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Actualizar Nombre del Invitado en Columna B si fue corregido
    if (updatedGuestName && updatedGuestName !== values[1]) {
      sheet.getRange(row, 2).setValue(updatedGuestName);
      guestName = updatedGuestName;
    }

    const isAttending = attendance === 'yes';
    const bringsCompanion = isAttending && companion === 'yes';
    if (bringsCompanion && !companionName) throw new Error('Ingresá el nombre del acompañante.');

    const status = isAttending ? 'Confirmado' : 'No asiste';
    const companionValue = bringsCompanion ? 'Sí' : 'No';
    const totalSeats = isAttending ? (bringsCompanion ? 2 : 1) : 0;
    const timestamp = new Date();

    // C Correo | D Teléfono | E Estado | F Lleva acompañante | G Nombre acompañante | H Total lugares | I Fecha respuesta
    sheet.getRange(row, 3, 1, 7).setValues([[
      email || values[2],
      phone || values[3],
      status,
      companionValue,
      bringsCompanion ? companionName : '',
      totalSeats,
      timestamp
    ]]);

    let mailStatus = '';

    if (isAttending && (email || values[2])) {
      const targetEmail = email || values[2];
      try {
        sendConfirmationEmail_(targetEmail, guestName, totalSeats, bringsCompanion ? companionName : '', code);
        mailStatus = `Correo enviado a ${targetEmail}`;
      } catch (mailError) {
        mailStatus = `Confirmado, pero no se pudo enviar el correo: ${mailError.message || mailError}`;
      }
    } else if (isAttending) {
      mailStatus = 'Confirmado sin correo electrónico';
    } else {
      mailStatus = 'No asiste';
    }

    sheet.getRange(row, 11).setValue(mailStatus); // Columna K = mailStatus

    // Actualizar automáticamente la pestaña "Reporte_Cine_Movie" en tiempo real
    try {
      generarReporteCine_Silent_();
    } catch (_) {}

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        status,
        totalSeats,
        guestName,
        mailStatus
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: error.message || String(error)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 2: LECTURA DE DATOS
// ═══════════════════════════════════════════════════════════════════════

function getGuest_(code) {
  code = clean_(code);

  if (!code) {
    return { ok: false, error: 'Falta el código de invitación.' };
  }

  const sheet = getSheet_(SHEET_INVITADOS);
  const row = findGuestRow_(sheet, code);

  if (!row) {
    return { ok: false, error: 'No encontramos esta invitación.' };
  }

  const values = sheet.getRange(row, 1, 1, 11).getDisplayValues()[0];
  const config = getConfig_();

  return {
    ok: true,
    guest: {
      code: values[0],
      name: values[1],
      email: values[2],
      phone: values[3],
      status: values[4],
      hasCompanion: values[5] === 'Sí',
      companionName: values[6],
      totalSeats: Number(values[7] || 0),
      responseDate: values[8],
      // Col J (index 9) = LinkInvitacion — se ignora en la respuesta pública
      mailStatus: values[10]
    },
    event: {
      name: config['Nombre del evento'] || 'Función especial Coyote vs. Acme',
      brand: config['Marca'] || 'Universal Assistance',
      date: config['Fecha'] || '27/08/2026',
      time: config['Hora'] || '20:00',
      arrivalTime: config['Hora sugerida de llegada'] || '19:30',
      venue: config['Lugar'] || 'Movie Montevideo Shopping',
      mapsUrl: config['Dirección / Maps'] || 'https://maps.google.com/?q=Movie+Montevideo+Shopping',
      intro: config['Texto principal'] || 'Queremos compartir contigo una función especial.',
      confirmationMessage: config['Mensaje de confirmación'] || 'Tu asistencia quedó registrada.'
    }
  };
}

function findGuestRow_(sheet, code) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const cleanTargetCode = String(code || '').toLowerCase().trim();
  const codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < codes.length; i++) {
    if (String(codes[i][0] || '').toLowerCase().trim() === cleanTargetCode) {
      return i + 2;
    }
  }
  return 0;
}

function getConfig_() {
  const sheet = getSheet_(SHEET_CONFIG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getDisplayValues();
  return rows.reduce((acc, row) => {
    if (row[0]) acc[row[0]] = row[1];
    return acc;
  }, {});
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 3: HELPERS DE SPREADSHEET
// ═══════════════════════════════════════════════════════════════════════

function getActiveOrOpenSpreadsheet_() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (_) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet_(name) {
  const ss = getActiveOrOpenSpreadsheet_();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`No existe la pestaña "${name}".`);
  return sheet;
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 4: MENÚ Y TRIGGERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Disparador automático al editar manualmente la pestaña Invitados
 */
function onEdit(e) {
  try {
    if (!e || !e.range) {
      generarReporteCine_Silent_();
      return;
    }
    const sheetName = e.range.getSheet().getName();
    if (sheetName === SHEET_INVITADOS) {
      generarReporteCine_Silent_();
    }
  } catch (err) {
    console.error('Error en onEdit:', err);
  }
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🍿 UA Eventos')
    .addItem('📊 Generar Reporte para Cine (Movie)', 'generarReporteCine')
    .addItem('🔗 Generar Links de Invitación (Columna J)', 'generarLinksInvitacion')
    .addItem('📨 Enviar Invitaciones por Email', 'enviarInvitaciones')
    .addSeparator()
    .addItem('✅ Activar Columna de Selección DEMO (Col L)', 'prepararColumnaDEMO')
    .addItem('🧪 Enviar DEMO a Seleccionados (Col L)', 'enviarInvitacionesDEMO')
    .addSeparator()
    .addItem('💬 Generar Botones de WhatsApp', 'generarLinksWhatsApp')
    .addItem('⏰ Programar Recordatorio Automático (24hs antes)', 'crearActivadorRecordatorioAuto')
    .addItem('✉️ Enviar Recordatorio Ahora (Manual)', 'enviarRecordatorioAConfirmados')
    .addItem('🎲 Generar Códigos Faltantes', 'generarCodigosFaltantes')
    .addItem('📥 Importar Lista Externa', 'importarListaExterna')
    .addItem('🧪 Cargar Invitados de Prueba', 'agregarInvitadosDePrueba')
    .addItem('🗑️ Vaciar Lista de Invitados', 'vaciarListaInvitados')
    .addItem('✉️ Enviar Correo de Prueba', 'enviarMailDePrueba')
    .addToUi();
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 5: REPORTE CINE MOVIE (pestaña Reporte_Cine_Movie)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Función pública con alerta UI
 */
function generarReporteCine() {
  const freeSeats = generarReporteCine_Silent_();
  SpreadsheetApp.getUi().alert(`✅ Reporte generado con éxito. Asientos disponibles: ${freeSeats}`);
}

/**
 * Función interna de generación silenciosa para automatizaciones
 */
function generarReporteCine_Silent_() {
  const ss = getActiveOrOpenSpreadsheet_();
  const sheetInv = ss.getSheetByName(SHEET_INVITADOS);
  if (!sheetInv) return;

  const lastRow = sheetInv.getLastRow();
  if (lastRow < 2) return;

  let reportSheet = ss.getSheetByName('Reporte_Cine_Movie');
  if (!reportSheet) {
    reportSheet = ss.insertSheet('Reporte_Cine_Movie');
  } else {
    reportSheet.clear();
    reportSheet.getRange(1, 1, reportSheet.getMaxRows(), reportSheet.getMaxColumns()).clearDataValidations();
    reportSheet.clearConditionalFormatRules();
  }

  try {
    reportSheet.setHiddenGridlines(false);
  } catch (_) {}

  // Usar getDisplayValues() para capturar exactamente los textos desplegables de Google Sheets
  const data = sheetInv.getRange(2, 1, lastRow - 1, 10).getDisplayValues();
  
  // Filtrar todos los confirmados (sin importar mayúsculas/minúsculas ni espacios)
  const confirmed = data.filter(r => {
    const status = String(r[4] || '').toLowerCase().trim();
    return status.includes('confirmad');
  });

  let totalSeatsSum = 0;
  let singleSeatsCount = 0;
  let doubleSeatsCount = 0;
  const rowsToInsert = [];

  confirmed.forEach((r, idx) => {
    const code = r[0] || `UA-${idx+1}`;
    const name = r[1] || 'Invitado';
    const companionVal = String(r[5] || '').toLowerCase().trim() === 'sí' || String(r[5] || '').toLowerCase().trim() === 'si';
    const companionName = r[6] || '-';
    
    // Si la celda de asientos está vacía, calcular 2 si lleva acompañante o 1 si es individual
    const rawSeats = Number(r[7]);
    const seats = (!isNaN(rawSeats) && rawSeats > 0) ? rawSeats : (companionVal ? 2 : 1);

    totalSeatsSum += seats;
    if (seats >= 2) doubleSeatsCount++;
    else singleSeatsCount++;

    rowsToInsert.push([
      idx + 1,
      code,
      name,
      companionVal ? 'Con Acompañante (2)' : 'Individual (1)',
      companionName,
      seats,
      false,
      ''
    ]);
  });

  // 1. TÍTULO PRINCIPAL Y ENCABEZADO RESUMEN
  reportSheet.getRange('A1:H1').merge()
    .setValue('UNIVERSAL ASSISTANCE — LISTA DE ACREDITACIÓN DE SALA')
    .setFontWeight('bold')
    .setFontSize(14)
    .setFontColor('#ffffff')
    .setBackground('#071938')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  reportSheet.setRowHeight(1, 38);

  reportSheet.getRange('A2:H2').merge()
    .setValue('Función Especial: Coyote vs. Acme | Fecha: 27/08/2026 - 20:00 hs | Lugar: Movie Montevideo Shopping')
    .setFontWeight('bold')
    .setFontSize(10)
    .setFontColor('#071938')
    .setBackground('#e2e8f0')
    .setHorizontalAlignment('center');

  // Capacidad total de la sala (300 personas)
  const maxCapacity = 300;
  const freeSeats = maxCapacity - totalSeatsSum;

  // Cajas resumen con Alerta cuando quedan menos de 60 asientos disponibles
  let freeBgColor = '#dcfce7'; // Verde (> 60 libres)
  let freeTextColor = '#15803d';
  let freeStatusText = `${freeSeats} Libres`;

  if (freeSeats <= 0) {
    freeBgColor = '#fee2e2'; // Rojo (Sala Llena)
    freeTextColor = '#b91c1c';
    freeStatusText = `🚨 SALA LLENA (0 Libres)`;
  } else if (freeSeats <= 60) {
    freeBgColor = '#fef9c3'; // Amarillo Alerta (<= 60 libres)
    freeTextColor = '#a16207';
    freeStatusText = `⚠️ Quedan ${freeSeats} Libres (Alerta < 60)`;
  }

  reportSheet.getRange('A4:B4').merge().setValue('CAPACIDAD SALA').setFontWeight('bold').setBackground('#f1f5f9').setHorizontalAlignment('center');
  reportSheet.getRange('A5:B5').merge().setValue(`${maxCapacity} Lugares`).setFontWeight('bold').setFontSize(15).setFontColor('#0b2149').setHorizontalAlignment('center');

  reportSheet.getRange('C4:D4').merge().setValue('ENTRADAS OCUPADAS').setFontWeight('bold').setBackground('#dbeafe').setHorizontalAlignment('center');
  reportSheet.getRange('C5:D5').merge().setValue(`${totalSeatsSum} Ocupadas`).setFontWeight('bold').setFontSize(15).setFontColor('#1d4ed8').setHorizontalAlignment('center');

  reportSheet.getRange('E4:F4').merge().setValue('ASIENTOS DISPONIBLES').setFontWeight('bold').setBackground(freeBgColor).setHorizontalAlignment('center');
  reportSheet.getRange('E5:F5').merge().setValue(freeStatusText).setFontWeight('bold').setFontSize(14).setFontColor(freeTextColor).setHorizontalAlignment('center');

  reportSheet.getRange('G4:H4').merge().setValue('PARES / INDIVIDUALES').setFontWeight('bold').setBackground('#f1f5f9').setHorizontalAlignment('center');
  reportSheet.getRange('G5:H5').merge().setValue(`${doubleSeatsCount} Pares | ${singleSeatsCount} Indiv.`).setFontWeight('bold').setFontSize(12).setFontColor('#0f172a').setHorizontalAlignment('center');

  // 3. ENCABEZADOS DE TABLA
  const headers = [
    'N°',
    'CÓDIGO DE ENTRADA',
    'INVITADO PRINCIPAL',
    'TIPO DE ACCESO',
    'NOMBRE ACOMPAÑANTE',
    'LUGARES',
    'ESTADO INGRESO',
    'HORA / OBS.'
  ];

  const headerRange = reportSheet.getRange(7, 1, 1, headers.length);
  headerRange.setValues([headers])
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#0d2c60')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  reportSheet.setRowHeight(7, 28);

  // 4. INSERTAR FILAS DE DATOS
  if (rowsToInsert.length > 0) {
    const dataRange = reportSheet.getRange(8, 1, rowsToInsert.length, headers.length);
    dataRange.setValues(rowsToInsert)
      .setFontSize(10)
      .setVerticalAlignment('middle');

    // Alineación por columna
    reportSheet.getRange(8, 1, rowsToInsert.length, 1).setHorizontalAlignment('center'); // N°
    reportSheet.getRange(8, 2, rowsToInsert.length, 1).setHorizontalAlignment('center').setFontFamily('monospace').setFontWeight('bold'); // Código
    reportSheet.getRange(8, 3, rowsToInsert.length, 1).setHorizontalAlignment('left').setFontWeight('bold'); // Nombre
    reportSheet.getRange(8, 4, rowsToInsert.length, 1).setHorizontalAlignment('center'); // Tipo
    reportSheet.getRange(8, 5, rowsToInsert.length, 1).setHorizontalAlignment('left'); // Acompañante
    reportSheet.getRange(8, 6, rowsToInsert.length, 1).setHorizontalAlignment('center').setFontWeight('bold'); // Lugares
    reportSheet.getRange(8, 7, rowsToInsert.length, 1).setHorizontalAlignment('center'); // Estado Ingreso
    reportSheet.getRange(8, 8, rowsToInsert.length, 1).setHorizontalAlignment('center'); // Hora

    // CHECKBOX nativo en columna ESTADO INGRESO (G)
    const estadoRange = reportSheet.getRange(8, 7, rowsToInsert.length, 1);
    estadoRange.insertCheckboxes();

    // Formato condicional: fila verde cuando el checkbox está marcado (TRUE)
    const fullRowRange = reportSheet.getRange(8, 1, rowsToInsert.length, headers.length);
    const ruleIngresado = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$G8=TRUE')
      .setBackground('#dcfce7')
      .setFontColor('#15803d')
      .setBold(true)
      .setRanges([fullRowRange])
      .build();

    const existingRules = reportSheet.getConditionalFormatRules();
    reportSheet.setConditionalFormatRules([...existingRules, ruleIngresado]);

    // Bandas de color intercaladas para facilitar lectura impresos
    for (let i = 0; i < rowsToInsert.length; i++) {
      const rowNum = 8 + i;
      if (i % 2 === 1) {
        reportSheet.getRange(rowNum, 1, 1, headers.length).setBackground('#f8fafc');
      }
    }
  }

  // Ajustar anchos de columnas
  reportSheet.setColumnWidth(1, 45);   // N°
  reportSheet.setColumnWidth(2, 140);  // Código
  reportSheet.setColumnWidth(3, 200);  // Invitado
  reportSheet.setColumnWidth(4, 170);  // Tipo
  reportSheet.setColumnWidth(5, 180);  // Acompañante
  reportSheet.setColumnWidth(6, 80);   // Lugares
  reportSheet.setColumnWidth(7, 130);  // Estado
  reportSheet.setColumnWidth(8, 110);  // Hora

  return freeSeats;
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 6: BOTONES WHATSAPP (Columna K)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Genera enlaces directos de WhatsApp formateados como BOTONES verdes clickables en la Columna K
 */
function generarLinksWhatsApp() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No hay invitados registrados.');
    return;
  }

  // Encabezado columna K (11)
  const headerRange = sheet.getRange(1, 11);
  headerRange
    .setValue('BOTÓN WHATSAPP')
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#071938')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setColumnWidth(11, 210);

  const data = sheet.getRange(2, 1, lastRow - 1, 4).getDisplayValues();
  const formulas = [];

  data.forEach(r => {
    const code = r[0];
    const name = r[1];
    const phone = r[3];

    if (!code || !name) {
      formulas.push(['']);
      return;
    }

    const cleanPhone = cleanPhoneForWhatsApp_(phone);
    const firstName = firstName_(name);
    const invitationUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

    const textMsg = `¡Hola ${firstName}! Universal Assistance Uruguay te invita a la función especial de Coyote vs. Acme en Movie Montevideo Shopping. Confirmá tu lugar aquí: ${invitationUrl}`;
    const encodedMessage = encodeURIComponent(textMsg);

    // En hojas de cálculo en español el separador de fórmulas es punto y coma (;)
    if (cleanPhone) {
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      formulas.push([`=HYPERLINK("${waUrl}"; "💬 ENVIAR A ${escapeFormulaText_(firstName.toUpperCase())}")`]);
    } else {
      const waUrl = `https://wa.me/?text=${encodedMessage}`;
      formulas.push([`=HYPERLINK("${waUrl}"; "💬 ENVIAR POR WHATSAPP")`]);
    }
  });

  const btnRange = sheet.getRange(2, 11, formulas.length, 1);
  btnRange
    .setFormulas(formulas)
    .setBackground('#25d366') // Verde oficial de WhatsApp
    .setFontColor('#ffffff')   // Texto blanco
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  SpreadsheetApp.getUi().alert('✅ Botones de WhatsApp verdes generados con éxito en la Columna K.');
}

function cleanPhoneForWhatsApp_(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';

  // Si empieza con 09 (ej. 097347217), quitar 0 inicial y agregar prefijo Uruguay 598
  if (digits.startsWith('09') && digits.length === 9) {
    return '598' + digits.substring(1);
  }
  // Si tiene 8 dígitos y empieza con 9 (ej. 97347217)
  if (digits.startsWith('9') && digits.length === 8) {
    return '598' + digits;
  }
  // Si ya tiene prefijo 598
  if (digits.startsWith('598')) {
    return digits;
  }
  return digits;
}

function escapeFormulaText_(text) {
  return String(text || '').replace(/"/g, '""');
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 7: RECORDATORIOS (automático 24hs antes + manual)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Programa un disparador de tiempo en Google Apps Script para enviar el recordatorio
 * automáticamente 24 horas antes del evento (el 26/08/2026 a las 10:00 hs)
 */
function crearActivadorRecordatorioAuto() {
  const ui = SpreadsheetApp.getUi();

  // Borrar activadores previos de recordatorio para evitar duplicados
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(t => {
    if (t.getHandlerFunction() === 'enviarRecordatorioAConfirmados_Auto_') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Fecha del evento: 27/08/2026 -> Recordatorio 24hs antes: 26/08/2026 10:00 AM
  const reminderDate = new Date('2026-08-26T10:00:00-03:00');

  ScriptApp.newTrigger('enviarRecordatorioAConfirmados_Auto_')
    .timeBased()
    .at(reminderDate)
    .create();

  ui.alert(
    '⏰ Recordatorio Programado con Éxito',
    'El sistema enviará automáticamente el correo de recordatorio con el pase VIP y QR a todos los invitados confirmados el día 26 de Agosto de 2026 a las 10:00 hs.',
    ui.ButtonSet.OK
  );
}

/**
 * Función que ejecuta el activador de tiempo automáticamente sin interfaz de usuario
 */
function enviarRecordatorioAConfirmados_Auto_() {
  const ss = getActiveOrOpenSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_INVITADOS);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const data = sheet.getRange(2, 1, lastRow - 1, 10).getDisplayValues();
  const timeNowStr = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM HH:mm');

  data.forEach((r, idx) => {
    const status = String(r[4] || '').toLowerCase().trim();
    const email = String(r[2] || '').trim();
    const mailStatus = String(r[9] || '');

    // Solo enviar a confirmados que tengan mail y no hayan recibido ya el recordatorio
    if (status.includes('confirmad') && email && !mailStatus.includes('Recordatorio enviado')) {
      const companionVal = String(r[5] || '').toLowerCase().trim() === 'sí' || String(r[5] || '').toLowerCase().trim() === 'si';
      const seats = Number(r[7]) || (companionVal ? 2 : 1);
      const code = r[0];
      const name = r[1];
      const companionName = r[6] || '';
      const rowIndex = idx + 2;

      try {
        sendReminderEmail_(email, name, seats, companionName, code);
        sheet.getRange(rowIndex, 10).setValue(`Recordatorio enviado el ${timeNowStr}`);
      } catch (err) {
        sheet.getRange(rowIndex, 10).setValue(`Error recordatorio: ${err.message || err}`);
      }
    }
  });
}

/**
 * Envío manual de recordatorio con confirmación UI
 */
function enviarRecordatorioAConfirmados() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    ui.alert('No hay invitados en la lista.');
    return;
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 10).getDisplayValues();
  const confirmedRows = [];

  data.forEach((r, idx) => {
    const status = String(r[4] || '').toLowerCase().trim();
    const email = String(r[2] || '').trim();
    if (status.includes('confirmad') && email) {
      confirmedRows.push({
        rowIndex: idx + 2,
        code: r[0],
        name: r[1],
        email: email,
        companionVal: String(r[5] || '').toLowerCase().trim() === 'sí' || String(r[5] || '').toLowerCase().trim() === 'si',
        companionName: r[6] || '',
        seats: Number(r[7]) || (String(r[5] || '').toLowerCase().trim() === 'sí' ? 2 : 1)
      });
    }
  });

  if (confirmedRows.length === 0) {
    ui.alert('No se encontraron invitados confirmados con correo electrónico.');
    return;
  }

  const resp = ui.alert(
    '⏰ Confirmación de Envío de Recordatorio',
    `¿Deseás enviar el correo de recordatorio a los ${confirmedRows.length} invitados confirmados?`,
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  let countSuccess = 0;
  const timeNowStr = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM HH:mm');

  confirmedRows.forEach(g => {
    try {
      sendReminderEmail_(
        g.email,
        g.name,
        g.seats,
        g.companionName,
        g.code
      );
      sheet.getRange(g.rowIndex, 10).setValue(`Recordatorio enviado el ${timeNowStr}`);
      countSuccess++;
    } catch (err) {
      sheet.getRange(g.rowIndex, 10).setValue(`Error recordatorio: ${err.message || err}`);
    }
  });

  ui.alert(`✅ Recordatorios enviados con éxito a ${countSuccess} de ${confirmedRows.length} invitados.`);
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 8: EMAILS - CONFIRMACIÓN (Ticket VIP dark con QR)
// ═══════════════════════════════════════════════════════════════════════

function sendConfirmationEmail_(email, guestName, totalSeats, companionName, code) {
  const config = getConfig_();
  const eventName = config['Nombre del evento'] || 'Función especial Coyote vs. Acme';
  const eventDate = config['Fecha'] || '27/08/2026';
  const eventTime = config['Hora'] || '20:00';
  const arrivalTime = config['Hora sugerida de llegada'] || '19:30';
  const venue = config['Lugar'] || 'Movie Montevideo Shopping';
  const mapsUrl = config['Dirección / Maps'] || 'https://maps.google.com/?q=Movie+Montevideo+Shopping';
  const replyTo = config['Correo de contacto'] || SENDER_EMAIL;
  const phone = config['Teléfono de contacto'] || '2901 7378';
  const website = config['Sitio web'] || 'www.universal-assistance.com';
  const invitationUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

  const subject = `Confirmación de Asistencia - Coyote vs. Acme | Universal Assistance (${code})`;
  const seatsText = totalSeats === 2 ? 'Acceso para 2 personas (Vos + 1)' : 'Acceso individual (1 persona)';
  const qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(invitationUrl) + '&color=071938&bgcolor=ffffff';

  const options = {
    name: 'Universal Assistance',
    replyTo,
    htmlBody: '',
    attachments: [buildCalendarAttachment_(eventName, eventDate, eventTime, venue, code)]
  };

  const htmlBody = `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      @media only screen and (max-width: 600px) {
        .ticket-card { width: 100% !important; border-radius: 16px !important; }
        .ticket-pad { padding: 18px 16px !important; }
        .ticket-title { font-size: 24px !important; }
        .ticket-col { display: block !important; width: 100% !important; padding-right: 0 !important; padding-left: 0 !important; margin-bottom: 12px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#071938 !important;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff !important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Tu entrada para la función especial de Coyote vs. Acme ha sido confirmada.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#071938 !important;padding:16px 8px;">
      <tr>
        <td align="center" style="background-color:#071938 !important;">
          
          <!-- TICKET BOLETO VIP CON ALTO CONTRASTE Y SOPORTE MODO OSCURO DE GMAIL -->
          <table role="presentation" class="ticket-card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#0b2149 !important;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.6);">
            
            <!-- MARCA -->
            <tr>
              <td class="ticket-pad" style="padding:20px 24px;background-color:#071938 !important;border-bottom:1px solid rgba(56,189,248,0.3);">
                <div style="font-size:20px;font-weight:900;color:#ffffff !important;letter-spacing:-0.5px;">UNIVERSAL ASSISTANCE</div>
                <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
              </td>
            </tr>

            <!-- CUERPO PRINCIPAL DEL TICKET -->
            <tr>
              <td class="ticket-pad" style="padding:24px 24px 16px 24px;background-color:#0b2149 !important;">
                <div style="font-size:12px;font-weight:800;color:#38bdf8 !important;margin-bottom:4px;">Universal Assistance Uruguay te invita a:</div>
                <h1 class="ticket-title" style="margin:0;color:#ffffff !important;font-size:28px;font-weight:900;line-height:1.15;text-transform:uppercase;letter-spacing:-0.5px;word-break:break-word;">COYOTE VS ACME</h1>
                
                <!-- CAJA INVITADO CON FONDO AZUL MEDIO HIGHLIGHT -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;background-color:#16356e !important;border:1px solid #38bdf8;border-radius:12px;">
                  <tr>
                    <td style="padding:14px;background-color:#16356e !important;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">INVITADO ESPECIAL</div>
                      <div style="font-size:19px;font-weight:900;color:#ffffff !important;line-height:1.2;">${escapeHtml_(guestName)}</div>
                      <div style="font-size:12px;color:#e2e8f0 !important;margin-top:3px;font-weight:600;">${seatsText}</div>
                      ${companionName ? `<div style="font-size:12px;color:#38bdf8 !important;margin-top:3px;font-weight:700;">Acompañante: <strong style="color:#ffffff !important;">${escapeHtml_(companionName)}</strong></div>` : ''}
                    </td>
                  </tr>
                </table>

                <!-- DETALLES EVENTO -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
                  <tr>
                    <td class="ticket-col" width="50%" style="vertical-align:top;padding-right:8px;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;text-transform:uppercase;">FECHA Y HORA</div>
                      <div style="font-size:13px;font-weight:800;color:#ffffff !important;margin-top:2px;">${escapeHtml_(eventDate)} · ${escapeHtml_(eventTime)} hs</div>
                      <div style="font-size:11px;color:#cbd5e1 !important;margin-top:1px;">(Llegada: ${escapeHtml_(arrivalTime)} hs)</div>
                    </td>
                    <td class="ticket-col" width="50%" style="vertical-align:top;padding-left:8px;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;text-transform:uppercase;">LUGAR</div>
                      <div style="font-size:13px;font-weight:800;color:#ffffff !important;margin-top:2px;">${escapeHtml_(venue)}</div>
                      <div style="margin-top:1px;"><a href="${escapeHtml_(mapsUrl)}" style="color:#38bdf8 !important;font-size:11px;font-weight:800;text-decoration:underline;">Ver en Maps</a></div>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- LÍNEA DE TROQUELADO CON MUESCAS LATERALES -->
            <tr style="background-color:#0b2149 !important;">
              <td style="padding:0;background-color:#0b2149 !important;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b2149 !important;">
                  <tr>
                    <td width="16" height="30" style="width:16px;height:30px;background-color:#071938 !important;border-top-right-radius:15px;border-bottom-right-radius:15px;border-top:2px solid #38bdf8;border-right:2px solid #38bdf8;border-bottom:2px solid #38bdf8;"></td>
                    <td style="padding:0 6px;vertical-align:middle;background-color:#0b2149 !important;">
                      <div style="border-top:2px dashed #38bdf8;height:0;"></div>
                    </td>
                    <td width="16" height="30" style="width:16px;height:30px;background-color:#071938 !important;border-top-left-radius:15px;border-bottom-left-radius:15px;border-top:2px solid #38bdf8;border-left:2px solid #38bdf8;border-bottom:2px solid #38bdf8;"></td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- SECCIÓN QR Y CÓDIGO DE ENTRADA -->
            <tr>
              <td class="ticket-pad" align="center" style="padding:18px 20px 24px 20px;background-color:#0b2149 !important;text-align:center;">
                
                <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;letter-spacing:1px;margin-bottom:8px;text-align:center;">CÓDIGO DE ENTRADA</div>
                
                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 14px auto;">
                  <tr>
                    <td align="center" style="background-color:#38bdf8 !important;color:#071938 !important;font-family:monospace,'Courier New',sans-serif;font-size:19px;font-weight:900;padding:6px 20px;border-radius:8px;letter-spacing:1px;text-align:center;">
                      ${escapeHtml_(code)}
                    </td>
                  </tr>
                </table>

                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 10px auto;">
                  <tr>
                    <td align="center" style="background-color:#ffffff !important;padding:8px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.5);text-align:center;">
                      <img src="${qrImgUrl}" width="140" height="140" alt="Código QR Entrada" style="display:block;margin:0 auto;background-color:#ffffff !important;max-width:140px;height:auto;border:0;">
                    </td>
                  </tr>
                </table>

                <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;letter-spacing:0.5px;text-align:center;margin-bottom:16px;">ESCANEÁ EN BOLETERÍA</div>

                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                  <tr>
                    <td align="center" style="background-color:#ee1f73 !important;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.4);">
                      <a href="${escapeHtml_(invitationUrl)}" style="display:inline-block;padding:13px 30px;color:#ffffff !important;text-decoration:none;font-size:14px;font-weight:800;border-radius:999px;text-align:center;">Abrir mi Entrada Digital</a>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- FOOTER TICKET -->
            <tr>
              <td style="padding:16px 20px;background-color:#071938 !important;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
                <div style="font-weight:900;font-size:12px;color:#ffffff !important;letter-spacing:0.5px;">UNIVERSAL ASSISTANCE URUGUAY</div>
                <div style="font-size:11px;color:#38bdf8 !important;margin-top:4px;font-weight:700;">
                  Tel: ${escapeHtml_(phone)} &nbsp;|&nbsp; <a href="mailto:${escapeHtml_(replyTo)}" style="color:#ffffff !important;text-decoration:underline;">${escapeHtml_(replyTo)}</a>
                </div>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;

  options.htmlBody = htmlBody;

  const plainTextBody = [
    `Hola ${guestName},`,
    '',
    'Tu asistencia quedó confirmada.',
    '',
    eventName,
    `Fecha: ${eventDate}`,
    `Hora: ${eventTime}`,
    `Llegada sugerida: ${arrivalTime}`,
    `Lugar: ${venue}`,
    `Accesos: ${seatsText}`,
    totalSeats === 2 ? `Acompañante: ${companionName}` : '',
    `Código: ${code}`,
    '',
    `Ver invitación: ${invitationUrl}`,
    '',
    'Universal Assistance'
  ].filter(Boolean).join('\n');

  sendEmailFromCorporateAccount_(email, subject, plainTextBody, options);
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 9: EMAILS - RECORDATORIO (Ticket VIP dark con QR)
// ═══════════════════════════════════════════════════════════════════════

function sendReminderEmail_(email, guestName, totalSeats, companionName, code) {
  const config = getConfig_();
  const eventName = config['Nombre del evento'] || 'Función especial Coyote vs. Acme';
  const eventDate = config['Fecha'] || '27/08/2026';
  const eventTime = config['Hora'] || '20:00';
  const arrivalTime = config['Hora sugerida de llegada'] || '19:30';
  const venue = config['Lugar'] || 'Movie Montevideo Shopping';
  const mapsUrl = config['Dirección / Maps'] || 'https://maps.google.com/?q=Movie+Montevideo+Shopping';
  const replyTo = config['Correo de contacto'] || SENDER_EMAIL;
  const phone = config['Teléfono de contacto'] || '2901 7378';
  const invitationUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

  const subject = `⏰ ¡Mañana! Recordatorio de Función Especial - Coyote vs. Acme | Universal Assistance (${code})`;
  const seatsText = totalSeats === 2 ? 'Acceso para 2 personas (Vos + 1)' : 'Acceso individual (1 persona)';
  const qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(invitationUrl) + '&color=071938&bgcolor=ffffff';

  const options = {
    name: 'Universal Assistance',
    replyTo,
    htmlBody: '',
    attachments: [buildCalendarAttachment_(eventName, eventDate, eventTime, venue, code)]
  };

  const htmlBody = `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      @media only screen and (max-width: 600px) {
        .ticket-card { width: 100% !important; border-radius: 16px !important; }
        .ticket-pad { padding: 18px 16px !important; }
        .ticket-title { font-size: 24px !important; }
        .ticket-col { display: block !important; width: 100% !important; padding-right: 0 !important; padding-left: 0 !important; margin-bottom: 12px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#071938 !important;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff !important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Recordatorio: ¡Nos vemos mañana en la función especial de Coyote vs. Acme en Movie Montevideo Shopping!</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#071938 !important;padding:16px 8px;">
      <tr>
        <td align="center" style="background-color:#071938 !important;">
          
          <table role="presentation" class="ticket-card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#0b2149 !important;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.6);">
            
            <tr>
              <td class="ticket-pad" style="padding:20px 24px;background-color:#071938 !important;border-bottom:1px solid rgba(56,189,248,0.3);">
                <div style="font-size:20px;font-weight:900;color:#ffffff !important;letter-spacing:-0.5px;">UNIVERSAL ASSISTANCE</div>
                <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
              </td>
            </tr>

            <tr>
              <td class="ticket-pad" style="padding:24px 24px 16px 24px;background-color:#0b2149 !important;">
                <div style="font-size:13px;font-weight:900;color:#38bdf8 !important;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">⏰ RECORDATORIO DE TU ENTRADA</div>
                <h1 class="ticket-title" style="margin:0;color:#ffffff !important;font-size:28px;font-weight:900;line-height:1.15;text-transform:uppercase;letter-spacing:-0.5px;word-break:break-word;">COYOTE VS ACME</h1>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;background-color:#16356e !important;border:1px solid #38bdf8;border-radius:12px;">
                  <tr>
                    <td style="padding:14px;background-color:#16356e !important;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">INVITADO CONFIRMADO</div>
                      <div style="font-size:19px;font-weight:900;color:#ffffff !important;line-height:1.2;">${escapeHtml_(guestName)}</div>
                      <div style="font-size:12px;color:#e2e8f0 !important;margin-top:3px;font-weight:600;">${seatsText}</div>
                      ${companionName ? `<div style="font-size:12px;color:#38bdf8 !important;margin-top:3px;font-weight:700;">Acompañante: <strong style="color:#ffffff !important;">${escapeHtml_(companionName)}</strong></div>` : ''}
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
                  <tr>
                    <td class="ticket-col" width="50%" style="vertical-align:top;padding-right:8px;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;text-transform:uppercase;">FECHA Y HORA</div>
                      <div style="font-size:13px;font-weight:800;color:#ffffff !important;margin-top:2px;">${escapeHtml_(eventDate)} · ${escapeHtml_(eventTime)} hs</div>
                      <div style="font-size:11px;color:#cbd5e1 !important;margin-top:1px;">(Sugerido llegar: ${escapeHtml_(arrivalTime)} hs)</div>
                    </td>
                    <td class="ticket-col" width="50%" style="vertical-align:top;padding-left:8px;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;text-transform:uppercase;">LUGAR</div>
                      <div style="font-size:13px;font-weight:800;color:#ffffff !important;margin-top:2px;">${escapeHtml_(venue)}</div>
                      <div style="margin-top:1px;"><a href="${escapeHtml_(mapsUrl)}" style="color:#38bdf8 !important;font-size:11px;font-weight:800;text-decoration:underline;">Ver en Maps</a></div>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <tr style="background-color:#0b2149 !important;">
              <td style="padding:0;background-color:#0b2149 !important;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b2149 !important;">
                  <tr>
                    <td width="16" height="30" style="width:16px;height:30px;background-color:#071938 !important;border-top-right-radius:15px;border-bottom-right-radius:15px;border-top:2px solid #38bdf8;border-right:2px solid #38bdf8;border-bottom:2px solid #38bdf8;"></td>
                    <td style="padding:0 6px;vertical-align:middle;background-color:#0b2149 !important;">
                      <div style="border-top:2px dashed #38bdf8;height:0;"></div>
                    </td>
                    <td width="16" height="30" style="width:16px;height:30px;background-color:#071938 !important;border-top-left-radius:15px;border-bottom-left-radius:15px;border-top:2px solid #38bdf8;border-left:2px solid #38bdf8;border-bottom:2px solid #38bdf8;"></td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="ticket-pad" align="center" style="padding:18px 20px 24px 20px;background-color:#0b2149 !important;text-align:center;">
                
                <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;letter-spacing:1px;margin-bottom:8px;text-align:center;">CÓDIGO DE ENTRADA</div>
                
                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 14px auto;">
                  <tr>
                    <td align="center" style="background-color:#38bdf8 !important;color:#071938 !important;font-family:monospace,'Courier New',sans-serif;font-size:19px;font-weight:900;padding:6px 20px;border-radius:8px;letter-spacing:1px;text-align:center;">
                      ${escapeHtml_(code)}
                    </td>
                  </tr>
                </table>

                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 10px auto;">
                  <tr>
                    <td align="center" style="background-color:#ffffff !important;padding:8px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.5);text-align:center;">
                      <img src="${qrImgUrl}" width="140" height="140" alt="Código QR Entrada" style="display:block;margin:0 auto;background-color:#ffffff !important;max-width:140px;height:auto;border:0;">
                    </td>
                  </tr>
                </table>

                <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;letter-spacing:0.5px;text-align:center;margin-bottom:16px;">PRESENTÁ ESTE QR EN BOLETERÍA</div>

                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                  <tr>
                    <td align="center" style="background-color:#ee1f73 !important;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.4);">
                      <a href="${escapeHtml_(invitationUrl)}" style="display:inline-block;padding:13px 30px;color:#ffffff !important;text-decoration:none;font-size:14px;font-weight:800;border-radius:999px;text-align:center;">Ver mi Entrada Digital</a>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <tr>
              <td style="padding:16px 20px;background-color:#071938 !important;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
                <div style="font-weight:900;font-size:12px;color:#ffffff !important;letter-spacing:0.5px;">UNIVERSAL ASSISTANCE URUGUAY</div>
                <div style="font-size:11px;color:#38bdf8 !important;margin-top:4px;font-weight:700;">
                  Tel: ${escapeHtml_(phone)} &nbsp;|&nbsp; <a href="mailto:${escapeHtml_(replyTo)}" style="color:#ffffff !important;text-decoration:underline;">${escapeHtml_(replyTo)}</a>
                </div>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;

  options.htmlBody = htmlBody;

  const plainTextBody = [
    `Hola ${guestName},`,
    '',
    '⏰ Te recordamos que la función especial es mañana:',
    '',
    eventName,
    `Fecha: ${eventDate}`,
    `Hora: ${eventTime}`,
    `Lugar: ${venue}`,
    `Accesos: ${seatsText}`,
    totalSeats === 2 ? `Acompañante: ${companionName}` : '',
    `Código: ${code}`,
    '',
    `Te recomendamos llegar a las ${arrivalTime} hs.`,
    `Ver tu invitación y QR: ${invitationUrl}`,
    '',
    'Universal Assistance Uruguay'
  ].filter(Boolean).join('\n');

  sendEmailFromCorporateAccount_(email, subject, plainTextBody, options);
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 10: ENVÍO DE CORREO (resiliente, sin bloqueo por cuenta)
// ═══════════════════════════════════════════════════════════════════════

function sendEmailFromCorporateAccount_(recipient, subject, plainTextBody, options) {
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  const senderEmail = SENDER_EMAIL.toLowerCase();
  let aliases = [];

  try {
    aliases = GmailApp.getAliases().map(alias => String(alias).toLowerCase());
  } catch (_) {}

  const gmailOptions = Object.assign({}, options, {
    name: 'Universal Assistance',
    replyTo: options.replyTo || SENDER_EMAIL || effectiveEmail
  });

  if (senderEmail && aliases.includes(senderEmail)) {
    gmailOptions.from = SENDER_EMAIL;
  }

  try {
    GmailApp.sendEmail(recipient, subject, plainTextBody, gmailOptions);
  } catch (err) {
    // Si falló por alias 'from' no autorizado, remover la opción 'from' y reintentar con la cuenta activa
    delete gmailOptions.from;
    try {
      GmailApp.sendEmail(recipient, subject, plainTextBody, gmailOptions);
    } catch (err2) {
      MailApp.sendEmail(recipient, subject, plainTextBody, gmailOptions);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 11: UTILIDADES
// ═══════════════════════════════════════════════════════════════════════

function jsonOrJsonp_(payload, callback) {
  const json = JSON.stringify(payload);

  if (callback) {
    const safeCallback = String(callback).replace(/[^a-zA-Z0-9_$\.]/g, '');
    return ContentService
      .createTextOutput(`${safeCallback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  return String(value || '').trim();
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeIcs_(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function firstName_(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || 'Invitado';
}

function buildCalendarAttachment_(eventName, eventDate, eventTime, venue, code) {
  const dateParts = String(eventDate).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const timeParts = String(eventTime).match(/^(\d{1,2}):(\d{2})$/);
  if (!dateParts || !timeParts) return Utilities.newBlob('', 'text/calendar', 'Universal-Assistance.ics');

  const day = dateParts[1].padStart(2, '0');
  const month = dateParts[2].padStart(2, '0');
  const year = dateParts[3];
  const hour = timeParts[1].padStart(2, '0');
  const minute = timeParts[2];
  const start = `${year}${month}${day}T${hour}${minute}00`;
  const endHour = String((Number(hour) + 3) % 24).padStart(2, '0');
  const end = `${year}${month}${day}T${endHour}${minute}00`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Universal Assistance//Invitaciones//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcs_(code)}@ua-eventos`,
    `DTSTAMP:${Utilities.formatDate(new Date(), 'GMT', "yyyyMMdd'T'HHmmss'Z'")}`,
    `DTSTART;TZID=America/Montevideo:${start}`,
    `DTEND;TZID=America/Montevideo:${end}`,
    `SUMMARY:${escapeIcs_(eventName)}`,
    `LOCATION:${escapeIcs_(venue)}`,
    'DESCRIPTION:Invitación confirmada de Universal Assistance.',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return Utilities.newBlob(ics, 'text/calendar;charset=utf-8', 'Universal-Assistance-Coyote-vs-Acme.ics');
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 12: GENERACIÓN DE CÓDIGOS Y PRUEBAS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Importa la lista de invitados desde la spreadsheet externa
 * Spreadsheet origen: 15ul9dCJF7Bv7N6Yic0JJUJkdJOimPKs6
 * Columnas origen: NOMBRE | APELLIDO | CANAL | AGENCIA | CANTIDAD | REFERENTE
 * Columnas destino: A=Código | B=Nombre | C=Email | D=Teléfono | E=Estado | F=Acompañante | G=NombreAcomp | H=TotalLugares | I=FechaResp | J=MailStatus
 */
function importarListaExterna() {
  const ui = SpreadsheetApp.getUi();

  const EXTERNAL_SPREADSHEET_ID = '15ul9dCJF7Bv7N6Yic0JJUJkdJOimPKs6';
  const EXTERNAL_GID = 1784002841;

  try {
    const externalSS = SpreadsheetApp.openById(EXTERNAL_SPREADSHEET_ID);
    const sheets = externalSS.getSheets();
    // Buscar la pestaña por gid
    let srcSheet = null;
    for (const s of sheets) {
      if (s.getSheetId() === EXTERNAL_GID) { srcSheet = s; break; }
    }
    if (!srcSheet) srcSheet = sheets[0];

    const srcData = srcSheet.getDataRange().getValues();
    if (srcData.length < 2) {
      ui.alert('La lista externa está vacía.');
      return;
    }

    // Saltar header (fila 1)
    const rows = srcData.slice(1);

    // Filtrar filas válidas: debe tener nombre Y apellido reales (no vacíos, no placeholders de header)
    const validRows = rows.filter(r => {
      const nombre = String(r[0] || '').trim();
      const apellido = String(r[1] || '').trim();
      const canal = String(r[2] || '').trim();
      const cantidad = r[4];

      // Descartar filas vacías
      if (!nombre && !apellido) return false;
      // Descartar filas que son repetición de headers
      if (canal === 'CANAL - CLIENTE' || String(cantidad) === 'CANTIDAD DE PERSONAS') return false;

      return true;
    });

    if (validRows.length === 0) {
      ui.alert('No se encontraron invitados válidos en la lista externa.');
      return;
    }

    // Preparar destino
    const destSheet = getSheet_(SHEET_INVITADOS);
    const destLastRow = destSheet.getLastRow();

    // Obtener códigos existentes para evitar duplicados
    const existingCodes = new Set();
    const existingNames = new Set();
    if (destLastRow >= 2) {
      const existingData = destSheet.getRange(2, 1, destLastRow - 1, 2).getValues();
      existingData.forEach(r => {
        if (r[0]) existingCodes.add(String(r[0]).trim());
        if (r[1]) existingNames.add(String(r[1]).trim().toUpperCase());
      });
    }

    // Generar filas para insertar
    const newRows = [];
    let skipped = 0;

    validRows.forEach(r => {
      const nombre = String(r[0] || '').trim();
      const apellido = String(r[1] || '').trim();
      const fullName = capitalizeWords_(`${nombre} ${apellido}`);

      // Evitar duplicados por nombre
      if (existingNames.has(fullName.toUpperCase())) {
        skipped++;
        return;
      }

      // Cantidad de personas (default 2)
      let qty = parseInt(r[4], 10);
      if (isNaN(qty) || qty < 1) qty = 2;

      // Generar código único
      let code;
      do {
        code = 'UA-' + Utilities.getUuid()
          .replace(/-/g, '')
          .slice(0, 8)
          .toUpperCase();
      } while (existingCodes.has(code));
      existingCodes.add(code);
      existingNames.add(fullName.toUpperCase());

      // A=Código | B=Nombre | C=Email | D=Teléfono | E=Estado | F=Acompañante | G=NombreAcomp | H=TotalLugares | I=FechaResp | J=MailStatus
      newRows.push([
        code,
        fullName,
        '',           // Email (vacío, lo completa el invitado)
        '',           // Teléfono
        'Pendiente',  // Estado
        qty >= 2 ? 'Sí' : 'No',  // Lleva acompañante
        '',           // Nombre acompañante
        qty,          // Total lugares asignados
        '',           // Fecha respuesta
        ''            // Mail status
      ]);
    });

    if (newRows.length === 0) {
      ui.alert(`Todos los invitados de la lista ya existen en la pestaña Invitados. (${skipped} duplicados omitidos)`);
      return;
    }

    // Insertar
    const startRow = destLastRow + 1;
    destSheet.getRange(startRow, 1, newRows.length, 10).setValues(newRows);

    const msg = `✅ Importación completada:\n\n` +
      `• ${newRows.length} invitados nuevos agregados\n` +
      `• ${skipped} duplicados omitidos\n` +
      `• Total de lugares asignados: ${newRows.reduce((sum, r) => sum + r[7], 0)}\n\n` +
      `Los códigos de invitación ya fueron generados automáticamente.`;

    ui.alert('Importación Exitosa', msg, ui.ButtonSet.OK);
    Logger.log(msg);

  } catch (err) {
    ui.alert('Error al importar', `No se pudo importar la lista:\n${err.message}`, ui.ButtonSet.OK);
    Logger.log('Error importación: ' + err.message);
  }
}

/**
 * Capitaliza cada palabra: "JUAN CARLOS" → "Juan Carlos"
 */
function capitalizeWords_(str) {
  return String(str).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Vacía toda la lista de invitados (conserva el header)
 */
function vaciarListaInvitados() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    '⚠️ Vaciar Lista',
    '¿Estás seguro? Se borrarán TODOS los invitados de la pestaña Invitados.\nEsta acción no se puede deshacer.',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert('La lista ya está vacía.');
    return;
  }

  sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  ui.alert('✅ Lista vaciada', `Se eliminaron ${lastRow - 1} filas de datos.\nEl header se conservó.`, ui.ButtonSet.OK);
}

function generarCodigosFaltantes() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  const range = sheet.getRange(2, 1, lastRow - 1, 2);
  const values = range.getValues();
  const existing = new Set(
    values.map(r => String(r[0] || '').trim()).filter(Boolean)
  );

  values.forEach(row => {
    const hasName = String(row[1] || '').trim() !== '';
    const hasCode = String(row[0] || '').trim() !== '';

    if (hasName && !hasCode) {
      let code;
      do {
        code = 'UA-' + Utilities.getUuid()
          .replace(/-/g, '')
          .slice(0, 8)
          .toUpperCase();
      } while (existing.has(code));

      row[0] = code;
      existing.add(code);
    }
  });

  range.setValues(values);
}

function enviarMailDePrueba() {
  const config = getConfig_();
  const recipient = config['Correo de prueba'] || Session.getActiveUser().getEmail();
  if (!recipient) throw new Error('Agregá "Correo de prueba" en la pestaña Configuracion.');

  sendConfirmationEmail_(recipient, 'Invitado de prueba', 2, 'Acompañante de prueba', 'UA-DEMO-001');
}

function verificarRemitente() {
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  const aliases = GmailApp.getAliases();
  const senderEmail = SENDER_EMAIL.toLowerCase();
  const valid = effectiveEmail === senderEmail || aliases.map(String).map(v => v.toLowerCase()).includes(senderEmail);

  const result = {
    remitenteRequerido: SENDER_EMAIL,
    cuentaEjecutora: effectiveEmail || '(no identificada)',
    aliasesDisponibles: aliases,
    configuracionValida: valid
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Carga automáticamente los invitados de prueba especificados en la pestaña Invitados con sus links en Columna J
 */
function agregarInvitadosDePrueba() {
  const sheet = getSheet_(SHEET_INVITADOS);
  
  // Asegurar encabezados de Columna J y K
  sheet.getRange(1, 10).setValue('LinkInvitacion').setFontWeight('bold');
  sheet.getRange(1, 11).setValue('MailStatus').setFontWeight('bold');

  const testGuests = [
    ['UA-001', 'Alejandro Méndez', 'alejandrom@ua.com.uy', '', 'Pendiente', 'NO', '', 0, '', `${LANDING_URL}?i=UA-001`],
    ['UA-002', 'Ana Camiou', 'acamiou@ua.com.uy', '', 'Pendiente', 'NO', '', 0, '', `${LANDING_URL}?i=UA-002`],
    ['UA-003', 'Marianna Tomasi', 'mtomasi@ua.com.uy', '', 'Pendiente', 'NO', '', 0, '', `${LANDING_URL}?i=UA-003`],
    ['UA-004', 'Lucas Beathyate', 'lucasb@ua.com.uy', '', 'Pendiente', 'NO', '', 0, '', `${LANDING_URL}?i=UA-004`],
    ['UA-006', 'Ana Laura Britos', 'abritos@ua.com.uy', '', 'Pendiente', 'NO', '', 0, '', `${LANDING_URL}?i=UA-006`]
  ];

  testGuests.forEach(guest => {
    const row = findGuestRow_(sheet, guest[0]);
    if (row > 0) {
      sheet.getRange(row, 1, 1, 10).setValues([guest]);
    } else {
      sheet.appendRow(guest);
    }
  });

  try {
    generarReporteCine_Silent_();
  } catch (_) {}

  SpreadsheetApp.getUi().alert('✅ Se cargaron los invitados de prueba con su Link de Invitación en la Columna J de la pestaña Invitados.');
}

/**
 * Genera o actualiza la Columna J ("LinkInvitacion") para todos los invitados en la pestaña Invitados
 */
function generarLinksInvitacion() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('La lista de invitados está vacía.');
    return;
  }

  sheet.getRange(1, 10).setValue('LinkInvitacion').setFontWeight('bold');

  const codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const links = codes.map(row => {
    const code = String(row[0] || '').trim();
    if (!code) return [''];
    return [`${LANDING_URL}?i=${encodeURIComponent(code)}`];
  });

  sheet.getRange(2, 10, links.length, 1).setValues(links);
  SpreadsheetApp.getUi().alert('✅ Se generaron los enlaces personalizados en la Columna J ("LinkInvitacion") de la pestaña Invitados.');
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 12: ENVÍO MASIVO DE INVITACIONES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Envía las invitaciones por email a todos los invitados con estado 'Pendiente'
 * que aún no hayan recibido el mail (Col K no contiene 'Invitación enviada').
 * Procesa en lotes de 50 con pausas de 2 s para no superar el timeout de 6 min.
 * Límite Google Workspace: 1.500 emails/día — 400 invitados entran sin problema.
 */
function enviarInvitaciones() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    ui.alert('La lista de invitados está vacía.');
    return;
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();

  const pendientes = data
    .map((row, i) => ({ row, rowIndex: i + 2 }))
    .filter(({ row }) => {
      const estado     = String(row[4]  || '').trim();  // Col E
      const mailStatus = String(row[10] || '').trim();  // Col K
      const email      = String(row[2]  || '').trim();  // Col C
      const codigo     = String(row[0]  || '').trim();  // Col A
      return codigo && email && estado === 'Pendiente' && !mailStatus.includes('Invitación enviada');
    });

  if (pendientes.length === 0) {
    ui.alert('No hay invitados pendientes de recibir su invitación (o ya fueron enviadas todas).');
    return;
  }

  const resp = ui.alert(
    '📨 Enviar Invitaciones',
    `Se enviarán ${pendientes.length} correos de invitación a los invitados con estado "Pendiente".\n\n` +
    `Límite diario disponible: 1.500 emails (Google Workspace).\n\n` +
    `¿Confirmás el envío?`,
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  let countOk  = 0;
  let countErr = 0;
  const BATCH_SIZE  = 50;
  const timeNowStr  = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');

  pendientes.forEach(({ row, rowIndex }, idx) => {
    const codigo = String(row[0] || '').trim();
    const nombre = String(row[1] || '').trim();
    const email  = String(row[2] || '').trim();

    try {
      sendInvitationEmail_(email, nombre, codigo);
      sheet.getRange(rowIndex, 11).setValue(`Invitación enviada el ${timeNowStr}`);
      countOk++;
    } catch (err) {
      sheet.getRange(rowIndex, 11).setValue(`Error: ${err.message || err}`);
      countErr++;
    }

    // Pausa cada 50 envíos para respetar los límites de velocidad de la API
    if ((idx + 1) % BATCH_SIZE === 0) {
      Utilities.sleep(2000);
    }
  });

  ui.alert(
    `✅ Proceso completado.\n\n` +
    `Enviados correctamente: ${countOk}\n` +
    `Con errores: ${countErr}\n\n` +
    `Revisá la Columna K para ver el estado de cada envío.`
  );
}

/**
 * Email de invitación (pre-RSVP): lleva el link personalizado para que el invitado confirme.
 * A diferencia del email de confirmación, este se envía ANTES de que el invitado responda.
 */
function sendInvitationEmail_(email, guestName, code) {
  const config       = getConfig_();
  const eventDate    = config['Fecha']    || '27/08/2026';
  const eventTime    = config['Hora']     || '20:00';
  const arrivalTime  = config['Hora sugerida de llegada'] || '19:30';
  const venue        = config['Lugar']    || 'Movie Montevideo Shopping';
  const mapsUrl      = config['Dirección / Maps'] || 'https://maps.google.com/?q=Movie+Montevideo+Shopping';
  const replyTo      = config['Correo de contacto'] || SENDER_EMAIL;
  const phone        = config['Teléfono de contacto'] || '2901 7378';
  const invitationUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

  const firstName = firstName_(guestName);
  const subject   = `${firstName}, tenés una invitación especial de Universal Assistance`;

  const htmlBody = `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @media only screen and (max-width:600px){
        .card{width:100%!important;border-radius:16px!important;}
        .pad{padding:18px 16px!important;}
        .title{font-size:26px!important;}
        .col{display:block!important;width:100%!important;padding:0 0 10px 0!important;}
      }
    </style>
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu invitación exclusiva para Coyote vs. Acme en Movie Montevideo Shopping.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
      <tr><td align="center" style="padding:0;">
        <table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0"
          style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">

          <tr>
            <td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
              <div style="font-size:18px;font-weight:900;color:#ffffff;">UNIVERSAL ASSISTANCE</div>
              <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:28px 24px;background-color:#0b2149;">
              <div style="font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Te invitamos a una función exclusiva</div>
              <h1 class="title" style="margin:0 0 20px 0;color:#ffffff;font-size:30px;font-weight:900;line-height:1.15;text-transform:uppercase;">COYOTE VS ACME</h1>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:20px;">
                <tr><td style="padding:14px;">
                  <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">INVITADO ESPECIAL</div>
                  <div style="font-size:19px;font-weight:900;color:#ffffff;">${escapeHtml_(guestName)}</div>
                </td></tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td class="col" width="50%" style="vertical-align:top;padding-right:8px;">
                    <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">FECHA Y HORA</div>
                    <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">${escapeHtml_(eventDate)} · ${escapeHtml_(eventTime)} hs</div>
                    <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Llegada: ${escapeHtml_(arrivalTime)} hs</div>
                  </td>
                  <td class="col" width="50%" style="vertical-align:top;padding-left:8px;">
                    <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">LUGAR</div>
                    <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">${escapeHtml_(venue)}</div>
                    <div style="margin-top:1px;"><a href="${escapeHtml_(mapsUrl)}" style="color:#38bdf8;font-size:11px;font-weight:800;">Ver en Maps</a></div>
                  </td>
                </tr>
              </table>

              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml_(invitationUrl)}" style="height:50px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="#ee1f73">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:800;">Confirmar mi Asistencia</center>
              </v:roundrect>
              <![endif]--><!--[if !mso]><!-->
              <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.4);">
                    <a href="${escapeHtml_(invitationUrl)}"
                      style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;border-radius:999px;"
                    >Confirmar mi Asistencia</a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->

              <div style="font-size:11px;color:rgba(255,255,255,0.55);text-align:center;margin-top:14px;">
                Los lugares son limitados. Tu código: <strong style="color:#38bdf8;">${escapeHtml_(code)}</strong>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
              <div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
              <div style="font-size:11px;color:#38bdf8;margin-top:4px;font-weight:700;">
                Tel: ${escapeHtml_(phone)} &nbsp;|&nbsp;
                <a href="mailto:${escapeHtml_(replyTo)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml_(replyTo)}</a>
              </div>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const plainText = [
    `Hola ${firstName},`,
    '',
    'Universal Assistance te invita a una función exclusiva de Coyote vs. Acme.',
    '',
    `📅 Fecha: ${eventDate} a las ${eventTime} hs (llegada sugerida: ${arrivalTime} hs)`,
    `📍 Lugar: ${venue}`,
    `🎟️  Código: ${code}`,
    '',
    `Confirmá tu asistencia aquí: ${invitationUrl}`,
    '',
    'Universal Assistance Uruguay'
  ].join('\n');

  sendEmailFromCorporateAccount_(email, subject, plainText, {
    name: 'Universal Assistance',
    replyTo,
    htmlBody
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 13: ENVÍO DEMO — SELECCIÓN INDIVIDUAL POR COLUMNA L
// ═══════════════════════════════════════════════════════════════════════

/**
 * Agrega la columna L "Enviar DEMO" con casillas de verificación.
 * Tildando la casilla de cada invitado lo incluís en el próximo envío DEMO.
 */
function prepararColumnaDEMO() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  sheet.setColumnWidth(12, 160);
  sheet.setRowHeight(1, 40);

  // Encabezado
  const header = sheet.getRange(1, 12);
  header
    .setValue('DEMO')
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontColor('#ffffff')
    .setBackground('#c0392b')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(false);

  if (lastRow >= 2) {
    const numRows = lastRow - 1;
    const checkRange = sheet.getRange(2, 12, numRows, 1);

    // Eliminar validaciones previas ANTES de insertar checkboxes
    // (clearContent() no elimina DataValidation; clearDataValidations() sí)
    checkRange.clearDataValidations();
    checkRange.clearContent();
    checkRange.insertCheckboxes();
    checkRange.setHorizontalAlignment('center');
    checkRange.setVerticalAlignment('middle');

    // Altura mínima de 40px para que Google Sheets muestre las casillas sin advertencias
    sheet.setRowHeights(2, numRows, 40);
  }

  SpreadsheetApp.getUi().alert(
    '✅ Columna DEMO lista.\n\n' +
    'Tildá las casillas de la Columna L para seleccionar a quienes enviar el DEMO.\n' +
    'Luego ejecutá: "🧪 Enviar DEMO a Seleccionados (Col L)"'
  );
}

/**
 * Envía el email de DEMO únicamente a los invitados con la casilla de la Columna L tildada.
 * El email incluye una banda roja bien visible que dice "INVITACIÓN DEMO".
 */
function enviarInvitacionesDEMO() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    ui.alert('La lista de invitados está vacía.');
    return;
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();

  const seleccionados = data
    .map((row, i) => ({ row, rowIndex: i + 2 }))
    .filter(({ row }) => {
      const codigo  = String(row[0]  || '').trim();
      const email   = String(row[2]  || '').trim();
      const tildado = row[11]; // Col L checkbox
      return codigo && email && tildado === true;
    });

  if (seleccionados.length === 0) {
    ui.alert(
      'No hay invitados seleccionados.\n\n' +
      'Tildá las casillas de la Columna L ("Enviar DEMO") para seleccionarlos.\n' +
      'Si no ves la Columna L, ejecutá primero "✅ Activar Columna de Selección DEMO".'
    );
    return;
  }

  const lista = seleccionados.map(({ row }) =>
    `• ${String(row[1] || '').trim()} <${String(row[2] || '').trim()}>`
  ).join('\n');

  const resp = ui.alert(
    '🧪 DEMO — Confirmar Envío',
    `Se enviarán ${seleccionados.length} correos DEMO a:\n\n${lista}\n\n¿Confirmás?`,
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  let countOk  = 0;
  let countErr = 0;
  const timeNowStr = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');

  seleccionados.forEach(({ row, rowIndex }) => {
    const codigo = String(row[0] || '').trim();
    const nombre = String(row[1] || '').trim();
    const email  = String(row[2] || '').trim();

    try {
      sendInvitationDemoEmail_(email, nombre, codigo);
      sheet.getRange(rowIndex, 11).setValue(`DEMO enviado el ${timeNowStr}`);
      // Destildar después del envío para evitar duplicados accidentales
      sheet.getRange(rowIndex, 12).setValue(false);
      countOk++;
    } catch (err) {
      sheet.getRange(rowIndex, 11).setValue(`Error DEMO: ${err.message || err}`);
      countErr++;
    }
  });

  ui.alert(
    `✅ DEMO completado.\n\n` +
    `Enviados: ${countOk}\n` +
    `Con errores: ${countErr}\n\n` +
    `Las casillas se destildaron automáticamente para evitar re-envíos.`
  );
}

/**
 * Idéntico al email de invitación real pero con cartel rojo "INVITACIÓN DEMO"
 * bien visible arriba y abajo, y asunto marcado con [DEMO].
 */
function sendInvitationDemoEmail_(email, guestName, code) {
  const config       = getConfig_();
  const eventDate    = config['Fecha']    || '27/08/2026';
  const eventTime    = config['Hora']     || '20:00';
  const arrivalTime  = config['Hora sugerida de llegada'] || '19:30';
  const venue        = config['Lugar']    || 'Movie Montevideo Shopping';
  const mapsUrl      = config['Dirección / Maps'] || 'https://maps.google.com/?q=Movie+Montevideo+Shopping';
  const replyTo      = config['Correo de contacto'] || SENDER_EMAIL;
  const phone        = config['Teléfono de contacto'] || '2901 7378';
  const invitationUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

  const firstName = firstName_(guestName);
  const subject   = `[DEMO] ${firstName}, tenés una invitación especial de Universal Assistance`;

  const htmlBody = `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @media only screen and (max-width:600px){
        .card{width:100%!important;border-radius:16px!important;}
        .pad{padding:18px 16px!important;}
        .title{font-size:26px!important;}
        .col{display:block!important;width:100%!important;padding:0 0 10px 0!important;}
      }
    </style>
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">[DEMO] Invitación de prueba — Coyote vs. Acme.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
      <tr><td align="center" style="padding:0;">

        <!-- BANDA DEMO SUPERIOR -->
        <table role="presentation" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;margin-bottom:10px;">
          <tr>
            <td align="center" style="background-color:#c0392b;border-radius:12px;padding:14px 20px;">
              <div style="font-size:14px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">⚠ INVITACIÓN DEMO — SOLO PARA PRUEBAS ⚠</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.85);margin-top:5px;">Este correo es un envío de prueba. No es la invitación definitiva.</div>
            </td>
          </tr>
        </table>

        <table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0"
          style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">

          <tr>
            <td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
              <div style="font-size:18px;font-weight:900;color:#ffffff;">UNIVERSAL ASSISTANCE</div>
              <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:28px 24px;background-color:#0b2149;">
              <div style="font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Te invitamos a una función exclusiva</div>
              <h1 class="title" style="margin:0 0 20px 0;color:#ffffff;font-size:30px;font-weight:900;line-height:1.15;text-transform:uppercase;">COYOTE VS ACME</h1>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:20px;">
                <tr><td style="padding:14px;">
                  <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">INVITADO ESPECIAL</div>
                  <div style="font-size:19px;font-weight:900;color:#ffffff;">${escapeHtml_(guestName)}</div>
                </td></tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td class="col" width="50%" style="vertical-align:top;padding-right:8px;">
                    <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">FECHA Y HORA</div>
                    <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">${escapeHtml_(eventDate)} · ${escapeHtml_(eventTime)} hs</div>
                    <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Llegada: ${escapeHtml_(arrivalTime)} hs</div>
                  </td>
                  <td class="col" width="50%" style="vertical-align:top;padding-left:8px;">
                    <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">LUGAR</div>
                    <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">${escapeHtml_(venue)}</div>
                    <div style="margin-top:1px;"><a href="${escapeHtml_(mapsUrl)}" style="color:#38bdf8;font-size:11px;font-weight:800;">Ver en Maps</a></div>
                  </td>
                </tr>
              </table>

              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml_(invitationUrl)}" style="height:50px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="#ee1f73">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:800;">Confirmar mi Asistencia</center>
              </v:roundrect>
              <![endif]--><!--[if !mso]><!-->
              <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.4);">
                    <a href="${escapeHtml_(invitationUrl)}"
                      style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;border-radius:999px;"
                    >Confirmar mi Asistencia</a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->

              <div style="font-size:11px;color:rgba(255,255,255,0.55);text-align:center;margin-top:14px;">
                Los lugares son limitados. Tu código: <strong style="color:#38bdf8;">${escapeHtml_(code)}</strong>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
              <div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
              <div style="font-size:11px;color:#38bdf8;margin-top:4px;font-weight:700;">
                Tel: ${escapeHtml_(phone)} &nbsp;|&nbsp;
                <a href="mailto:${escapeHtml_(replyTo)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml_(replyTo)}</a>
              </div>
            </td>
          </tr>

          <!-- BANDA DEMO INFERIOR -->
          <tr>
            <td align="center" style="background-color:#c0392b;padding:12px 20px;border-top:2px dashed rgba(255,255,255,0.3);">
              <div style="font-size:13px;font-weight:900;color:#ffffff;letter-spacing:1.5px;text-transform:uppercase;">&#9650; ESTO ES UN DEMO &#9650;</div>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td></tr>
    </table>
  </body>
</html>`;

  const plainText = [
    '[DEMO - SOLO PARA PRUEBAS]',
    '',
    `Hola ${firstName},`,
    '',
    'Universal Assistance te invita a una función exclusiva de Coyote vs. Acme.',
    '',
    `📅 Fecha: ${eventDate} a las ${eventTime} hs (llegada: ${arrivalTime} hs)`,
    `📍 Lugar: ${venue}`,
    `🎟️  Código: ${code}`,
    '',
    `Confirmá tu asistencia aquí: ${invitationUrl}`,
    '',
    '---',
    'NOTA: Este es un correo de DEMO. No es el envío definitivo.',
    '---',
    '',
    'Universal Assistance Uruguay'
  ].join('\n');

  sendEmailFromCorporateAccount_(email, subject, plainText, {
    name: 'Universal Assistance',
    replyTo,
    htmlBody
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 14: BACKEND DEL PANEL DE ADMINISTRACIÓN
// Funciones llamadas desde Admin.html vía google.script.run
// ═══════════════════════════════════════════════════════════════════════

/**
 * Devuelve la lista completa de invitados para el panel admin.
 * Cols: A=Código B=Nombre C=Email D=Teléfono E=Estado F=Acompañante
 *       G=NombreAcomp H=Asientos I=FechaRespuesta J=Link K=MailStatus L=DEMO
 */
function adminGetGuestList() {
  const sheet   = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 12).getDisplayValues();
  return data
    .filter(r => r[0]) // ignorar filas vacías
    .map(r => ({
      code:           r[0],
      name:           r[1],
      email:          r[2],
      phone:          r[3],
      status:         r[4] || 'Pendiente',
      companion:      r[5],
      companionName:  r[6],
      totalSeats:     Number(r[7] || 0),
      responseDate:   r[8],
      link:           r[9],
      mailStatus:     r[10],
      demoCheck:      r[11]
    }));
}

/**
 * Devuelve las estadísticas del dashboard.
 */
function adminGetStats() {
  const guests = adminGetGuestList();
  const total       = guests.length;
  const confirmed   = guests.filter(g => g.status === 'Confirmado').length;
  const notAttending= guests.filter(g => g.status === 'No asiste').length;
  const pending     = guests.filter(g => !g.status || g.status === 'Pendiente').length;
  const withEmail   = guests.filter(g => g.mailStatus && g.mailStatus !== '' && !g.mailStatus.startsWith('Pendiente')).length;
  const noEmail     = total - withEmail;
  const totalSeats  = guests.reduce((s, g) => s + (g.totalSeats || 0), 0);
  const responseRate= total > 0 ? Math.round((confirmed + notAttending) / total * 100) : 0;

  return { total, confirmed, notAttending, pending, withEmail, noEmail, totalSeats, responseRate };
}

/**
 * Agrega un invitado individual. Genera código automáticamente.
 */
function adminAddGuest(name, email) {
  if (!name || !name.trim()) throw new Error('El nombre es obligatorio.');
  name  = name.trim();
  email = (email || '').trim();

  const sheet   = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  // Obtener todos los códigos existentes para generar el siguiente
  const existingCodes = lastRow >= 2
    ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(Boolean)
    : [];

  // Buscar el mayor número UA-NNN y sumar 1
  let maxNum = 0;
  existingCodes.forEach(c => {
    const m = String(c).match(/UA-(\d+)/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  const code = 'UA-' + String(maxNum + 1).padStart(3, '0');
  const link = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

  sheet.appendRow([code, name, email, '', 'Pendiente', '', '', 0, '', link, '', false]);

  // Asegurar encabezados
  sheet.getRange(1, 10).setValue('LinkInvitacion');
  sheet.getRange(1, 11).setValue('MailStatus');

  try { generarReporteCine_Silent_(); } catch (_) {}

  return { ok: true, code, link };
}

/**
 * Importación masiva de invitados desde el panel.
 * guests: array de {name, email}
 */
function adminImportGuests(guests) {
  if (!Array.isArray(guests) || guests.length === 0) throw new Error('Lista vacía.');

  const sheet   = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  const existingCodes = lastRow >= 2
    ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(Boolean)
    : [];

  let maxNum = 0;
  existingCodes.forEach(c => {
    const m = String(c).match(/UA-(\d+)/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });

  const rows = [];
  guests.forEach(g => {
    if (!g.name || !g.name.trim()) return;
    maxNum++;
    const code = 'UA-' + String(maxNum).padStart(3, '0');
    const link = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
    rows.push([code, g.name.trim(), (g.email || '').trim(), '', 'Pendiente', '', '', 0, '', link, '', false]);
  });

  if (rows.length === 0) throw new Error('No había invitados válidos en la lista.');

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 12).setValues(rows);

  sheet.getRange(1, 10).setValue('LinkInvitacion');
  sheet.getRange(1, 11).setValue('MailStatus');

  try { generarReporteCine_Silent_(); } catch (_) {}

  return { ok: true, added: rows.length };
}

/**
 * Elimina un invitado por código.
 */
function adminDeleteGuest(code) {
  const sheet = getSheet_(SHEET_INVITADOS);
  const row   = findGuestRow_(sheet, code);
  if (!row) throw new Error(`No se encontró el invitado con código ${code}.`);
  sheet.deleteRow(row);
  try { generarReporteCine_Silent_(); } catch (_) {}
  return { ok: true };
}

/**
 * Devuelve la configuración del evento para el panel.
 */
function adminGetConfig() {
  return getConfig_();
}

/**
 * Guarda la configuración del evento desde el panel.
 * data: { 'Clave': 'Valor', ... }
 */
function adminSaveConfig(data) {
  const sheet   = getSheet_(SHEET_CONFIG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('La pestaña Configuracion no tiene datos.');

  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  rows.forEach((row, i) => {
    const key = row[0];
    if (key && data.hasOwnProperty(key)) {
      sheet.getRange(i + 2, 2).setValue(data[key]);
    }
  });
  return { ok: true };
}

/**
 * Envía emails DEMO a los códigos indicados.
 * codes: array de strings con los códigos UA-NNN
 */
function adminSendDemoEmails(codes) {
  if (!Array.isArray(codes) || codes.length === 0) throw new Error('Sin destinatarios.');
  const sheet = getSheet_(SHEET_INVITADOS);
  const sent = [];
  const errors = [];

  codes.forEach(code => {
    const row = findGuestRow_(sheet, code);
    if (!row) { errors.push(`${code}: no encontrado`); return; }
    const values = sheet.getRange(row, 1, 1, 12).getValues()[0];
    const email = values[2];
    const name  = values[1];
    if (!email) { errors.push(`${code}: sin email`); return; }
    try {
      sendInvitationDemoEmail_(email, name, code);
      sheet.getRange(row, 11).setValue('DEMO enviado');
      sent.push(code);
    } catch (err) {
      errors.push(`${code}: ${err.message || err}`);
    }
    Utilities.sleep(1500);
  });

  return { ok: true, sent: sent.length, errors };
}

/**
 * Envía emails de invitación REAL a los códigos indicados.
 * codes: array de strings con los códigos UA-NNN
 */
function adminSendProductionEmails(codes) {
  if (!Array.isArray(codes) || codes.length === 0) throw new Error('Sin destinatarios.');
  const sheet = getSheet_(SHEET_INVITADOS);
  const sent = [];
  const errors = [];

  codes.forEach((code, i) => {
    const row = findGuestRow_(sheet, code);
    if (!row) { errors.push(`${code}: no encontrado`); return; }
    const values = sheet.getRange(row, 1, 1, 12).getValues()[0];
    const email  = values[2];
    const name   = values[1];
    if (!email) { errors.push(`${code}: sin email`); return; }
    try {
      sendInvitationEmail_(email, name, code);
      sheet.getRange(row, 11).setValue(`Enviado ${new Date().toLocaleString('es-UY')}`);
      sent.push(code);
    } catch (err) {
      errors.push(`${code}: ${err.message || err}`);
    }
    // Pausa cada 50 para no agotar el tiempo de ejecución
    if ((i + 1) % 50 === 0) Utilities.sleep(2000);
    else Utilities.sleep(800);
  });

  return { ok: true, sent: sent.length, errors };
}

/**
 * Genera/actualiza los links de invitación (Columna J) para todos los invitados.
 */
function adminGenerateLinks() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('La lista de invitados está vacía.');

  sheet.getRange(1, 10).setValue('LinkInvitacion').setFontWeight('bold');

  const codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let generated = 0;
  const links = codes.map(row => {
    const code = String(row[0] || '').trim();
    if (!code) return [''];
    generated++;
    return [`${LANDING_URL}?i=${encodeURIComponent(code)}`];
  });

  sheet.getRange(2, 10, links.length, 1).setValues(links);
  return { ok: true, generated };
}

/**
 * Envía recordatorio por email a todos los invitados confirmados.
 * Retorna cuántos se enviaron correctamente.
 */
function adminSendReminders(codes) {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('La lista de invitados está vacía.');

  const timeNowStr = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM HH:mm');
  const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  const sent = [], errors = [];

  data.forEach((r, idx) => {
    const rowCode = String(r[0] || '').trim();
    if (codes && codes.length > 0 && !codes.includes(rowCode)) return;

    const status = String(r[4] || '').toLowerCase().trim();
    const email  = String(r[2] || '').trim();
    if (!status.includes('confirmad') || !email) return;

    const companionVal = String(r[5] || '').toLowerCase().trim() === 'sí' || String(r[5] || '').toLowerCase().trim() === 'si';
    const seats = Number(r[7]) || (companionVal ? 2 : 1);
    const name  = r[1];
    const companionName = r[6] || '';

    try {
      sendReminderEmail_(email, name, seats, companionName, rowCode);
      sheet.getRange(idx + 2, 10).setValue(`Recordatorio enviado el ${timeNowStr}`);
      sent.push(rowCode);
    } catch (err) {
      errors.push(`${rowCode}: ${err.message || err}`);
    }
    Utilities.sleep(800);
  });

  return { ok: true, sent: sent.length, errors };
}

/**
 * Regenera el reporte Reporte_Cine_Movie en el spreadsheet.
 */
function adminRegenerateReport() {
  try {
    generarReporteCine_Silent_();
    return { ok: true };
  } catch (err) {
    throw new Error('Error al generar reporte: ' + (err.message || err));
  }
}

/**
 * Genera códigos UA-NNN faltantes para invitados sin código.
 */
function adminGenerateMissingCodes() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('La lista de invitados está vacía.');

  const range   = sheet.getRange(2, 1, lastRow - 1, 2);
  const values  = range.getValues();
  const existing = new Set(values.map(r => String(r[0] || '').trim()).filter(Boolean));

  // Determinar el máximo numérico existente
  let maxNum = 0;
  existing.forEach(c => {
    const m = String(c).match(/UA-(\d+)/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });

  let generated = 0;
  values.forEach(row => {
    const hasName = String(row[1] || '').trim() !== '';
    const hasCode = String(row[0] || '').trim() !== '';
    if (hasName && !hasCode) {
      maxNum++;
      const code = 'UA-' + String(maxNum).padStart(3, '0');
      row[0] = code;
      existing.add(code);
      generated++;
    }
  });

  range.setValues(values);
  // También regenerar links
  try { adminGenerateLinks(); } catch (_) {}
  return { ok: true, generated };
}

/**
 * Verifica la configuración del remitente de emails.
 */
function adminVerifySender() {
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  let aliases = [];
  try { aliases = GmailApp.getAliases(); } catch (_) {}
  const senderEmail = SENDER_EMAIL.toLowerCase();
  const valid = effectiveEmail === senderEmail || aliases.map(String).map(v => v.toLowerCase()).includes(senderEmail);
  return {
    ok: true,
    senderRequired: SENDER_EMAIL,
    activeAccount: effectiveEmail || '(no identificada)',
    aliases: aliases,
    valid: valid
  };
}

/**
 * Genera enlaces/fórmulas de WhatsApp en la Columna K de Google Sheets.
 */
function adminGenerateWhatsAppLinks() {
  try {
    generarLinksWhatsApp();
    return { ok: true };
  } catch (err) {
    throw new Error('Error al generar enlaces de WhatsApp: ' + (err.message || err));
  }
}

/**
 * Programa el envio automático de recordatorio 24h antes del evento (26/08 10:00 hs).
 */
function adminScheduleAutoReminder() {
  try {
    const existingTriggers = ScriptApp.getProjectTriggers();
    existingTriggers.forEach(t => {
      if (t.getHandlerFunction() === 'enviarRecordatorioAConfirmados_Auto_') {
        ScriptApp.deleteTrigger(t);
      }
    });

    const reminderDate = new Date('2026-08-26T10:00:00-03:00');
    ScriptApp.newTrigger('enviarRecordatorioAConfirmados_Auto_')
      .timeBased()
      .at(reminderDate)
      .create();

    return { ok: true, scheduledDate: '26/08/2026 10:00 hs' };
  } catch (err) {
    throw new Error('Error al programar recordatorio: ' + (err.message || err));
  }
}

/**
 * Vacía la lista completa de invitados (reserva el encabezado).
 */
function adminClearAllGuests() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, deleted: 0 };

  const count = lastRow - 1;
  sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  try { generarReporteCine_Silent_(); } catch (_) {}
  return { ok: true, deleted: count };
}

// ═══════════════════════════════════════════════════════════════════════
// FUNCIONES DE CONTROL DE INGRESO / ACREDITACIÓN SALA (QR SCANNER)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Devuelve la lista de invitados para la app de acreditación/puerta.
 */
function getGuestListCheckin_() {
  const sheetInv = getSheet_(SHEET_INVITADOS);
  const lastRowInv = sheetInv.getLastRow();
  if (lastRowInv < 2) return { ok: true, guests: [] };

  const dataInv = sheetInv.getRange(2, 1, lastRowInv - 1, 12).getDisplayValues();

  let checkinMap = new Map();
  try {
    const reportSheet = getSheet_('Reporte Cine');
    const lastRowRep = reportSheet.getLastRow();
    if (lastRowRep >= 8) {
      const repData = reportSheet.getRange(8, 2, lastRowRep - 7, 7).getValues();
      repData.forEach(r => {
        const code = clean_(r[0]);
        if (code) {
          checkinMap.set(code.toLowerCase(), {
            checkedIn: Boolean(r[5]),
            checkinTime: String(r[6] || '').trim()
          });
        }
      });
    }
  } catch (_) {}

  const guests = [];
  dataInv.forEach(r => {
    const code = clean_(r[0]);
    const name = clean_(r[1]);
    const status = clean_(r[4]) || 'Pendiente';
    const checkinColVal = clean_(r[11]);

    if (code && name) {
      const seats = Number(r[7] || 0) || (clean_(r[5]).toLowerCase() === 'sí' ? 2 : 1);
      const cInfo = checkinMap.get(code.toLowerCase()) || { checkedIn: false, checkinTime: '' };

      const isCheckedInInSheet = checkinColVal.startsWith('Ingresó') || cInfo.checkedIn;
      let checkinTimeStr = cInfo.checkinTime;
      if (!checkinTimeStr && checkinColVal.includes('(')) {
        const match = checkinColVal.match(/\(([^)]+)\)/);
        if (match) checkinTimeStr = match[1];
      }

      guests.push({
        code: code,
        name: name,
        status: status,
        seats: seats,
        companionName: clean_(r[6]),
        checkedIn: isCheckedInInSheet,
        checkinTime: checkinTimeStr
      });
    }
  });

  return { ok: true, count: guests.length, guests: guests };
}

/**
 * Marca el ingreso a sala de un invitado por código.
 */
function markIngress_(code) {
  if (!code) throw new Error('Código no especificado');
  const cleanCode = code.toUpperCase().trim();
  const nowTime = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  // 1. Actualizar pestaña Invitados (base de datos principal)
  try {
    const sheetInv = getSheet_(SHEET_INVITADOS);
    const row = findGuestRow_(sheetInv, cleanCode);
    if (row) {
      const currentStatus = clean_(sheetInv.getRange(row, 5).getValue());
      if (!currentStatus || currentStatus === 'Pendiente') {
        sheetInv.getRange(row, 5).setValue('Confirmado');
      }
      sheetInv.getRange(row, 12).setValue(`Ingresó (${nowTime})`);
    }
  } catch (e) {
    Logger.log('Error al actualizar Invitados: ' + e);
  }

  // 2. Actualizar / Regenerar pestaña Reporte Cine
  let foundInReport = false;
  try {
    const reportSheet = getSheet_('Reporte Cine');
    const lastRow = reportSheet.getLastRow();
    if (lastRow >= 8) {
      const codes = reportSheet.getRange(8, 2, lastRow - 7, 1).getValues().flat();
      for (let i = 0; i < codes.length; i++) {
        if (clean_(codes[i]).toUpperCase() === cleanCode) {
          const row = 8 + i;
          reportSheet.getRange(row, 7).setValue(true);
          reportSheet.getRange(row, 8).setValue(nowTime);
          foundInReport = true;
          break;
        }
      }
    }
    
    if (!foundInReport) {
      generarReporteCine_Silent_();
      const lastRow2 = reportSheet.getLastRow();
      if (lastRow2 >= 8) {
        const codes2 = reportSheet.getRange(8, 2, lastRow2 - 7, 1).getValues().flat();
        for (let i = 0; i < codes2.length; i++) {
          if (clean_(codes2[i]).toUpperCase() === cleanCode) {
            const row = 8 + i;
            reportSheet.getRange(row, 7).setValue(true);
            reportSheet.getRange(row, 8).setValue(nowTime);
            foundInReport = true;
            break;
          }
        }
      }
    }
  } catch (e) {
    Logger.log('Error al marcar ingreso en Reporte Cine: ' + e);
  }

  return { ok: true, code: cleanCode, time: nowTime, foundInReport };
}

/**
 * Registra un ingreso VIP directo en puerta.
 */
function addVipDoor_(name, companionName, seats) {
  if (!name) throw new Error('El nombre es obligatorio');
  const res = adminAddGuest(name, '');
  const sheet = getSheet_(SHEET_INVITADOS);
  const row = findGuestRow_(sheet, res.code);

  const numSeats = Number(seats || 1);
  const hasComp = numSeats >= 2 || Boolean(companionName);

  sheet.getRange(row, 5, 1, 4).setValues([[
    'Confirmado',
    hasComp ? 'Sí' : 'No',
    companionName || '',
    numSeats
  ]]);

  try { generarReporteCine_Silent_(); } catch (_) {}
  markIngress_(res.code);

  return { ok: true, code: res.code, name: name, seats: numSeats };
}

