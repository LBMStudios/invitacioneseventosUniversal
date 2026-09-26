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
const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

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

  // ── Tracking de Apertura de Mails (Pixel 1x1) ──────────────────────
  if (action === 'trackOpen') {
    const code = params.i || params.code || '';
    if (code) recordEmailOpen_(code);
    const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return ContentService.createTextOutput(gifBase64)
      .setMimeType(ContentService.MimeType.TEXT);
  }

  // ── Sincronización remota desde botón en Hoja3 ──────────────────────
  if (action === 'syncSheet' || action === 'triggerSync') {
    try {
      const res = copiarInvitaciones_Silent_();
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Sincronización Completada</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #071938; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); padding: 36px 48px; border-radius: 16px; backdrop-filter: blur(12px); max-width: 480px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
            .icon { font-size: 52px; margin-bottom: 16px; }
            h1 { font-size: 22px; margin: 0 0 12px; color: #38bdf8; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
            .btn { display: inline-block; background: #ee1f73; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; border: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h1>¡Hoja3 Sincronizada!</h1>
            <p>Se actualizaron todos los datos, links y mensajes en la spreadsheet externa.<br><b>${res ? (res.totalRows || 0) : 0}</b>  invitados procesados con éxito.</p>
            <button class="btn" onclick="window.close();">Cerrar esta ventana</button>
          </div>
        </body>
        </html>
      `;
      return HtmlService.createHtmlOutput(html);
    } catch (err) {
      return HtmlService.createHtmlOutput(`<h3>❌ Error al sincronizar: ${err.message || err}</h3>`);
    }
  }

  // ── API pública (landing del invitado) ───────────────────────────────
  try {
    let payload;

    if (action === 'actualizarTodo' || action === 'refreshAll') {
      payload = adminActualizarTodo();
    } else if (action === 'repararInvitados' || action === 'repairGuests') {
      payload = repararYReconstruirInvitados();
    } else if (action === 'adminList' || action === 'guestList') {
      payload = { ok: true, guests: adminGetGuestList() };
    } else if (action === 'adminStats' || action === 'stats') {
      payload = { ok: true, stats: adminGetStats() };
    } else if (action === 'adminConfig' || action === 'getConfig') {
      payload = { ok: true, config: adminGetConfig() };
    } else if (action === 'addGuest') {
      payload = adminAddGuest(params.name || '', params.email || '');
    } else if (action === 'deleteGuest') {
      payload = adminDeleteGuest(params.code || '');
    } else if (action === 'updateGuest') {
      payload = adminUpdateGuest({
        code: params.code,
        name: params.name,
        email: params.email,
        phone: params.phone,
        stage: params.stage,
        channel: params.channel,
        agency: params.agency,
        referent: params.referent,
        totalSeats: params.totalSeats,
        companion: params.companion,
        companionName: params.companionName,
        status: params.status
      });
    } else if (action === 'resendConfirmation') {
      payload = adminResendConfirmationEmail(params.code || '');
    } else if (action === 'sendClarification') {
      payload = adminSendClarificationEmail(params.targetKey || '', params.msg || '');
    } else if (action === 'bulkDelete') {
      const codes = params.codes ? params.codes.split(',').map(c =>  c.trim()).filter(Boolean) : [];
      payload = adminDeleteGuests(codes);
    } else if (action === 'generateLinks') {
      payload = adminGenerateLinks();
    } else if (action === 'generateWhatsApp') {
      payload = adminGenerateWhatsAppLinks();
    } else if (action === 'sendDemo') {
      const codes = params.codes ? params.codes.split(',').map(c =>  c.trim()).filter(Boolean) : [];
      payload = adminSendDemoEmails(codes);
    } else if (action === 'sendProd') {
      const codes = params.codes ? params.codes.split(',').map(c =>  c.trim()).filter(Boolean) : [];
      payload = adminSendProductionEmails(codes);
    } else if (action === 'sendReminders') {
      const codes = params.codes ? params.codes.split(',').map(c =>  c.trim()).filter(Boolean) : [];
      payload = adminSendReminders(codes);
    } else if (action === 'cancelReminder' || action === 'cancelarRecordatorio' || action === 'cancelReminderTrigger') {
      payload = desactivarRecordatorioAuto();
    } else if (action === 'clearAll') {
      payload = adminClearAllGuests();
    } else if (action === 'guest') {
      payload = getGuest_(params.code || '');
    } else if (action === 'guestListCheckin') {
      payload = getGuestListCheckin_();
    } else if (action === 'markIngress') {
      payload = markIngress_(params.code || '');
    } else if (action === 'undoIngress') {
      payload = undoIngress_(params.code || '');
    } else if (action === 'addVipDoor') {
      payload = addVipDoor_(params.name || '', params.companion || '', params.seats || 1);
    } else if (action === 'importOfficial') {
      payload = importOfficialList();
    } else if (action === 'cleanDuplicates') {
      payload = adminCleanDuplicates();
    } else if (action === 'expireAllPending' || action === 'expirarPendientes') {
      payload = expirarTodosLosPendientes_();
    } else if (action === 'restoreVIPConfirmed') {
      payload = restaurarVIPsConfirmados_();
    } else if (action === 'searchExternal') {
      const externalSS = SpreadsheetApp.openById('15ul9dCJF7Bv7N6Yic0JJUJkdJOimPKs6');
      const sheet = externalSS.getSheets()[0];
      const data = sheet.getDataRange().getValues();
      const q = (params.q || '').toLowerCase();
      const matches = data.filter(r => r.some(c => String(c).toLowerCase().indexOf(q) >= 0));
      payload = { ok: true, matches };
    } else if (action === 'cleanRateLimitErrors') {
      payload = cleanRateLimitErrors_();
    } else if (action === 'setMaxSeats') {
      payload = setMaxSeats_(params.code || '', Number(params.seats) || 0);
    } else if (action === 'sendDirectClarification') {
      const email = (params.email || '').trim();
      const code = (params.code || '').trim();
      const name = (params.name || '').trim();
      payload = sendDirectClarificationEmail_(email, name, code);
    } else if (action === 'markSent') {
      payload = markGuestSent_(params.code || '', params.email || '');
    } else if (action === 'health') {
      payload = { ok: true, quota: MailApp.getRemainingDailyQuota(), service: 'UA RSVP', timestamp: new Date().toISOString() };
    } else if (action === 'readReportSheet') {
      // Leer la hoja Reporte_Cine_Movie para recuperar datos históricos de confirmados
      const ss = getActiveOrOpenSpreadsheet_();
      const reportSheet = ss.getSheetByName('Reporte_Cine_Movie');
      if (reportSheet) {
        const lastRow = reportSheet.getLastRow();
        const lastCol = reportSheet.getLastColumn();
        const data = lastRow > 0 ? reportSheet.getRange(1, 1, lastRow, lastCol).getDisplayValues() : [];
        payload = { ok: true, rows: data, totalRows: lastRow, totalCols: lastCol };
      } else {
        payload = { ok: false, error: 'No existe la hoja Reporte_Cine_Movie' };
      }
    } else if (action === 'listSheetNames') {
      const ss = getActiveOrOpenSpreadsheet_();
      const sheets = ss.getSheets().map(s => ({ name: s.getName(), rows: s.getLastRow(), cols: s.getLastColumn() }));
      payload = { ok: true, sheets };
    } else if (action === 'readSheet') {
      const sheetName = params.sheet || 'Hoja 1';
      const ss = getActiveOrOpenSpreadsheet_();
      const sheet = ss.getSheetByName(sheetName);
      if (sheet && sheet.getLastRow() > 0) {
        const data = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
        payload = { ok: true, rows: data };
      } else {
        payload = { ok: false, error: 'Hoja no encontrada o vacía: ' + sheetName };
      }
    } else if (action === 'getRevisions') {
      // Listar revisiones del spreadsheet para encontrar datos históricos
      const ss = getActiveOrOpenSpreadsheet_();
      const fileId = ss.getId();
      try {
        const token = ScriptApp.getOAuthToken();
        const revUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '/revisions?pageSize=50&fields=revisions(id,modifiedTime)';
        const revResp = UrlFetchApp.fetch(revUrl, {
          headers: { 'Authorization': 'Bearer ' + token },
          muteHttpExceptions: true
        });
        const revData = JSON.parse(revResp.getContentText());
        if (revData.error) {
          payload = { ok: false, error: revData.error.message || JSON.stringify(revData.error), fileId: fileId };
        } else {
          payload = { ok: true, fileId: fileId, revisions: (revData.revisions || []).map(r => ({ id: r.id, time: r.modifiedTime })) };
        }
      } catch (e) {
        payload = { ok: false, error: e.message || String(e) };
      }
    } else if (action === 'getRevisionData') {
      // Descargar una revisión específica y extraer los datos de Invitados
      const ss = getActiveOrOpenSpreadsheet_();
      const fileId = ss.getId();
      const revId = params.revId || '';
      if (!revId) { payload = { ok: false, error: 'Falta revId' }; }
      else {
        try {
          const token = ScriptApp.getOAuthToken();
          const exportUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '/revisions/' + revId + '?alt=media';
          const resp = UrlFetchApp.fetch(exportUrl, {
            headers: { 'Authorization': 'Bearer ' + token },
            muteHttpExceptions: true
          });
          // La revisión viene como archivo Excel/Sheets binario, no podemos parsearlo fácil
          // Alternativa: exportar como CSV
          const csvUrl = 'https://docs.google.com/spreadsheets/d/' + fileId + '/export?format=csv&gid=0&revision=' + revId;
          const csvResp = UrlFetchApp.fetch(csvUrl, {
            headers: { 'Authorization': 'Bearer ' + token },
            muteHttpExceptions: true
          });
          const csvText = csvResp.getContentText();
          const rows = csvText.split('\n').map(line => {
            // Simple CSV parse
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const ch = line[i];
              if (ch === '"') { inQuotes = !inQuotes; }
              else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
              else { current += ch; }
            }
            result.push(current);
            return result;
          });
          // Filter only Confirmado rows
          const confirmed = rows.filter(r => r.length > 4 && (r[4] || '').toLowerCase().includes('confirmad'));
          payload = { ok: true, totalRows: rows.length, confirmedCount: confirmed.length, confirmed: confirmed.map(r => ({ code: r[0], name: r[1], email: r[2], status: r[4], companion: r[5], companionName: r[6], totalSeats: r[7], responseDate: r[8] })) };
        } catch (e) {
          payload = { ok: false, error: e.message || String(e) };
        }
      }
    } else if (action === 'syncFromGmail' || action === 'restaurarDesdeGmail') {
      // Buscar en Gmail Enviados todas las confirmaciones y sincronizar la base
      payload = restaurarConfirmadosDesdeGmail_Silent_();
    } else if (action === 'searchSentEmails') {
      // Buscar emails de confirmación enviados para recuperar datos perdidos
      try {
        const searchQuery = params.q || '';
        if (!searchQuery) { payload = { ok: false, error: 'Falta parámetro q (email o nombre)' }; }
        else {
          // Buscar en enviados
          const threads = GmailApp.search('in:sent to:' + searchQuery + ' subject:"confirmación" OR subject:"confirmacion" OR subject:"Coyote" OR subject:"Universal Assistance"', 0, 20);
          const results = [];
          threads.forEach(t => {
            const msgs = t.getMessages();
            msgs.forEach(m => {
              results.push({
                date: m.getDate().toISOString(),
                to: m.getTo(),
                subject: m.getSubject(),
                snippet: m.getPlainBody().substring(0, 500)
              });
            });
          });
          payload = { ok: true, count: results.length, emails: results };
        }
      } catch (e) {
        payload = { ok: false, error: e.message || String(e) };
      }
    } else {
      payload = { ok: false, error: 'Acción no válida.' };
    }

    return jsonOrJsonp_(payload, params.callback);
  } catch (error) {
    return jsonOrJsonp_({ ok: false, error: error.message || String(error) }, params.callback);
  }
}


function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};

  // ── MODO SIMULACION (antes del lock, sin efectos secundarios) ──────
  // Permite load testing sin bloquear Sheets ni enviar emails
  if (clean_(p.simulate) === '1') {
    Utilities.sleep(Math.floor(Math.random() * 150 + 80)); // latencia realista 80-230ms
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        simulated: true,
        code: clean_(p.code) || 'SIM-TEST',
        status: clean_(p.attendance) === 'yes' ? 'Confirmado' : 'No asiste',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);

    const action = clean_(p.action);
    const code = clean_(p.code);

    if (action === 'restoreMasterDatabase') {
      const rawData = e.postData && e.postData.contents ? e.postData.contents : p.data;
      const rows = JSON.parse(rawData);
      const sheet = getSheet_(SHEET_INVITADOS);
      const numCols = 17;
      const lastR = sheet.getLastRow();
      if (lastR >= 2) {
        sheet.getRange(2, 1, lastR - 1, numCols).clearContent();
      }
      if (rows && rows.length > 0) {
        sheet.getRange(2, 1, rows.length, numCols).setValues(rows);
      }
      invalidarCacheCompleto_();
      try { generarReporteCine_Silent_(); } catch (_) {}
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, count: rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

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
    // totalSeats = personas reales que asistirán
    // Respetar el maxSeats asignado desde el admin (Col H) cuando es > 2
    const adminMaxSeats = Number(values[7] || 0);
    let totalSeats;
    if (!isAttending) {
      totalSeats = 0;
    } else if (bringsCompanion) {
      // Contar acompañantes reales enviados desde la landing (separados por ' | ')
      const companionCount = companionName.split('|').map(n => n.trim()).filter(Boolean).length;
      // 1 (invitado principal) + cantidad de acompañantes, limitado por maxSeats del admin
      totalSeats = 1 + companionCount;
      if (adminMaxSeats > 0 && totalSeats > adminMaxSeats) {
        totalSeats = adminMaxSeats;
      }
    } else {
      totalSeats = 1;
    }
    const timestamp = new Date();

    // ── MODO LISTA DE ESPERA (activado 26/08/2026) ──
    // Nuevas confirmaciones de invitados Pendientes van a "Lista de Espera" en vez de "Confirmado".
    // Para desactivar, cambiar LISTA_DE_ESPERA a false.
    const LISTA_DE_ESPERA = true;
    if (isAttending && LISTA_DE_ESPERA && currentStatus !== 'Confirmado') {
      // Guardar datos pero con status "Lista de Espera"
      sheet.getRange(row, 3, 1, 7).setValues([[
        email || values[2],
        phone || values[3],
        'Lista de Espera',
        companionValue,
        bringsCompanion ? companionName : '',
        totalSeats,
        timestamp
      ]]);
      sheet.getRange(row, 11).setValue('Lista de Espera - sin email de confirmación');
      const nowStr = Utilities.formatDate(timestamp, 'GMT-03:00', 'dd/MM HH:mm');
      sheet.getRange(row, 16).setValue(`Lista de Espera (${nowStr} hs)`);
      try { CacheService.getScriptCache().remove('GUEST_V2_' + code.toUpperCase()); } catch(_) {}
      try { generarReporteCine_Silent_(); } catch(_) {}
      invalidarCacheCompleto_();
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: true,
          status: 'Lista de Espera',
          totalSeats: totalSeats,
          guestName: guestName,
          waitlist: true
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── VERIFICACIÓN DE CUPOS LIMITADOS EN TIEMPO REAL (respaldo) ──
    if (isAttending && !LISTA_DE_ESPERA) {
      const capStats = getCapacityStats_();
      const existingSeats = currentStatus.toLowerCase().includes('confirmad') ? Number(values[7] || 0) : 0;
      const netSeatIncrease = totalSeats - existingSeats;

      if (capStats.availableSeats < netSeatIncrease) {
        return ContentService
          .createTextOutput(JSON.stringify({
            ok: false,
            soldOut: true,
            error: `Lo sentimos, la capacidad máxima de la sala (${capStats.maxCapacity} lugares) ha sido alcanzada y los cupos están agotados.`
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

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

    // Registrar apertura/respuesta en Columna P (16)
    const nowStr = Utilities.formatDate(timestamp, 'GMT-03:00', 'dd/MM HH:mm');
    sheet.getRange(row, 16).setValue(`Abierto (${nowStr} hs)`);

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

    // Invalidar cache en tiempo real para este invitado
    try { CacheService.getScriptCache().remove('GUEST_V2_' + code.toUpperCase()); } catch(_) {}

    // Actualizar automáticamente "Reporte_Cine_Movie" en tiempo real
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

  const cacheKey = 'GUEST_V2_' + code.toUpperCase();
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (_) {}
  }

  const sheet = getSheet_(SHEET_INVITADOS);
  const row = findGuestRow_(sheet, code);

  if (!row) {
    return { ok: false, error: 'No encontramos esta invitación.' };
  }

  const values = sheet.getRange(row, 1, 1, 11).getDisplayValues()[0];
  const config = getConfig_();
  const capStats = getCapacityStats_();

  // maxSeats = lugares asignados en Col H (puede ser 1, 2, 3, etc.)
  const maxSeats = Number(values[7] || 0) || 2;
  const payload = {
    ok: true,
    guest: {
      code: values[0],
      name: values[1],
      email: values[2],
      phone: values[3],
      status: values[4],
      hasCompanion: values[5] === 'Sí',
      companionName: values[6],
      totalSeats: maxSeats,
      maxSeats: maxSeats,
      responseDate: values[8],
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
      confirmationMessage: config['Mensaje de confirmación'] || 'Tu asistencia quedó registrada.',
      rsvpDeadline: config['Fecha límite de confirmación'] || config['Fecha límite'] || 'Cupos limitados',
      maxCapacity: capStats.maxCapacity,
      totalConfirmedSeats: capStats.totalConfirmedSeats,
      availableSeats: capStats.availableSeats,
      isSoldOut: capStats.isSoldOut
    }
  };

  try {
    cache.put(cacheKey, JSON.stringify(payload), 21600); // Cache por 6 horas para carga instantánea
  } catch (_) {}

  return payload;
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
  const cache = CacheService.getScriptCache();
  const cachedConfig = cache.get('CONFIG_CACHE_V2');
  if (cachedConfig) {
    try { return JSON.parse(cachedConfig); } catch (_) {}
  }

  const sheet = getSheet_(SHEET_CONFIG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getDisplayValues();
  const config = rows.reduce((acc, row) =>  {
    if (row[0]) acc[row[0]] = row[1];
    return acc;
  }, {});

  try {
    cache.put('CONFIG_CACHE_V2', JSON.stringify(config), 3600); // 1 hora
  } catch (_) {}

  return config;
}

/**
 * Calcula las estadísticas de capacidad y ocupación de la sala en tiempo real.
 */
function getCapacityStats_() {
  const config = getConfig_();
  const rawMax = config['Capacidad Máxima'] || config['Capacidad Sala'] || config['Capacidad'];
  const maxCapacity = Number(rawMax) >  0 ? Number(rawMax) : 300;

  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  let totalConfirmedSeats = 0;

  if (lastRow >= 2) {
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    data.forEach(r =>  {
      const status = String(r[4] || '').toLowerCase().trim();
      const companionName = String(r[6] || '').trim();
      if (status.includes('confirmad') || (companionName.length > 0 && !status.includes('no') && !status.includes('expirad'))) {
        const rawSeats = Number(r[7]);
        const companionVal = String(r[5] || '').toLowerCase().trim() === 'sí' || String(r[5] || '').toLowerCase().trim() === 'si' || companionName.length > 0;
        const seats = (!isNaN(rawSeats) && rawSeats >  0 && rawSeats <= 10) ? rawSeats : (companionVal ? 2 : 1);
        totalConfirmedSeats += seats;
      }
    });
  }

  const availableSeats = Math.max(0, maxCapacity - totalConfirmedSeats);
  const isSoldOut = availableSeats <= 0;

  return {
    maxCapacity,
    totalConfirmedSeats,
    availableSeats,
    isSoldOut
  };
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 3: HELPERS DE SPREADSHEET Y MENÚ
// ═══════════════════════════════════════════════════════════════════════

/**
 * Obtiene la planilla activa o por SPREADSHEET_ID.
 */
function getSpreadsheet_() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (_) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Obtiene o crea una pestaña por nombre.
 */

/**
 * Alias de compatibilidad para getSpreadsheet_.
 */
function getActiveOrOpenSpreadsheet_() {
  return getSpreadsheet_();
}

function getSheet_(name) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🍿 UA Eventos')
    .addItem('🔄 ACTUALIZAR TODO (Sync completa)', 'actualizarTodo')
    .addSeparator()
    .addItem('📧 Restaurar Confirmaciones desde Gmail (Enviados)', 'restaurarConfirmadosDesdeGmail_UI')
    .addItem('📊 Generar Reporte para Cine (Movie)', 'generarReporteCine')
    .addItem('🔗 Generar Links de Invitación (Columna J)', 'generarLinksInvitacion')
    .addItem('📋 Copiar Invitaciones (a Sheet externa)', 'copiarInvitaciones')
    .addItem('📨 Enviar Invitaciones por Email', 'enviarInvitaciones')
    .addSeparator()
    .addItem('✅ Activar Columna de Selección DEMO (Col L)', 'prepararColumnaDEMO')
    .addItem('🧪 Enviar DEMO a Seleccionados (Col L)', 'enviarInvitacionesDEMO')
    .addSeparator()
    .addItem('💬 Generar Botones de WhatsApp', 'generarLinksWhatsApp')
    .addItem('🛑 Cancelar Recordatorio Automático', 'desactivarRecordatorioAuto')
    .addItem('✉️ Enviar Recordatorio Ahora (Manual)', 'enviarRecordatorioAConfirmados')
    .addItem('🎲 Generar Códigos Faltantes', 'generarCodigosFaltantes')
    .addItem('📥 Importar Lista Externa', 'importarListaExterna')
    .addSeparator()
    .addItem('⏱️ Activar Sync Automático (cada 10 min)', 'activarSyncInvitaciones')
    .addItem('⏹️ Desactivar Sync Automático', 'desactivarSyncInvitaciones')
    .addItem('🔧 Reparar y Sincronizar Tablas (Desfase)', 'actualizarTodo')
    .addSeparator()
    .addItem('🧪 Cargar Invitados de Prueba', 'agregarInvitadosDePrueba')
    .addItem('🗑️ Vaciar Lista de Invitados', 'vaciarListaInvitados')
    .addItem('✉️ Enviar Correo de Prueba', 'enviarMailDePrueba')
    .addToUi();
}

/**
 * Función interactiva para ejecutar desde el menú de Google Sheets o Apps Script.
 * Escanea la bandeja de Enviados en Gmail en busca de confirmaciones y restaura
 * el estado 'Confirmado' junto con nombres de acompañantes y cupos.
 */
function restaurarConfirmadosDesdeGmail_UI() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    '📧 Restaurar Confirmaciones desde Gmail Enviados',
    'Se escanearán los correos de confirmación de asistencia enviados para detectar invitados que hayan confirmado y restaurar sus estados, cupos y acompañantes.\n\n¿Deseas continuar?',
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  const result = restaurarConfirmadosDesdeGmail_Silent_();

  if (!result.ok) {
    ui.alert('❌ Error al escanear Gmail: ' + (result.error || 'Error desconocido'));
    return;
  }

  let msg = `✅ Escaneo de Gmail finalizado.\n\n`;
  msg += `• Correos de confirmación analizados: ${result.foundEmails}\n`;
  msg += `• Invitados restaurados / actualizados a Confirmado: ${result.restoredCount}\n\n`;

  if (result.restored && result.restored.length > 0) {
    msg += `Detalle de recuperados:\n`;
    result.restored.forEach(r => {
      msg += `• ${r.name} (${r.code}): ${r.seats} cupos, Acompañante: "${r.companionName || 'Ninguno'}"\n`;
    });
  } else {
    msg += `Todos los confirmados en Gmail ya se encontraban correctamente registrados en la planilla.`;
  }

  ui.alert(msg);
}

/**
 * Función que realiza el análisis y restauración silenciosa desde Gmail.
 */
function restaurarConfirmadosDesdeGmail_Silent_() {
  try {
    // 1. Buscar en Gmail todos los correos de confirmación enviados
    const queries = [
      'in:sent subject:"Confirmación de Asistencia"',
      'in:sent subject:"Confirmacion de Asistencia"',
      'in:sent subject:"Coyote vs. Acme" subject:"Confirmación"'
    ];

    const seenMessageIds = new Set();
    const confirmedEmailsData = [];

    queries.forEach(q => {
      const threads = GmailApp.search(q, 0, 150);
      threads.forEach(t => {
        const messages = t.getMessages();
        messages.forEach(m => {
          const msgId = m.getId();
          if (seenMessageIds.has(msgId)) return;
          seenMessageIds.add(msgId);

          const subject = m.getSubject() || '';
          const body = m.getPlainBody() || '';
          const htmlBody = m.getBody() || '';
          const rawTo = m.getTo() || '';
          const date = m.getDate();

          // Extraer código (UA-XXXXXXXX)
          let code = '';
          const codeMatch = subject.match(/\((UA-[A-Z0-9]+)\)/i) || body.match(/(?:C[oó]digo personal|C[oó]digo|Code):\s*(UA-[A-Z0-9]+)/i) || subject.match(/(UA-[A-Z0-9]{8})/i);
          if (codeMatch) code = codeMatch[1].toUpperCase();

          // Extraer email limpio
          const emailMatch = rawTo.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          const toEmail = emailMatch ? emailMatch[1].toLowerCase().trim() : rawTo.toLowerCase().trim();

          // Extraer nombre del invitado
          let guestName = '';
          const nameMatch = body.match(/Hola\s+([^,\n\r]+),/i);
          if (nameMatch) {
            guestName = nameMatch[1].trim();
          }

          // Extraer acompañante(s)
          let companionName = '';
          const compMatch = body.match(/Acompa[nñ]ante\(s\):\s*([^\n\r]+)/i);
          if (compMatch) {
            companionName = compMatch[1].trim();
          } else {
            // Buscar en HTML si existe
            const htmlCompMatch = htmlBody.match(/Acompa[nñ]ante\(s\):?<\/strong>\s*([^<]+)/i) || htmlBody.match(/Acompa[nñ]ante\(s\):?\s*([^<]+)/i);
            if (htmlCompMatch) companionName = htmlCompMatch[1].trim();
          }

          // Extraer cantidad de cupos / accesos
          let seats = 1;
          const seatsMatch = body.match(/Acceso para\s+(\d+)\s+personas/i);
          if (seatsMatch) {
            seats = parseInt(seatsMatch[1], 10);
          } else if (body.includes('Acceso para 2 personas') || companionName) {
            seats = 2;
          } else if (body.includes('Acceso individual')) {
            seats = 1;
          }

          confirmedEmailsData.push({
            code: code,
            guestName: guestName,
            toEmail: toEmail,
            companionName: companionName,
            seats: seats,
            date: date,
            dateStr: Utilities.formatDate(date, 'GMT-3', 'dd/MM/yyyy HH:mm:ss')
          });
        });
      });
    });

    // 2. Leer la planilla Invitados y actualizar
    const sheet = getSheet_(SHEET_INVITADOS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { ok: true, foundEmails: confirmedEmailsData.length, restoredCount: 0, restored: [] };
    }

    const data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
    const restored = [];

    // Mapas de búsqueda rápida por fila (1-indexed en sheet = i + 2)
    const rowByCode = {};
    const rowsByEmail = {};
    const rowsByName = {};

    data.forEach((r, i) => {
      const rowIndex = i + 2;
      const c = String(r[0] || '').trim().toUpperCase();
      const n = String(r[1] || '').trim().toUpperCase();
      const e = String(r[2] || '').trim().toLowerCase();

      if (c) rowByCode[c] = { rowIndex, data: r, idx: i };
      if (e) {
        if (!rowsByEmail[e]) rowsByEmail[e] = [];
        rowsByEmail[e].push({ rowIndex, data: r, idx: i });
      }
      if (n) {
        if (!rowsByName[n]) rowsByName[n] = [];
        rowsByName[n].push({ rowIndex, data: r, idx: i });
      }
    });

    const updatedRows = new Set();

    confirmedEmailsData.forEach(conf => {
      let target = null;

      // 1. Intentar por código exacto
      if (conf.code && rowByCode[conf.code]) {
        target = rowByCode[conf.code];
      }
      // 2. Intentar por nombre exacto
      else if (conf.guestName && rowsByName[conf.guestName.toUpperCase().trim()]) {
        target = rowsByName[conf.guestName.toUpperCase().trim()][0];
      }
      // 3. Intentar por email
      else if (conf.toEmail && rowsByEmail[conf.toEmail]) {
        // Si hay varios con mismo email, priorizar el que no sea 'Extra Vendedor' o el que coincida en nombre
        const matches = rowsByEmail[conf.toEmail];
        target = matches.find(m => conf.guestName && String(m.data[1] || '').toUpperCase().includes(conf.guestName.toUpperCase())) || matches[0];
      }

      if (!target) return;
      if (updatedRows.has(target.rowIndex)) return;

      const currentRow = target.data;
      const currentStatus = String(currentRow[4] || '').trim();
      const currentCompanionName = String(currentRow[6] || '').trim();
      const currentCode = String(currentRow[0] || '').trim();

      const needsUpdate = currentStatus !== 'Confirmado' || (conf.companionName && !currentCompanionName) || (conf.code && conf.code !== currentCode);

      if (needsUpdate) {
        updatedRows.add(target.rowIndex);

        const codeToSet = conf.code || currentCode;
        const name = currentRow[1] || conf.guestName;
        const compName = conf.companionName || currentCompanionName;
        const hasCompanion = (compName || conf.seats >= 2) ? 'Sí' : 'No';
        const totalSeats = conf.seats || (hasCompanion === 'Sí' ? 2 : 1);
        const link = `${LANDING_URL}?i=${encodeURIComponent(codeToSet)}`;

        // Actualizar celdas en la planilla
        sheet.getRange(target.rowIndex, 1).setValue(codeToSet); // Col A: Código
        sheet.getRange(target.rowIndex, 5).setValue('Confirmado'); // Col E: Estado RSVP
        sheet.getRange(target.rowIndex, 6).setValue(hasCompanion); // Col F: Lleva Acompañante
        sheet.getRange(target.rowIndex, 7).setValue(compName); // Col G: Nombre Acompañante
        sheet.getRange(target.rowIndex, 8).setValue(totalSeats); // Col H: Total Lugares
        sheet.getRange(target.rowIndex, 9).setValue(conf.dateStr); // Col I: Fecha Respuesta
        sheet.getRange(target.rowIndex, 10).setValue(link); // Col J: Link
        sheet.getRange(target.rowIndex, 11).setValue(`Confirmación enviada el ${conf.dateStr} (Sincronizado desde Gmail)`); // Col K: Mail Status

        restored.push({
          code: codeToSet,
          name: name,
          email: conf.toEmail,
          seats: totalSeats,
          companionName: compName,
          date: conf.dateStr
        });
      }
    });

    // 3. Limpiar caché y regenerar reporte de cine
    invalidarCacheCompleto_();
    try { generarReporteCine_Silent_(); } catch (_) {}

    return {
      ok: true,
      foundEmails: confirmedEmailsData.length,
      restoredCount: restored.length,
      restored: restored,
      allConfirmedInGmail: confirmedEmailsData
    };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

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
  const confirmed = data.filter(r =>  {
    const status = String(r[4] || '').toLowerCase().trim();
    return status.includes('confirmad');
  });

  let totalSeatsSum = 0;
  let singleSeatsCount = 0;
  let doubleSeatsCount = 0;
  const rowsToInsert = [];

  confirmed.forEach((r, idx) =>  {
    const code = r[0] || `UA-${idx+1}`;
    const name = r[1] || 'Invitado';
    const companionVal = String(r[5] || '').toLowerCase().trim() === 'sí' || String(r[5] || '').toLowerCase().trim() === 'si';
    const companionName = r[6] || '-';
    
    // Col H puede contener el qty importado (ej. 100+) o el totalSeats real del RSVP
    // Si alguien confirmó con acompañante = 2 seats, sino = 1
    // Solo usar Col H si es un valor razonable (1-10), sino usar companion status
    const rawSeats = Number(r[7]);
    let seats;
    if (!isNaN(rawSeats) && rawSeats >  0 && rawSeats <= 10) {
      seats = rawSeats;
    } else {
      seats = companionVal ? 2 : 1;
    }

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

  // Capacidad total de la sala (parametrizada o 300 por defecto)
  const config = getConfig_();
  const rawMax = config['Capacidad Máxima'] || config['Capacidad Sala'] || config['Capacidad'];
  const maxCapacity = Number(rawMax) >  0 ? Number(rawMax) : 300;
  const freeSeats = maxCapacity - totalSeatsSum;

  // Cajas resumen con Alerta cuando quedan menos de 60 asientos disponibles
  let freeBgColor = '#dcfce7'; // Verde (>  60 libres)
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
  if (rowsToInsert.length >  0) {
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

  data.forEach(r =>  {
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

    const config = getConfig_();
    const rsvpDeadline = config['Fecha límite de confirmación'] || config['Fecha límite'] || 'Cupos limitados';

    const textMsg = [
      `¡Hola *${firstName}*! 👋`,
      '',
      '*Universal Assistance* tiene el agrado de invitarte a una función exclusiva de cine 🎬',
      '',
      '🍿 *Película:* Coyote vs. Acme',
      '🗓️ *Fecha:* Jueves 27 de Agosto',
      '⏰ *Horario:* 19:30 hs (Recepción y acreditación) · 20:00 hs (Función puntual)',
      '📍 *Lugar:* Movie Montevideo Shopping',
      '🍿 *Incluye:* Pop y bebida cortesía de Universal Assistance',
      '',
      '⚠️ *IMPORTANTE:*',
      'Esta invitación es personal e intransferible. Los cupos de la sala son estrictamente limitados.',
      '',
      `👉 *Confirmá tu lugar antes del ${rsvpDeadline} ingresando aquí:*`,
      invitationUrl,
      '',
      '¡Te esperamos para compartir una gran noche de cine!',
      '----------------------------------------',
      '*Universal Assistance Uruguay*'
    ].join('\n');
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
  existingTriggers.forEach(t =>  {
    if (t.getHandlerFunction() === 'enviarRecordatorioAConfirmados_Auto_') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Fecha del evento: 27/08/2026 ->  Recordatorio 24hs antes: 26/08/2026 10:00 AM
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
 * Cancela y elimina cualquier activador programado para recordatorios automáticos.
 */
function desactivarRecordatorioAuto() {
  let deletedCount = 0;
  try {
    const existingTriggers = ScriptApp.getProjectTriggers();
    existingTriggers.forEach(t => {
      ScriptApp.deleteTrigger(t);
      deletedCount++;
    });
  } catch (e) {}

  return { ok: true, deletedTriggers: deletedCount, remaining: ScriptApp.getProjectTriggers().length };
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

  data.forEach((r, idx) =>  {
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

  confirmedRows.forEach(g =>  {
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
  const seatsText = totalSeats > 2 ? `Acceso para ${totalSeats} personas (Vos + ${totalSeats - 1})` : totalSeats === 2 ? 'Acceso para 2 personas (Vos + 1)' : 'Acceso individual (1 persona)';
  const qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(invitationUrl) + '&color=071938&bgcolor=ffffff';

  // Derive day of week from date string (dd/mm/yyyy)
  const dayNames = ['Domingo','Lunes','Martes','Mi\u00e9rcoles','Jueves','Viernes','S\u00e1bado'];
  const dateParts = eventDate.split('/');
  const dateObj = dateParts.length === 3 ? new Date(dateParts[2], dateParts[1] - 1, dateParts[0]) : new Date();
  const dayOfWeek = dayNames[dateObj.getDay()] || 'Jueves';

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
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>Invitacion Universal Assistance</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <style>table{border-collapse:collapse;}td,th{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;}</style>
    <![endif]-->
    <style>
      body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
      table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
      body{margin:0;padding:0;width:100%!important;}
      @media only screen and (max-width:600px){
        .card{width:100%!important;}
        .pad{padding:18px 16px!important;}
        .title{font-size:24px!important;}
        .col{display:block!important;width:100%!important;padding:0 0 10px 0!important;}
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;" bgcolor="#071938">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">Tu invitacion exclusiva para Coyote vs Acme. Cupos limitados.&#847;&#847;&#847;</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#071938" style="background-color:#071938;">
      <tr><td align="center" valign="top" style="padding:24px 8px;">
        <!--[if mso]><table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="480"><tr><td align="center" valign="top" width="480"><![endif]-->
        <table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td class="pad" bgcolor="#071938" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid #1e3a5f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              <div style="font-size:18px;font-weight:bold;color:#ffffff;line-height:22px;">UNIVERSAL ASSISTANCE</div>
              <div style="font-size:10px;font-weight:bold;color:#38bdf8;letter-spacing:1px;line-height:14px;margin-top:2px;">A COMPANY OF ZURICH &middot; ASISTENCIA AL VIAJERO</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="pad" bgcolor="#0b2149" style="padding:28px 24px;background-color:#0b2149;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

              <!-- Confirmada Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#064e3b" style="background-color:#064e3b;border:2px solid #34d399;margin-bottom:20px;">
                <tr><td style="padding:14px;text-align:center;">
                  <div style="font-size:11px;font-weight:bold;color:#34d399;text-transform:uppercase;letter-spacing:1px;line-height:16px;margin-bottom:4px;">&#10003; ASISTENCIA CONFIRMADA</div>
                  <div style="font-size:13px;font-weight:bold;color:#ffffff;line-height:20px;">Tu lugar est&aacute; reservado para el <span style="color:#34d399;text-decoration:underline;">${dayOfWeek} ${escapeHtml_(eventDate)}</span>.</div>
                </td></tr>
              </table>

              <div style="font-size:12px;font-weight:bold;color:#38bdf8;line-height:16px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Tu lugar est&aacute; reservado para</div>
              <div class="title" style="margin:0 0 20px 0;color:#ffffff;font-size:30px;font-weight:bold;line-height:34px;text-transform:uppercase;">COYOTE VS ACME</div>

              <!-- Guest Name -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#16356e" style="background-color:#16356e;border:1px solid #38bdf8;margin-bottom:20px;">
                <tr><td style="padding:14px;">
                  <div style="font-size:10px;font-weight:bold;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;line-height:14px;margin-bottom:3px;">INVITADO ESPECIAL</div>
                  <div style="font-size:19px;font-weight:bold;color:#ffffff;line-height:24px;">${escapeHtml_(guestName)}</div>
                </td></tr>
              </table>

              <!-- Event Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td class="col" width="50%" valign="top" style="vertical-align:top;padding-right:8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    <div style="font-size:10px;font-weight:bold;color:#38bdf8;text-transform:uppercase;line-height:14px;">FECHA Y HORA</div>
                    <div style="font-size:13px;font-weight:bold;color:#ffffff;line-height:18px;margin-top:2px;">${dayOfWeek} ${escapeHtml_(eventDate)} &middot; ${escapeHtml_(eventTime)} hs</div>
                    <div style="font-size:11px;color:#cbd5e1;line-height:16px;margin-top:1px;">Llegada: ${escapeHtml_(arrivalTime)} hs</div>
                  </td>
                  <td class="col" width="50%" valign="top" style="vertical-align:top;padding-left:8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    <div style="font-size:10px;font-weight:bold;color:#38bdf8;text-transform:uppercase;line-height:14px;">LUGAR</div>
                    <div style="font-size:13px;font-weight:bold;color:#ffffff;line-height:18px;margin-top:2px;">${escapeHtml_(venue)}</div>
                    <div style="line-height:16px;margin-top:1px;"><a href="${escapeHtml_(mapsUrl)}" style="color:#38bdf8;font-size:11px;font-weight:bold;text-decoration:underline;" target="_blank">Ver en Maps</a></div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <!--[if mso]>
              <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="280"><tr><td align="center">
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml_(invitationUrl)}" style="height:50px;v-text-anchor:middle;width:280px;" arcsize="50%" stroke="f" fillcolor="#ee1f73">
                <w:anchorlock/><center style="color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;">Ver mi Invitaci&oacute;n y QR</center>
              </v:roundrect>
              </td></tr></table>
              <![endif]-->
              <!--[if !mso]><!-->
              <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="#ee1f73" style="background-color:#ee1f73;border-radius:999px;">
                    <a href="${escapeHtml_(invitationUrl)}" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;border-radius:999px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;" target="_blank">Ver mi Invitaci&oacute;n y QR</a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->

              <!-- Sub-note -->
              <div style="font-size:11px;color:#94a3b8;text-align:center;line-height:18px;margin-top:14px;">
                <strong style="color:#ffffff;">Tu asistencia est&aacute; confirmada.</strong>  Present&aacute; este c&oacute;digo en la entrada.<br>
                Tu c&oacute;digo: <strong style="color:#38bdf8;">${escapeHtml_(code)}</strong>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#071938" style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid #1e3a5f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              <div style="font-weight:bold;font-size:12px;color:#ffffff;line-height:16px;">UNIVERSAL ASSISTANCE URUGUAY</div>
              <div style="font-size:11px;color:#38bdf8;line-height:16px;margin-top:4px;font-weight:bold;">
                Tel: ${escapeHtml_(phone)} &nbsp;|&nbsp;
                <a href="mailto:${escapeHtml_(replyTo)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml_(replyTo)}</a>
              </div>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td></tr>
    </table>
    <!-- TRACKING_PIXEL -->
    <img src="${APPS_SCRIPT_WEBAPP_URL}?action=trackOpen&i=${escapeHtml_(code)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
  </body>
</html>`;

  options.htmlBody = htmlBody;

  const plainTextBody = [
    `Hola ${guestName},`,
    '',
    'Tu asistencia quedo confirmada. Te esperamos en la funcion exclusiva de cine organizada por Universal Assistance.',
    '',
    'DETALLES DE TU RESERVA:',
    '--------------------------------------',
    `  Evento: ${eventName}`,
    `  Fecha: ${eventDate}`,
    `  Hora: ${eventTime}`,
    `  Llegada sugerida: ${arrivalTime}`,
    `  Lugar: ${venue}`,
    `  Accesos: ${seatsText}`,
    totalSeats >= 2 ? `  Acompanante(s): ${companionName}` : '',
    `  Codigo personal: ${code}`,
    '',
    'IMPORTANTE:',
    '  - Presenta tu codigo o QR en la entrada.',
    '  - Te recomendamos llegar con anticipacion.',
    '',
    `Ver tu invitacion y QR: ${invitationUrl}`,
    '',
    '--------------------------------------',
    'Universal Assistance Uruguay',
    'Asistencia al Viajero',
    '',
    'Este correo fue enviado por Universal Assistance Uruguay.',
    'Si recibiste este email por error, por favor ignora este mensaje.'
  ].filter(Boolean).join('\n');

  sendEmailFromCorporateAccount_(email, subject, plainTextBody, options);
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 9: EMAILS - RECORDATORIO (Ticket VIP dark con QR)
// ═══════════════════════════════════════════════════════════════════════

function sendReminderEmail_(email, guestName, totalSeats, companionName, code, type) {
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

  // Derive day of week from date string (dd/mm/yyyy)
  const dayNames = ['Domingo','Lunes','Martes','Mi\u00e9rcoles','Jueves','Viernes','S\u00e1bado'];
  const dateParts = eventDate.split('/');
  const dateObj = dateParts.length === 3 ? new Date(dateParts[2], dateParts[1] - 1, dateParts[0]) : new Date();
  const dayOfWeek = dayNames[dateObj.getDay()] || 'Jueves';

  let subject = `Recordatorio de Funci\u00f3n Especial - Coyote vs. Acme | Universal Assistance (${code})`;
  if (type === 'week') {
    subject = `🗓️ ¡Falta 1 semana! Recordatorio - Coyote vs. Acme | Universal Assistance (${code})`;
  } else if (type === '24h') {
    subject = `⏰ ¡Es mañana! Recordatorio - Coyote vs. Acme | Universal Assistance (${code})`;
  }

  const seatsText = totalSeats > 2 ? `Acceso para ${totalSeats} personas (Vos + ${totalSeats - 1})` : totalSeats === 2 ? 'Acceso para 2 personas (Vos + 1)' : 'Acceso individual (1 persona)';
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
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Recordatorio: ¡Te esperamos el Jueves 27 de Agosto en la función especial de Coyote vs. Acme en Movie Montevideo Shopping!</div>
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
                      <div style="font-size:13px;font-weight:800;color:#ffffff !important;margin-top:2px;">${dayOfWeek} ${escapeHtml_(eventDate)} · ${escapeHtml_(eventTime)} hs</div>
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
    <!-- TRACKING_PIXEL -->
    <img src="${APPS_SCRIPT_WEBAPP_URL}?action=trackOpen&i=${escapeHtml_(code)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
  </body>
</html>`;

  options.htmlBody = htmlBody;

  const plainTextBody = [
    `Hola ${guestName},`,
    '',
    'Te recordamos que la funcion exclusiva de cine organizada por Universal Assistance es manana.',
    'Queremos asegurarnos de que no te la pierdas.',
    '',
    'RECORDATORIO DEL EVENTO:',
    '--------------------------------------',
    `  Evento: ${eventName}`,
    `  Fecha: ${eventDate}`,
    `  Hora: ${eventTime}`,
    `  Lugar: ${venue}`,
    `  Accesos: ${seatsText}`,
    totalSeats >= 2 ? `  Acompanante(s): ${companionName}` : '',
    `  Codigo personal: ${code}`,
    '',
    'RECOMENDACIONES:',
    `  - Llega a las ${arrivalTime} hs para asegurar tu lugar.`,
    '  - Presenta tu codigo o QR en la entrada.',
    '  - Si no podes asistir, avisanos respondiendo este correo.',
    '',
    `Ver tu invitacion y QR: ${invitationUrl}`,
    '',
    '--------------------------------------',
    'Universal Assistance Uruguay',
    'Asistencia al Viajero',
    '',
    'Este correo fue enviado por Universal Assistance Uruguay.',
    'Si recibiste este email por error, por favor ignora este mensaje.'
  ].filter(Boolean).join('\n');

  sendEmailFromCorporateAccount_(email, subject, plainTextBody, options);
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 10: ENVÍO DE CORREO (resiliente, sin bloqueo por cuenta)
// ═══════════════════════════════════════════════════════════════════════

function sendEmailFromCorporateAccount_(recipient, subject, plainTextBody, options) {
  Logger.log('🛑 ENVÍO VÍA GMAILAPP/MAILAPP BLOQUEADO PERMANENTEMENTE: Política de seguridad activa.');
  return { ok: false, error: 'Envíos automáticos por GmailApp/MailApp bloqueados permanentemente por el usuario.' };
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
 * Columnas origen: NOMBRE | APELLIDO | CANAL | AGENCIA | CANTIDAD | REFERENTE | EMAIL(G)
 * Columnas destino: A=Código | B=Nombre | C=Email | D=Teléfono | E=Estado | F=Acompañante
 *                   G=NombreAcomp | H=TotalLugares | I=FechaResp | J=LinkInvitacion | K=MailStatus
 *                   N(14)=Canal/Agencia | O(15)=Referente
 */
function importarListaExterna() {
  const ui = SpreadsheetApp.getUi();

  const EXTERNAL_SPREADSHEET_ID = '15ul9dCJF7Bv7N6Yic0JJUJkdJOimPKs6';
  const EXTERNAL_GID = 1784002841;

  try {
    const externalSS = SpreadsheetApp.openById(EXTERNAL_SPREADSHEET_ID);
    const sheets = externalSS.getSheets();
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

    const rows = srcData.slice(1);

    const validRows = rows.filter(r =>  {
      const nombre = String(r[0] || '').trim();
      const apellido = String(r[1] || '').trim();
      const canal = String(r[2] || '').trim();
      const cantidad = r[4];

      if (!nombre && !apellido) return false;
      if (canal === 'CANAL - CLIENTE' || String(cantidad) === 'CANTIDAD DE PERSONAS') return false;

      return true;
    });

    if (validRows.length === 0) {
      ui.alert('No se encontraron invitados válidos en la lista externa.');
      return;
    }

    const destSheet = getSheet_(SHEET_INVITADOS);
    const destLastRow = destSheet.getLastRow();

    const existingCodes = new Set();
    const existingNames = new Set();
    if (destLastRow >= 2) {
      const existingData = destSheet.getRange(2, 1, destLastRow - 1, 2).getValues();
      existingData.forEach(r =>  {
        if (r[0]) existingCodes.add(String(r[0]).trim());
        if (r[1]) existingNames.add(String(r[1]).trim().toUpperCase());
      });
    }

    const newRows = [];
    let skipped = 0;

    validRows.forEach(r =>  {
      const nombre = String(r[0] || '').trim();
      const apellido = String(r[1] || '').trim();
      const fullName = capitalizeWords_(`${nombre} ${apellido}`);

      if (existingNames.has(fullName.toUpperCase())) {
        skipped++;
        return;
      }

      let qty = parseInt(r[4], 10);
      if (isNaN(qty) || qty < 1) qty = 2;

      // Capturar Canal/Agencia y Referente de la lista externa
      const canal = String(r[2] || '').trim();
      const agencia = String(r[3] || '').trim();
      const referente = String(r[5] || '').trim();
      const emailExterno = String(r[6] || '').trim();
      const canalAgencia = agencia ? `${canal} - ${agencia}` : canal;

      let code;
      do {
        code = 'UA-' + Utilities.getUuid()
          .replace(/-/g, '')
          .slice(0, 8)
          .toUpperCase();
      } while (existingCodes.has(code));
      existingCodes.add(code);
      existingNames.add(fullName.toUpperCase());

      // A=Código | B=Nombre | C=Email | D=Teléfono | E=Estado | F=Acompañante
      // G=NombreAcomp | H=TotalLugares | I=FechaResp | J=LinkInvitacion | K=MailStatus
      newRows.push({
        main: [
          code,
          fullName,
          emailExterno,   // Email de Col G externa (si existe)
          '',             // Teléfono
          'Pendiente',
          qty >= 2 ? 'Sí' : 'No',
          '',             // Nombre acompañante
          qty,
          '',             // Fecha respuesta
          '',             // Link (se genera después)
          ''              // Mail status
        ],
        canalAgencia,
        referente
      });
    });

    if (newRows.length === 0) {
      ui.alert(`Todos los invitados de la lista ya existen en la pestaña Invitados. (${skipped} duplicados omitidos)`);
      return;
    }

    // Asegurar encabezados de columnas N y O
    destSheet.getRange(1, 14).setValue('Canal/Agencia').setFontWeight('bold');
    destSheet.getRange(1, 15).setValue('Referente').setFontWeight('bold');

    // Insertar datos principales (cols A-K = 11 columnas)
    const startRow = destLastRow + 1;
    const mainData = newRows.map(r =>  r.main);
    destSheet.getRange(startRow, 1, mainData.length, 11).setValues(mainData);

    // Insertar Canal/Agencia (Col N=14) y Referente (Col O=15)
    const extraData = newRows.map(r =>  [r.canalAgencia, r.referente]);
    destSheet.getRange(startRow, 14, extraData.length, 2).setValues(extraData);

    const msg = `✅ Importación completada:\n\n` +
      `• ${newRows.length} invitados nuevos agregados\n` +
      `• ${skipped} duplicados omitidos\n` +
      `• Total de lugares asignados: ${newRows.reduce((sum, r) =>  sum + r.main[7], 0)}\n\n` +
      `Los códigos de invitación ya fueron generados automáticamente.\n` +
      `Canal/Agencia y Referente guardados en columnas N y O.`;

    ui.alert('Importación Exitosa', msg, ui.ButtonSet.OK);
    Logger.log(msg);

  } catch (err) {
    ui.alert('Error al importar', `No se pudo importar la lista:\n${err.message}`, ui.ButtonSet.OK);
    Logger.log('Error importación: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECCIÓN 12B: COPIAR INVITACIONES A HOJA3 DE SHEET EXTERNA (AUTO-SYNC)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Sincroniza la Hoja1 de la spreadsheet externa con la Hoja3 (pestaña de distribución).
 * - Auto-importa invitados nuevos que no estén en nuestra planilla Invitados
 * - Duplica toda la data de Hoja1 en Hoja3
 * - Agrega columnas de Link y Mensaje pre-armado
 * - Protege las columnas de Link y Mensaje
 *
 * Se puede ejecutar manualmente o automáticamente cada 10 min vía trigger.
 */
function copiarInvitaciones() {
  const ui = SpreadsheetApp.getUi();
  const result = copiarInvitaciones_Silent_();

  if (result.error) {
    ui.alert('Error', result.error, ui.ButtonSet.OK);
    return;
  }

  ui.alert(
    '📋 Invitaciones Sincronizadas en Hoja3',
    `Se sincronizó la Hoja3 de la spreadsheet externa.\n\n` +
    `• ${result.totalRows} invitados procesados\n` +
    `• ${result.matched} con link y mensaje generado\n` +
    `• ${result.imported} nuevos importados automáticamente\n` +
    `• ${result.updated || 0} nombres actualizados (editados en Hoja1)\n` +
    `• ${result.noMatch} sin código asignable\n\n` +
    `La Hoja3 queda protegida (solo copiar, no editar).`,
    ui.ButtonSet.OK
  );
}

/**
 * Reparación y reconstrucción completa de la planilla Invitados desde Hoja1.
 * Elimina cualquier desfase de filas manteniendo los códigos UA-XXX y respuestas RSVP intactos.
 */
function repararYReconstruirInvitados_UI() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    '🔧 Reparar y Reconstruir Tablas',
    '¿Deseás re-alinear todas las filas desde Hoja1?\n\n' +
    'Esto corregirá cualquier desfase de nombres o correos, conservando los códigos de invitación y las respuestas de los confirmados.',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  const res = repararYReconstruirInvitados();
  if (res.error) {
    ui.alert('❌ Error', res.error, ui.ButtonSet.OK);
  } else {
    ui.alert(
      '✅ Tablas Alineadas y Sincronizadas',
      `Se re-alinearon ${res.count} invitados perfectamente sin desfase.\n` +
      `Las pestañas Invitados, Reporte_Cine_Movie y Hoja3 quedaron actualizadas.`,
      ui.ButtonSet.OK
    );
  }
}

function repararYReconstruirInvitados() {
  const EXTERNAL_SPREADSHEET_ID = '15ul9dCJF7Bv7N6Yic0JJUJkdJOimPKs6';
  const EXTERNAL_GID = 1784002841;

  try {
    const externalSS = SpreadsheetApp.openById(EXTERNAL_SPREADSHEET_ID);
    const allSheets = externalSS.getSheets();
    let srcSheet = null;
    for (const s of allSheets) {
      if (s.getSheetId() === EXTERNAL_GID) { srcSheet = s; break; }
    }
    if (!srcSheet) srcSheet = allSheets[0];

    const srcData = srcSheet.getDataRange().getValues();
    let headerRow = -1;
    for (let i = 0; i < Math.min(10, srcData.length); i++) {
      if (String(srcData[i][0] || '').trim().toUpperCase() === 'NOMBRE') {
        headerRow = i;
        break;
      }
    }
    if (headerRow === -1) return { error: 'No se encontró la cabecera NOMBRE en Hoja1.' };

    // 1. Leer Hoja1 (Fuente oficial de verdad para nombres y emails)
    let validGuests = [];
    for (let i = headerRow + 1; i < srcData.length; i++) {
      const row = srcData[i];
      const nombre = String(row[0] || '').trim();
      const apellido = String(row[1] || '').trim();
      const canal = String(row[2] || '').trim();
      const agencia = String(row[3] || '').trim();
      const cantidad = row[4];
      const referente = String(row[5] || '').trim();
      const email = String(row[6] || '').trim();

      if ((!nombre && !apellido) || canal === 'CANAL - CLIENTE' || String(cantidad) === 'CANTIDAD DE PERSONAS') {
        continue;
      }

      let qty = parseInt(cantidad, 10);
      if (isNaN(qty) || qty < 1) qty = 2;

      let fullName;
      const nUp = nombre.toUpperCase();
      const aUp = apellido.toUpperCase();
      if (nUp === aUp || !apellido) {
        fullName = capitalizeWords_(nombre);
      } else if (!nombre) {
        fullName = capitalizeWords_(apellido);
      } else {
        fullName = capitalizeWords_(`${nombre} ${apellido}`);
      }

      validGuests.push({
        nombre, apellido, canal, agencia, qty, referente, email, fullName
      });
    }

    // 2. Leer respuestas y códigos actuales de nuestra planilla Invitados
    const invSheet = getSheet_(SHEET_INVITADOS);
    const lastRow = invSheet.getLastRow();

    const codeByName = {};
    const codeByEmail = {};
    const statusByCode = {};
    const companionByCode = {};
    const companionNameByCode = {};
    const totalSeatsByCode = {};
    const respDateByCode = {};
    const mailStatusByCode = {};
    const existingCodes = new Set();

    if (lastRow >= 2) {
      const invData = invSheet.getRange(2, 1, lastRow - 1, 16).getValues();
      invData.forEach(r =>  {
        const code  = String(r[0] || '').trim();
        const name  = String(r[1] || '').trim().toUpperCase();
        const email = String(r[2] || '').trim().toLowerCase();
        if (!code) return;

        existingCodes.add(code);
        if (name) codeByName[name] = code;
        if (email) codeByEmail[email] = code;

        statusByCode[code]        = r[4] || 'Pendiente';
        companionByCode[code]     = r[5] || 'No';
        companionNameByCode[code] = r[6] || '';
        totalSeatsByCode[code]    = r[7] || 0;
        respDateByCode[code]      = r[8] || '';
        mailStatusByCode[code]    = r[10] || '';
      });
    }

    // 1b. Asegurar invitados de confirmaciones directas especiales (Myriam Cardozo y Daniel Pons)
    const OFFICIAL_EXTRA_GUESTS = [
      {
        code: 'UA-FE5ED687',
        fullName: 'Myriam Cardozo',
        email: 'servicioscomplementarios@hospitalevangelico.com',
        qty: 2,
        canal: 'CANAL - AGENCIA',
        agencia: 'Salud Evangelico',
        referente: 'UA',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Emiliano Pons'
      },
      {
        code: 'UA-96126526',
        fullName: 'Daniel Pons',
        email: '',
        qty: 3,
        canal: 'CANAL - AGENCIA',
        agencia: 'Pons',
        referente: 'UA',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Alexandra Ramilo / Juan Manuel Trinidad'
      },
      {
        code: 'UA-CFA78ED7',
        fullName: 'Geronimo Cassoni',
        email: '',
        qty: 2,
        canal: 'CANAL - AGENCIA',
        agencia: 'Traveloz / Destinico',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: '',
        companionName: ''
      },
      {
        code: 'UA-99FD2E88',
        fullName: 'Leandro Lencina',
        email: '',
        qty: 2,
        canal: 'CANAL - AGENCIA',
        agencia: 'Traveloz / Destinico',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: '',
        companionName: ''
      },
      {
        code: 'UA-651EEDC2',
        fullName: 'Joaquin Ojeda',
        email: '',
        qty: 2,
        canal: 'CANAL - AGENCIA',
        agencia: 'Traveloz / Destinico',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: '',
        companionName: ''
      },
      {
        code: 'UA-B9E1A14D',
        fullName: 'Francisco Calviño',
        email: '',
        qty: 2,
        canal: 'CANAL - AGENCIA',
        agencia: 'Traveloz / Destinico',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: '',
        companionName: ''
      },
      {
        code: 'UA-0FB47E1B',
        fullName: 'Ignacio Vidal',
        email: '',
        qty: 2,
        canal: 'CANAL - AGENCIA',
        agencia: 'Traveloz / Destinico',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: '',
        companionName: ''
      },
      {
        code: 'UA-96126527',
        fullName: 'Tiffany Herrera',
        email: '',
        qty: 2,
        canal: 'CANAL - AGENCIA',
        agencia: 'PROVIAJES',
        referente: 'AB',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      // ── ASOCIACIÓN ESPAÑOLA (Pases Oficiales entregados por Marianna a Angela) ──
      {
        code: 'UA-DDC44D12',
        fullName: 'Angela Hoffman',
        email: 'ahoffmann@asesp.com.uy',
        qty: 2,
        canal: 'SALUD',
        agencia: 'ASOC ESPAÑOLA',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-F264FA49',
        fullName: 'Extra Vendedor',
        email: 'ahoffmann@asesp.com.uy',
        qty: 2,
        canal: 'SALUD',
        agencia: 'ASOC ESPAÑOLA',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-AB5F31F5',
        fullName: 'Extra Vendedor',
        email: 'ahoffmann@asesp.com.uy',
        qty: 2,
        canal: 'SALUD',
        agencia: 'ASOC ESPAÑOLA',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-0D9CB9D1',
        fullName: 'Extra Vendedor',
        email: 'ahoffmann@asesp.com.uy',
        qty: 2,
        canal: 'SALUD',
        agencia: 'ASOC ESPAÑOLA',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-35B91EE9',
        fullName: 'Extra Vendedor',
        email: 'ahoffmann@asesp.com.uy',
        qty: 2,
        canal: 'SALUD',
        agencia: 'ASOC ESPAÑOLA',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-B36F0809',
        fullName: 'Extra Vendedor',
        email: 'ahoffmann@asesp.com.uy',
        qty: 2,
        canal: 'SALUD',
        agencia: 'ASOC ESPAÑOLA',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      // ── CASMU (Pases Oficiales entregados por Marianna a Nadia) ──
      {
        code: 'UA-8F23F9C7',
        fullName: 'Nadia Nuñez',
        email: 'ca72787@casmu.com',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-A4BB6932',
        fullName: 'Extra Vendedor',
        email: 'ca72787@casmu.com',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-AC652B40',
        fullName: 'Extra Vendedor',
        email: 'ca72787@casmu.com',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-F46A82A6',
        fullName: 'Extra Vendedor',
        email: 'ca72787@casmu.com',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-9CF6443E',
        fullName: 'Extra Vendedor',
        email: 'ca72787@casmu.com',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      // ── CONFIRMACIONES RESTAURADAS (SEMM, COSEM, ASESP) ──
      {
        code: 'UA-DF9F77B2',
        fullName: 'Laura Caprio',
        email: 'laura.caprio@semm.com.uy',
        qty: 2,
        canal: 'SALUD',
        agencia: 'SEMM',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'No',
        companionName: ''
      },
      {
        code: 'UA-D88A84A6',
        fullName: 'Sandra Perroni',
        email: 'sperroni@asesp.com.uy',
        qty: 1,
        canal: 'SALUD',
        agencia: 'ASOC ESPAÑOLA',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'No',
        companionName: ''
      },
      {
        code: 'UA-D2D0AE66',
        fullName: 'Ivanna',
        email: 'ivanna@mercurioviajes.com.uy',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'MERCURIO VIAJES',
        referente: 'AB',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-96126469',
        fullName: 'Tatiana',
        email: 'tatiana@mercurioviajes.com.uy',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'MERCURIO VIAJES',
        referente: 'AB',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-E1398250',
        fullName: 'Enzo Figueira',
        email: 'tikinga@gmail.com',
        qty: 3,
        canal: 'CORREDOR DE SEGUROS',
        agencia: 'ENZO FIGUEIRA',
        referente: 'AC',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-DF9DAD65',
        fullName: 'Pablo Perez',
        email: 'pablop21@gmail.com',
        qty: 2,
        canal: 'BANCO',
        agencia: 'ITAU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-BA5D8F1D',
        fullName: 'Victoria Méndez Aramendía',
        email: 'vmendezaramendia@gmail.com',
        qty: 2,
        canal: 'MANUAL',
        agencia: 'MANUAL',
        referente: 'UA',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-805814BB',
        fullName: 'Sandra Yuane',
        email: '',
        qty: 3,
        canal: 'MANUAL',
        agencia: 'Alejandro Méndez',
        referente: 'Alejandro Méndez',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-0B534AE6',
        fullName: 'Eliana Pizzorno',
        email: '',
        qty: 2,
        canal: 'MANUAL',
        agencia: 'Alejandro Méndez',
        referente: 'Alejandro Méndez',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-98620481',
        fullName: 'Rodrigo Pinto',
        email: '',
        qty: 3,
        canal: 'MANUAL',
        agencia: 'AGENCIA',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-98620600',
        fullName: 'Alejandra Palermo',
        email: 'alejandra@melitour.com.uy',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'Melitour',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-98620599',
        fullName: 'Gianfranco Iafrate',
        email: '',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'Melitour',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-98620601',
        fullName: 'Carmen Galan',
        email: 'carmen@melitour.com.uy',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'Melitour',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-DBAB436B',
        fullName: 'Laura Rodriguez',
        email: '',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'Azul Viajes',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-D4AB1964',
        fullName: 'Cecilia Cabana',
        email: 'ccabana@tuviaje.uy',
        qty: 3,
        canal: 'AGENCIA',
        agencia: 'Tu Viaje',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-81B2E7FB',
        fullName: 'Sebastian',
        email: 'sebastian@tuviaje.uy',
        qty: 3,
        canal: 'AGENCIA',
        agencia: 'Tu Viaje',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-B9D60563',
        fullName: 'Pase CAMBADU (Titular)',
        email: '',
        qty: 2,
        canal: 'ALIANZAS ESTRATEGICAS',
        agencia: 'CAMBADU',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-B19373A2',
        fullName: 'Pase CAMBADU (Equipo)',
        email: '',
        qty: 2,
        canal: 'ALIANZAS ESTRATEGICAS',
        agencia: 'CAMBADU',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-1A61CF1F',
        fullName: 'Elisa Costa',
        email: 'elisa.costa@cosem.com.uy',
        qty: 3,
        canal: 'SALUD',
        agencia: 'COSEM',
        referente: 'COSEM',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: '2 Acompañantes'
      },
      {
        code: 'UA-F104E515',
        fullName: 'Florencia Flores',
        email: 'flores.pereira15@gmail.com',
        qty: 2,
        canal: 'MANUAL',
        agencia: 'MANUAL',
        referente: '',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Gonzalo Alfaro'
      },
      {
        code: 'UA-1E01D75E',
        fullName: 'Pase Radio Carve (Titular)',
        email: '',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Radio Carve',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-7B3EC8C0',
        fullName: 'Pase Radio Carve (Equipo)',
        email: '',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Radio Carve',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-D672D07F',
        fullName: 'Joaquín Barreto',
        email: 'jbarreto@amsj.com.uy',
        qty: 3,
        canal: 'SALUD',
        agencia: 'AMSJ',
        referente: 'AM/MT',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-CACCD528',
        fullName: 'Roxana',
        email: '',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Infonegocios',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-889613D8',
        fullName: 'Pase Infonegocios (Equipo)',
        email: '',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Infonegocios',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-8F23F9C7',
        fullName: 'Nadia Nuñez',
        email: 'ca72787@casmu.com',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Agustín Maubrigades'
      },
      {
        code: 'UA-EF243E65',
        fullName: 'Maximiliano Cobas',
        email: '',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Juan Manuel Cobas'
      },
      {
        code: 'UA-FF989B31',
        fullName: 'Stephanie Olivera',
        email: '',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Acompañante'
      },
      {
        code: 'UA-67244620',
        fullName: 'Anahir Aguilar',
        email: 'paraanacom@hotmail.com',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Horacio Botta'
      },
      {
        code: 'UA-0A597B97',
        fullName: 'Karina Rossini',
        email: 'elianakarinarossini@gmail.com',
        qty: 2,
        canal: 'SALUD',
        agencia: 'CASMU',
        referente: 'AM/MT',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Martin Picasso'
      },
      {
        code: 'UA-AFE5BD48',
        fullName: 'Gimena Rodriguez',
        email: '',
        qty: 4,
        canal: 'AGENCIA',
        agencia: 'Tu Viaje',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-6DD558DE',
        fullName: 'Fabrizio Maglione',
        email: 'fmaglione@jpsantos.com.uy',
        qty: 3,
        canal: 'AGENCIA',
        agencia: 'JP Santos',
        referente: 'Ana Laura Britos',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Lorenzo Maglione y Acompañante'
      },
      {
        code: 'UA-87D9FC83',
        fullName: 'Gabriel Lopez (Pase 2)',
        email: '',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'JP Santos',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-49D8E751',
        fullName: 'Lucia Amestoy',
        email: 'lucia.amestoy@amestoyuruguay.com',
        qty: 4,
        canal: 'AGENCIA',
        agencia: 'Amestoy Viajes',
        referente: 'Ana Laura Britos',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: 'Juan Pablo Morales | Karina | Diego'
      },
      {
        code: 'UA-9E439B34',
        fullName: 'Jorge Martínez',
        email: '',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'Jorge Martínez',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-192EB1CE',
        fullName: 'Joel Felder',
        email: '',
        qty: 4,
        canal: 'AGENCIA',
        agencia: 'Buemes',
        referente: 'Ana Laura Britos',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: '3 Acompañantes'
      },
      {
        code: 'UA-7D8E219B',
        fullName: 'Maximiliano Abreo',
        email: '',
        qty: 4,
        canal: 'AGENCIA',
        agencia: 'Buemes',
        referente: 'Ana Laura Britos',
        status: 'Confirmado',
        companion: 'Sí',
        companionName: '3 Acompañantes'
      },
      {
        code: 'UA-C40101A1',
        fullName: 'Mariano Mosca',
        email: 'mmosca@canal4.com.uy',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Canal 4',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-C40202B2',
        fullName: 'W. Helou',
        email: 'whelou@canal4.com.uy',
        qty: 10,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Canal 4',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-C40303C3',
        fullName: 'B. Perdomo',
        email: 'bperdomo@canal4.com.uy',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Canal 4',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-C40404D4',
        fullName: 'J. Olivera',
        email: 'jolivera@canal4.com.uy',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Canal 4',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-C40505E5',
        fullName: 'W. Helou - Equipo 1',
        email: 'whelou@canal4.com.uy',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Canal 4',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-C40606F6',
        fullName: 'W. Helou - Equipo 2',
        email: 'whelou@canal4.com.uy',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Canal 4',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-C40707A7',
        fullName: 'W. Helou - Equipo 3',
        email: 'whelou@canal4.com.uy',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Canal 4',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-C40808B8',
        fullName: 'W. Helou - Equipo 4',
        email: 'whelou@canal4.com.uy',
        qty: 2,
        canal: 'MEDIOS / PRENSA',
        agencia: 'Canal 4',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-CF5493C0',
        fullName: 'Natalia Doglio (Pase 1 - Adulto + 2 Niños)',
        email: 'natalia.doglio@anda.com.uy',
        qty: 3,
        canal: 'AGENCIA',
        agencia: 'ANDA',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-D06110A1',
        fullName: 'Cupo ANDA / Natalia Doglio (Pase 2 - Adulto + 2 Niños)',
        email: 'natalia.doglio@anda.com.uy',
        qty: 3,
        canal: 'AGENCIA',
        agencia: 'ANDA',
        referente: 'Ana Camiou',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-7E81C09F',
        fullName: 'Shirley Cervantes',
        email: 'cervantesshirley@gmail.com',
        qty: 2,
        canal: 'MANUAL',
        agencia: 'INVITADOS UA',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-4F91B2C8',
        fullName: 'Valeria Amaral',
        email: 'valeria.amaral@gmail.com',
        qty: 2,
        canal: 'MANUAL',
        agencia: 'INVITADOS UA',
        referente: 'UA',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-6A820E9B',
        fullName: 'Gustavo Amoroso',
        email: '',
        qty: 3,
        canal: 'AGENCIA',
        agencia: 'AMOROSO VIAJES',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-3771D38F',
        fullName: 'Belén Arbiza',
        email: 'cobranzas@dcom.uy',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'DCOM Travel',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      },
      {
        code: 'UA-85A412B2',
        fullName: 'Emiliano Arevalo',
        email: '',
        qty: 2,
        canal: 'AGENCIA',
        agencia: 'Guamatur',
        referente: 'Ana Laura Britos',
        status: 'Pendiente',
        companion: 'Sí',
        companionName: ''
      }
    ];

    OFFICIAL_EXTRA_GUESTS.forEach(extra => {
      const existing = validGuests.find(g => g.fullName.toUpperCase().trim() === extra.fullName.toUpperCase().trim());
      if (existing) {
        existing.forcedCode = extra.code;
        existing.forcedStatus = extra.status;
        existing.forcedCompanion = extra.companion;
        existing.forcedCompanionName = extra.companionName;
      } else {
        validGuests.push({
          nombre: extra.fullName,
          apellido: '',
          canal: extra.canal,
          agencia: extra.agencia,
          qty: extra.qty,
          referente: extra.referente,
          email: extra.email,
          fullName: extra.fullName,
          forcedCode: extra.code,
          forcedStatus: extra.status,
          forcedCompanion: extra.companion,
          forcedCompanionName: extra.companionName
        });
      }
    });

    // 3. Deduplicar y reconstruir tabla limpia basada en Hoja1
    const seenGuestKeys = new Set();
    const uniqueValidGuests = [];
    validGuests.forEach(g => {
      const emailLower = (g.email || '').toLowerCase().trim();
      const nameKey = (g.fullName || '').toUpperCase().trim();
      const key = emailLower && emailLower.includes('@') && emailLower !== 'no tengo' ? `email:${emailLower}` : `name:${nameKey}`;
      if (nameKey === 'EXTRA VENDEDOR' || nameKey.includes('EQUIPO') || nameKey.includes('CUPO') || nameKey.includes('TRAVELOZ') || nameKey.includes('DESTINICO')) {
        uniqueValidGuests.push(g);
      } else if (!seenGuestKeys.has(key)) {
        seenGuestKeys.add(key);
        uniqueValidGuests.push(g);
      }
    });
    validGuests = uniqueValidGuests;

    const cleanRows = [];
    const cleanExtraRows = [];
    const usedCodes = new Set(); // Track codes matched to Hoja1

    validGuests.forEach(g =>  {
      const nameUpper = g.fullName.toUpperCase();
      const emailLower = (g.email || '').toLowerCase();

      // Intentar asociar código existente por email o nombre único
      let code = g.forcedCode || null;
      if (!code) {
        if (emailLower && codeByEmail[emailLower]) {
          code = codeByEmail[emailLower];
          delete codeByEmail[emailLower];
        } else if (nameUpper && nameUpper !== 'EXTRA VENDEDOR' && nameUpper !== 'CUPO' && nameUpper !== 'TRAVELOZ' && nameUpper !== 'DESTINICO' && codeByName[nameUpper]) {
          code = codeByName[nameUpper];
          delete codeByName[nameUpper];
        }
      }

      if (!code) {
        do {
          code = 'UA-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
        } while (existingCodes.has(code));
        existingCodes.add(code);
      }

      usedCodes.add(code);

      const status        = g.forcedStatus || statusByCode[code] || 'Pendiente';
      const companion     = g.forcedCompanion || companionByCode[code] || (g.qty >= 2 ? 'Sí' : 'No');
      const companionName = g.forcedCompanionName || companionNameByCode[code] || '';
      const totalSeats    = totalSeatsByCode[code] || g.qty;
      const respDate      = respDateByCode[code] || '';
      const link          = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
      const mailStatus    = mailStatusByCode[code] || '';

      // Col A-K (main)
      cleanRows.push([
        code, g.fullName, g.email, '', status,
        companion, companionName, totalSeats, respDate, link, mailStatus
      ]);

      // Col M-O (extra: Canal, Agencia, Referente)
      cleanExtraRows.push([g.canal, g.agencia, g.referente]);
    });

    // 3.5 Preservar invitados manuales (agregados desde Admin, no presentes en Hoja1)
    const seenNames = new Set(validGuests.map(g => g.fullName.toUpperCase().trim()));

    if (lastRow >= 2) {
      const fullInvData = invSheet.getRange(2, 1, lastRow - 1, 16).getValues();
      fullInvData.forEach(r =>  {
        const code  = String(r[0] || '').trim();
        const name  = String(r[1] || '').trim();
        if (!code || !name) return;
        const nameKey = name.toUpperCase().trim();

        // Omitir si ya está en la lista oficial de Hoja1 o si ya fue procesado
        if (usedCodes.has(code) || seenNames.has(nameKey)) return;

        seenNames.add(nameKey);
        usedCodes.add(code);
        const link = r[9] || `${LANDING_URL}?i=${encodeURIComponent(code)}`;
        cleanRows.push([
          code, name, r[2] || '', r[3] || '', r[4] || 'Pendiente',
          r[5] || 'No', r[6] || '', r[7] || 0, r[8] || '', link, r[10] || ''
        ]);
        cleanExtraRows.push([r[12] || 'MANUAL', r[13] || '', r[14] || '']);
      });
    }

    // 4. Limpiar y reescribir tabla Invitados perfectamente alineada
    if (lastRow >= 2) {
      invSheet.getRange(2, 1, lastRow - 1, 16).clearContent();
    }

    invSheet.getRange(1, 13).setValue('Canal').setFontWeight('bold');
    invSheet.getRange(1, 14).setValue('Agencia/Convenio').setFontWeight('bold');
    invSheet.getRange(1, 15).setValue('Referente').setFontWeight('bold');

    if (cleanRows.length > 0) {
      invSheet.getRange(2, 1, cleanRows.length, 11).setValues(cleanRows);
      invSheet.getRange(2, 13, cleanExtraRows.length, 3).setValues(cleanExtraRows);
    }

    invalidarCacheCompleto_();
    try { generarReporteCine_Silent_(); } catch (_) {}

    return { ok: true, count: cleanRows.length };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

/**
 * Versión silenciosa para ejecutar desde triggers automáticos (sin UI).
 */
function copiarInvitaciones_Silent_() {
  const EXTERNAL_SPREADSHEET_ID = '15ul9dCJF7Bv7N6Yic0JJUJkdJOimPKs6';
  const EXTERNAL_GID = 1784002841;
  const COL_REF_EXTERNA = 16; // Col P = referencia a fila externa

  try {
    // ── 1. Abrir spreadsheet externa y leer Hoja1 ──
    const externalSS = SpreadsheetApp.openById(EXTERNAL_SPREADSHEET_ID);
    const allSheets = externalSS.getSheets();
    let srcSheet = null;
    for (const s of allSheets) {
      if (s.getSheetId() === EXTERNAL_GID) { srcSheet = s; break; }
    }
    if (!srcSheet) srcSheet = allSheets[0];

    const srcData = srcSheet.getDataRange().getValues();

    // Detectar fila del header (buscar "NOMBRE" en Col A)
    let headerRow = -1;
    for (let i = 0; i < Math.min(srcData.length, 15); i++) {
      if (String(srcData[i][0] || '').trim().toUpperCase() === 'NOMBRE') {
        headerRow = i;
        break;
      }
    }
    if (headerRow === -1) {
      return { error: 'No se encontró el header "NOMBRE" en la Hoja1 externa.' };
    }

    const dataStartIdx = headerRow + 1;

    // Extraer filas válidas con su índice de fila original (para tracking)
    const validGuests = [];
    for (let i = dataStartIdx; i < srcData.length; i++) {
      const row = srcData[i];
      const nombre = String(row[0] || '').trim();
      const apellido = String(row[1] || '').trim();
      const canal = String(row[2] || '').trim();
      const agencia = String(row[3] || '').trim();
      const cantidad = row[4];
      const referente = String(row[5] || '').trim();
      const emailStage1 = String(row[6] || '').trim(); // Col G = 1º ETAPA DE ENVÍO
      const emailStage2 = String(row[7] || '').trim(); // Col H = 2º ETAPA DE ENVIO

      if ((!nombre && !apellido) || canal === 'CANAL - CLIENTE' || String(cantidad) === 'CANTIDAD DE PERSONAS') {
        continue;
      }

      let qty = parseInt(cantidad, 10);
      if (isNaN(qty) || qty < 1) qty = 2;

      let fullName;
      const nUp = nombre.toUpperCase();
      const aUp = apellido.toUpperCase();
      if (nUp === aUp || !apellido) {
        fullName = capitalizeWords_(nombre);
      } else if (!nombre) {
        fullName = capitalizeWords_(apellido);
      } else {
        fullName = capitalizeWords_(`${nombre} ${apellido}`);
      }

      const hasEmail1 = emailStage1 && emailStage1.toUpperCase() !== 'NO TENGO' && emailStage1.toUpperCase() !== 'NO' && emailStage1.indexOf('@') >= 0;
      const hasEmail2 = emailStage2 && emailStage2.toUpperCase() !== 'NO TENGO' && emailStage2.toUpperCase() !== 'NO' && emailStage2.indexOf('@') >= 0;

      if (hasEmail1) {
        validGuests.push({
          nombre, apellido, canal, agencia, qty, referente, email: emailStage1, stage: '1er Envío', fullName,
          externalRef: `H1:R${i + 1}:E1`
        });
      }

      if (hasEmail2 && emailStage2.toLowerCase() !== emailStage1.toLowerCase()) {
        validGuests.push({
          nombre, apellido, canal, agencia, qty, referente, email: emailStage2, stage: '2do Envío', fullName,
          externalRef: `H1:R${i + 1}:E2`
        });
      }

      if (!hasEmail1 && !hasEmail2) {
        validGuests.push({
          nombre, apellido, canal, agencia, qty, referente, email: (emailStage1 || emailStage2 || ''), stage: 'Envío Manual', fullName,
          externalRef: `H1:R${i + 1}`
        });
      }
    }

    if (validGuests.length === 0) {
      return { error: 'No se encontraron invitados válidos en Hoja1.' };
    }

    // ── 2. Leer nuestra planilla Invitados con todas las columnas relevantes ──
    const invSheet = getSheet_(SHEET_INVITADOS);
    const invLastRow = invSheet.getLastRow();

    const existingCodes = new Set();
    const guestByCode = {};   // code ->  { row, code, name, email, status }
    const guestByName = {};   // nameUpper ->  { row, code, name, email, status }
    const guestByEmail = {};  // emailLower ->  { row, code, name, email, status }

    if (invLastRow >= 2) {
      // Leer cols A(1)=Código, B(2)=Nombre, C(3)=Email, D(4)=Tel, E(5)=Estado
      const invData = invSheet.getRange(2, 1, invLastRow - 1, 5).getValues();

      for (let i = 0; i < invData.length; i++) {
        const code  = String(invData[i][0] || '').trim();
        const name  = String(invData[i][1] || '').trim();
        const email = String(invData[i][2] || '').trim();
        const status = String(invData[i][4] || '').trim();
        const invRow = i + 2;

        if (code) existingCodes.add(code);
        const item = { row: invRow, code, name, email, status };

        if (code) guestByCode[code.toUpperCase()] = item;
        if (name) guestByName[name.toUpperCase()] = item;
        if (email) guestByEmail[email.toLowerCase()] = item;
      }
    }

    // ── 3. Sincronizar: detectar por Nombre o Email ──
    const newImportRows = [];
    let importCount = 0;
    let updateCount = 0;
    const finalGuestCodes = {};   // index ->  code
    const finalGuestStatuses = {};// index ->  status

    validGuests.forEach((g, idx) =>  {
      const nameKey = g.fullName.toUpperCase().trim();
      const emailKey = g.email.toLowerCase().trim();

      let matched = null;

      // Buscar coincidencia: primero por Email (si existe), luego por Nombre
      if (emailKey && guestByEmail[emailKey]) {
        matched = guestByEmail[emailKey];
      } else if (nameKey && guestByName[nameKey]) {
        matched = guestByName[nameKey];
      }

      if (matched) {
        // IMPORTANTE: matched.row = 0 significa que este invitado fue agregado como NUEVO
        // en una iteración anterior del mismo loop (ej: misma persona con email1 y email2).
        // En ese caso NO escribir en el sheet (fila 0 = crash "starting row too small").
        if (matched.row >  0) {
          let updatedInSheet = false;

          if (g.fullName && matched.name !== g.fullName) {
            invSheet.getRange(matched.row, 2).setValue(g.fullName);
            matched.name = g.fullName;
            updatedInSheet = true;
          }

          if (g.email && matched.email !== g.email) {
            invSheet.getRange(matched.row, 3).setValue(g.email);
            matched.email = g.email;
            updatedInSheet = true;
          }

          // Actualizar Canal, Agencia, Referente y Etapa en cols M(13), N(14), O(15), Q(17)
          if (g.canal || g.agencia || g.referente || g.stage) {
            invSheet.getRange(matched.row, 13).setValue(g.canal || '');
            invSheet.getRange(matched.row, 14).setValue(g.agencia || '');
            invSheet.getRange(matched.row, 15).setValue(g.referente || '');
            invSheet.getRange(matched.row, 17).setValue(g.stage || '1er Envío');
          }

          if (updatedInSheet) {
            try { CacheService.getScriptCache().remove('GUEST_V2_' + matched.code.toUpperCase()); } catch(_) {}
            updateCount++;
          }
        }

        finalGuestCodes[idx] = matched.code;
        finalGuestStatuses[idx] = matched.status || 'Pendiente';
        return;
      }

      // Caso: Invitado completamente nuevo
      let code;
      do {
        code = 'UA-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
      } while (existingCodes.has(code));
      existingCodes.add(code);

      const newItem = { row: 0, code, name: g.fullName, email: g.email, status: 'Pendiente' };
      if (nameKey) guestByName[nameKey] = newItem;
      if (emailKey) guestByEmail[emailKey] = newItem;

      newImportRows.push({
        main: [
          code, g.fullName, g.email, '', 'Pendiente',
          g.qty >= 2 ? 'Sí' : 'No', '', g.qty, '', '', ''
        ],
        canal: g.canal,
        agencia: g.agencia,
        referente: g.referente,
        stage: g.stage || '1er Envío',
        idx
      });

      finalGuestCodes[idx] = code;
      finalGuestStatuses[idx] = 'Pendiente';
      importCount++;
    });

    // Insertar nuevos invitados en nuestra planilla
    if (newImportRows.length >  0) {
      invSheet.getRange(1, 13).setValue('Canal').setFontWeight('bold');
      invSheet.getRange(1, 14).setValue('Agencia/Convenio').setFontWeight('bold');
      invSheet.getRange(1, 15).setValue('Referente').setFontWeight('bold');
      if (invSheet.getMaxColumns() < 17) {
        invSheet.insertColumnsAfter(invSheet.getMaxColumns(), 17 - invSheet.getMaxColumns());
      }
      invSheet.getRange(1, 17).setValue('Etapa').setFontWeight('bold');

      const startRow = Math.max(invSheet.getLastRow() + 1, 2);
      const mainData = newImportRows.map(r =>  r.main);
      invSheet.getRange(startRow, 1, mainData.length, 11).setValues(mainData);

      newImportRows.forEach((r, i) =>  {
        const rIdx = startRow + i;
        invSheet.getRange(rIdx, 13).setValue(r.canal || '');
        invSheet.getRange(rIdx, 14).setValue(r.agencia || '');
        invSheet.getRange(rIdx, 15).setValue(r.referente || '');
        invSheet.getRange(rIdx, 17).setValue(r.stage || '1er Envío');
      });
    }

    // ── 4. Preparar Hoja3 ──
    let hoja3 = externalSS.getSheetByName('Hoja3');
    if (!hoja3) {
      hoja3 = externalSS.insertSheet('Hoja3');
    } else {
      hoja3.clear();
      hoja3.clearConditionalFormatRules();
      try { hoja3.getRange(1, 1, hoja3.getMaxRows(), hoja3.getMaxColumns()).clearDataValidations(); } catch (_) {}
    }

    try {
      hoja3.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p =>  p.remove());
      hoja3.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(p =>  p.remove());
    } catch (_) {}

    const config = getConfig_();
    const eventDate = config['Fecha'] || '27/08/2026';
    const eventTime = config['Hora'] || '20:00';
    const venue = config['Lugar'] || 'Movie Montevideo Shopping';
    const COL_COUNT = 10;

    // ── 5. Escribir título, subtítulo, botón y headers ──

    // Fila 1: Título
    hoja3.getRange(1, 1, 1, COL_COUNT).merge()
      .setValue('UNIVERSAL ASSISTANCE — DISTRIBUCIÓN DE INVITACIONES')
      .setFontWeight('bold').setFontSize(13).setFontColor('#ffffff')
      .setBackground('#071938').setHorizontalAlignment('center').setVerticalAlignment('middle');
    hoja3.setRowHeight(1, 36);

    // Fila 2: Subtítulo evento
    hoja3.getRange(2, 1, 1, COL_COUNT).merge()
      .setValue(`Coyote vs. Acme | ${formatDateText_(eventDate)} · ${eventTime} hs | ${venue}`)
      .setFontWeight('bold').setFontSize(10).setFontColor('#071938')
      .setBackground('#e2e8f0').setHorizontalAlignment('center');

    // Fila 3: Resumen y timestamp
    const totalPersonas = validGuests.reduce((sum, g) =>  sum + g.qty, 0);
    const timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');
    hoja3.getRange(3, 1, 1, COL_COUNT).merge()
      .setValue(`${validGuests.length} invitados · ${totalPersonas} personas totales · Última actualización: ${timestamp} hs`)
      .setFontSize(9).setFontColor('#64748b').setBackground('#f8fafc')
      .setHorizontalAlignment('center');

    // Fila 4: Botón ACTUALIZAR interactivo
    const syncUrl = `${APPS_SCRIPT_WEBAPP_URL}?action=syncSheet`;
    hoja3.getRange(4, 1, 1, 4).merge()
      .setFormula(`=HYPERLINK("${syncUrl}", "🔄 HACÉ CLICK ACÁ PARA ACTUALIZAR")`)
      .setFontWeight('bold').setFontSize(10).setFontColor('#ffffff')
      .setBackground('#1a73e8').setHorizontalAlignment('center').setVerticalAlignment('middle');
    hoja3.getRange(4, 5, 1, 6).merge()
      .setValue('Se sincroniza automáticamente cada 10 min. Podés hacer click en el botón azul para actualizar al instante.')
      .setFontSize(9).setFontColor('#5f6368').setBackground('#e8f0fe')
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    hoja3.setRowHeight(4, 34);

    // Fila 6: Headers de tabla
    const headers = ['NOMBRE', 'APELLIDO', 'CANAL', 'AGENCIA/CONVENIO', 'PERSONAS', 'REFERENTE', 'EMAIL', 'LINK INVITACIÓN 🔒', 'MENSAJE PARA COPIAR 🔒', 'ESTADO'];
    hoja3.getRange(6, 1, 1, COL_COUNT).setValues([headers])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#0d2c60')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    hoja3.setRowHeight(6, 30);

    // ── 6. Escribir datos de invitados con links y mensajes ──
    const outputRows = [];
    let countMatched = 0;
    let countNoMatch = 0;

    validGuests.forEach((g, idx) =>  {
      const code = finalGuestCodes[idx] || '';
      const status = finalGuestStatuses[idx] || 'Pendiente';

      let link = '';
      let message = '';

      if (code) {
        const invitationUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
        link = invitationUrl;

        const firstName = firstName_(g.fullName);
        const isExtra = g.nombre.toUpperCase() === 'EXTRA' ||
                        g.nombre.toUpperCase() === 'A SORTEO' ||
                        g.apellido.toUpperCase() === 'A SORTEO' ||
                        g.agencia.toUpperCase() === 'A SORTEO' ||
                        g.canal.toUpperCase() === 'A SORTEO' ||
                        g.fullName.toUpperCase().includes('SORTEO') ||
                        g.fullName.toUpperCase().includes('EXTRA') ||
                        g.fullName.toUpperCase().includes('CUPO') ||
                        (g.nombre.toUpperCase() === g.apellido.toUpperCase());

        if (isExtra) {
          message = [
            `*Universal Assistance* tiene el agrado de invitarte a una función exclusiva de cine 🎬`,
            '',
            '🍿 *Película:* Coyote vs. Acme',
            `🗓️ *Fecha:* Jueves 27 de Agosto`,
            `⏰ *Horario:* 19:30 hs (Recepción y acreditación) · ${eventTime} hs (Función puntual)`,
            `📍 *Lugar:* ${venue}`,
            `🎟️ *Accesos:* ${g.qty} persona${g.qty > 1 ? 's' : ''}`,
            '🍿 *Incluye:* Pop y bebida cortesía de Universal Assistance',
            '',
            '⚠️ *IMPORTANTE:*',
            'Esta invitación es personal e intransferible. Los cupos de la sala son estrictamente limitados.',
            '',
            '👉 *Confirmá tu lugar ingresando aquí:*',
            invitationUrl,
            '',
            '¡Te esperamos!',
            '----------------------------------------',
            '*Universal Assistance Uruguay*'
          ].join('\n');
        } else {
          message = [
            `¡Hola *${firstName}*! 👋`,
            '',
            '*Universal Assistance* tiene el agrado de invitarte a una función exclusiva de cine 🎬',
            '',
            '🍿 *Película:* Coyote vs. Acme',
            `🗓️ *Fecha:* Jueves 27 de Agosto`,
            `⏰ *Horario:* 19:30 hs (Recepción y acreditación) · ${eventTime} hs (Función puntual)`,
            `📍 *Lugar:* ${venue}`,
            `🎟️ *Accesos:* ${g.qty} persona${g.qty > 1 ? 's' : ''}`,
            '🍿 *Incluye:* Pop y bebida cortesía de Universal Assistance',
            '',
            '⚠️ *IMPORTANTE:*',
            'Esta invitación es personal e intransferible. Los cupos de la sala son estrictamente limitados.',
            '',
            '👉 *Confirmá tu lugar ingresando aquí:*',
            invitationUrl,
            '',
            '¡Te esperamos para compartir una gran noche de cine!',
            '----------------------------------------',
            '*Universal Assistance Uruguay*'
          ].join('\n');
        }
        countMatched++;
      } else {
        link = '(sin código)';
        message = 'Pendiente de importación.';
        countNoMatch++;
      }

      outputRows.push([
        g.nombre, g.apellido, g.canal, g.agencia, g.qty,
        g.referente, g.email, link, message, status
      ]);
    });

    if (outputRows.length >  0) {
      const dataRange = hoja3.getRange(7, 1, outputRows.length, COL_COUNT);
      dataRange.setValues(outputRows).setFontSize(10).setVerticalAlignment('middle');

      hoja3.getRange(7, 5, outputRows.length, 1).setHorizontalAlignment('center');
      hoja3.getRange(7, 8, outputRows.length, 1).setFontColor('#1a73e8').setFontSize(9);
      hoja3.getRange(7, 9, outputRows.length, 1).setWrap(true).setFontSize(9);
      hoja3.getRange(7, 8, outputRows.length, 2).setBackground('#f1f3f4');
      hoja3.getRange(7, 10, outputRows.length, 1).setHorizontalAlignment('center').setFontWeight('bold');

      // Formateo por estado: strikethrough + colores
      for (let i = 0; i < outputRows.length; i++) {
        const rowNum = 7 + i;
        const rowStatus = outputRows[i][9]; // Col J = ESTADO
        const rowRange = hoja3.getRange(rowNum, 1, 1, COL_COUNT);
        const estadoCell = hoja3.getRange(rowNum, 10);

        if (rowStatus === 'Confirmado') {
          // Tachar toda la fila y poner fondo verde suave
          rowRange.setFontLine('line-through').setFontColor('#6b7280');
          estadoCell.setFontLine('none').setFontColor('#15803d').setBackground('#dcfce7').setValue('✅ Confirmado');
        } else if (rowStatus === 'No asiste') {
          rowRange.setFontLine('line-through').setFontColor('#9ca3af');
          estadoCell.setFontLine('none').setFontColor('#dc2626').setBackground('#fee2e2').setValue('❌ No asiste');
        } else {
          // Pendiente
          rowRange.setFontLine('none');
          if (i % 2 === 1) {
            hoja3.getRange(rowNum, 1, 1, 7).setBackground('#f8fafc');
          }
          estadoCell.setFontColor('#d97706').setBackground('#fef9c3').setValue('⏳ Pendiente');
        }
      }
    }

    // ── 7. Anchos de columnas ──
    hoja3.setColumnWidth(1, 140);
    hoja3.setColumnWidth(2, 140);
    hoja3.setColumnWidth(3, 140);
    hoja3.setColumnWidth(4, 180);
    hoja3.setColumnWidth(5, 80);
    hoja3.setColumnWidth(6, 100);
    hoja3.setColumnWidth(7, 200);
    hoja3.setColumnWidth(8, 340);
    hoja3.setColumnWidth(9, 420);
    hoja3.setColumnWidth(10, 130);

    // ── 8. Agregar filtros automáticos ──
    try {
      // Remover filtro existente si hay
      const existingFilter = hoja3.getFilter();
      if (existingFilter) existingFilter.remove();
      // Crear filtro desde la fila de headers (6) hasta la última fila de datos
      const filterRange = hoja3.getRange(6, 1, outputRows.length + 1, COL_COUNT);
      filterRange.createFilter();
    } catch (filterErr) {
      Logger.log('No se pudo crear filtro: ' + filterErr.message);
    }

    // ── 8. Proteger toda la Hoja3 ──
    try {
      const prot = hoja3.protect().setDescription('UA_HOJA3_DISTRIBUCION_PROTEGIDA');
      prot.setWarningOnly(true);
    } catch (protErr) {
      Logger.log('No se pudo proteger Hoja3: ' + protErr.message);
    }

    return {
      totalRows: validGuests.length,
      matched: countMatched,
      imported: importCount,
      updated: updateCount,
      noMatch: countNoMatch
    };

  } catch (err) {
    Logger.log('Error copiarInvitaciones_Silent_: ' + err.message);
    return { error: err.message };
  }
}

/**
 * Activa la sincronización automática de Hoja3 cada 10 minutos.
 * Ejecuta copiarInvitaciones_Silent_() periódicamente.
 */
function activarSyncInvitaciones() {
  const ui = SpreadsheetApp.getUi();

  // Borrar triggers previos de sync para evitar duplicados
  ScriptApp.getProjectTriggers().forEach(t =>  {
    if (t.getHandlerFunction() === 'copiarInvitaciones_Silent_') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('copiarInvitaciones_Silent_')
    .timeBased()
    .everyMinutes(10)
    .create();

  ui.alert(
    '⏱️ Sync Automático Activado',
    'La Hoja3 de la spreadsheet externa se sincronizará automáticamente cada 10 minutos.\n\n' +
    'Cuando los encargados agreguen invitados en Hoja1, aparecerán en Hoja3 con su link y mensaje en la próxima sincronización.\n\n' +
    'Para desactivar: menú 🍿 UA Eventos → "Desactivar Sync Automático".',
    ui.ButtonSet.OK
  );
}

/**
 * Desactiva la sincronización automática.
 */
function desactivarSyncInvitaciones() {
  const ui = SpreadsheetApp.getUi();
  let removed = 0;

  ScriptApp.getProjectTriggers().forEach(t =>  {
    if (t.getHandlerFunction() === 'copiarInvitaciones_Silent_') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });

  ui.alert(
    'Sync Desactivado',
    removed >  0
      ? `Se eliminó el sync automático (${removed} trigger${removed >  1 ? 's' : ''} removido${removed >  1 ? 's' : ''}).`
      : 'No había ningún sync automático activo.',
    ui.ButtonSet.OK
  );
}

/**
 * Formatea fecha "27/08/2026" → "Jueves 27 de Agosto"
 */
function formatDateText_(dateStr) {
  const match = String(dateStr || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return dateStr;
  const d = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
}

/**
 * Capitaliza cada palabra: "JUAN CARLOS" → "Juan Carlos"
 */
function capitalizeWords_(str) {
  return String(str).toLowerCase().replace(/\b\w/g, c =>  c.toUpperCase());
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
  const generated = generarCodigosFaltantes_Silent_();
  if (generated >  0) {
    try { generarReporteCine_Silent_(); } catch (_) {}
    try { copiarInvitaciones_Silent_(); } catch (_) {}
  }
  SpreadsheetApp.getUi().alert(`✅ Se generaron ${generated} código(s) UA-NNN para invitados sin código.`);
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
  const valid = effectiveEmail === senderEmail || aliases.map(String).map(v =>  v.toLowerCase()).includes(senderEmail);

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

  testGuests.forEach(guest =>  {
    const row = findGuestRow_(sheet, guest[0]);
    if (row >  0) {
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

  generarLinksInvitacion_Silent_();
  SpreadsheetApp.getUi().alert('✅ Se generaron los enlaces personalizados en la Columna J ("LinkInvitacion") de la pestaña Invitados.');
}

/**
 * Genera los links de invitación (Col J) sin mostrar alertas.
 * Usada internamente por actualizarTodo() y otros procesos automáticos.
 */
function generarLinksInvitacion_Silent_() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  sheet.getRange(1, 10).setValue('LinkInvitacion').setFontWeight('bold');

  const data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  const updates = [];
  const rowsToUpdate = [];

  data.forEach((row, i) =>  {
    const code = String(row[0] || '').trim();
    if (!code) return;
    const existingLink = String(row[9] || '').trim();
    const expectedLink = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
    if (existingLink !== expectedLink) {
      rowsToUpdate.push(i + 2); // fila del sheet
      updates.push([expectedLink]);
    }
  });

  // Solo escribir filas que realmente cambiaron (más eficiente)
  rowsToUpdate.forEach((sheetRow, i) =>  {
    sheet.getRange(sheetRow, 10).setValue(updates[i][0]);
  });

  if (rowsToUpdate.length >  0) {
    try { SpreadsheetApp.flush(); } catch (_) {}
  }
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
    .map((row, i) =>  ({ row, rowIndex: i + 2 }))
    .filter(({ row }) =>  {
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

  pendientes.forEach(({ row, rowIndex }, idx) =>  {
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

  // Derive day of week from date string (dd/mm/yyyy)
  const dayNames = ['Domingo','Lunes','Martes','Mi\u00e9rcoles','Jueves','Viernes','S\u00e1bado'];
  const dateParts = eventDate.split('/');
  const dateObj = dateParts.length === 3 ? new Date(dateParts[2], dateParts[1] - 1, dateParts[0]) : new Date();
  const dayOfWeek = dayNames[dateObj.getDay()] || 'Jueves';

  const firstName = firstName_(guestName);
  const subject   = `Universal Assistance te invita a la función exclusiva de Coyote vs. Acme`;

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
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu invitacion exclusiva para Coyote vs. Acme. Cupos limitados hasta agotar capacidad.</div>
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
              <!-- BANDERÍN DE URGENCIA CUPOS LIMITADOS -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e1b4b;border:2px solid #ee1f73;border-radius:12px;margin-bottom:20px;">
                <tr><td style="padding:14px;text-align:center;">
                  <div style="font-size:11px;font-weight:900;color:#ee1f73;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">&#9888; CUPOS LIMITADOS</div>
                  <div style="font-size:13px;font-weight:800;color:#ffffff;line-height:1.4;">
                    Confirmación requerida a la brevedad para asegurar tus entradas.
                  </div>
                </td></tr>
              </table>

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
                     <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">${dayOfWeek} ${escapeHtml_(eventDate)} · ${escapeHtml_(eventTime)} hs</div>
                    <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Recepción y Acreditación: ${escapeHtml_(arrivalTime)} hs</div>
                  </td>
                  <td class="col" width="50%" style="vertical-align:top;padding-left:8px;">
                    <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">LUGAR & POP</div>
                    <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">${escapeHtml_(venue)}</div>
                    <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">🍿 Pop & Bebida incluidos</div>
                    <div style="margin-top:2px;"><a href="${escapeHtml_(mapsUrl)}" style="color:#38bdf8;font-size:11px;font-weight:800;">Ver en Maps</a></div>
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

              <div style="font-size:11px;color:rgba(255,255,255,0.7);text-align:center;margin-top:14px;line-height:1.4;">
                ⚠️ <strong>Invitación personal e intransferible.</strong> Cupos estrictamente limitados hasta agotar capacidad.<br>
                Tu código de acceso: <strong style="color:#38bdf8;">${escapeHtml_(code)}</strong>
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
    <!-- TRACKING_PIXEL -->
    <img src="${APPS_SCRIPT_WEBAPP_URL}?action=trackOpen&i=${escapeHtml_(code)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
  </body>
</html>`;

  const plainText = [
    `Hola ${firstName},`,
    '',
    'Universal Assistance, a company of Zurich, te invita a una funcion exclusiva de cine.',
    '',
    'PELICULA: Coyote vs. Acme',
    '--------------------------------------',
    '',
    'DETALLES DEL EVENTO:',
    `  Fecha: ${eventDate}`,
    `  Hora: ${eventTime} hs`,
    `  Llegada sugerida: ${arrivalTime} hs`,
    `  Lugar: ${venue}`,
    `  Tu codigo personal: ${code}`,
    '',
    'CUPOS LIMITADOS',
    'Los lugares se asignan por orden de confirmacion.',
    'Por favor confirma tu asistencia a la brevedad para reservar tus entradas.',
    '',
    `Confirma tu asistencia aqui:`,
    invitationUrl,
    '',
    '--------------------------------------',
    'Universal Assistance Uruguay',
    'Asistencia al Viajero',
    `Tel: ${phone}`,
    `Email: ${replyTo}`,
    '',
    'Este correo fue enviado por Universal Assistance Uruguay.',
    'Si recibiste este email por error, por favor ignora este mensaje.'
  ].join('\n');

  sendEmailFromCorporateAccount_(email, subject, plainText, {
    name: 'Universal Assistance',
    replyTo,
    htmlBody
  });
}

/**
 * Limpia y sanitiza cualquier cadena de emails (soporta comas, punto y coma, espacios y saltos de línea).
 */
function cleanEmailRecipients_(raw) {
  if (!raw) return '';
  const str = String(raw);
  const matches = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches || matches.length === 0) return '';
  const cleaned = matches.map(e => e.trim().toLowerCase());
  return Array.from(new Set(cleaned)).join(',');
}

/**
 * Envía emails usando la cuenta de correo o alias de Universal Assistance.
 */
function sendEmailFromCorporateAccount_(email, subject, body, options) {
  const cleanRecipients = cleanEmailRecipients_(email);
  if (!cleanRecipients) throw new Error('No hay direcciones de email válidas.');

  const opt = options || {};
  opt.name = opt.name || 'Universal Assistance';
  opt.replyTo = opt.replyTo || SENDER_EMAIL;

  sendViaBrevo_(cleanRecipients, subject, body, opt);
}

/**
 * Envía email usando Brevo (ex Sendinblue) API como fallback cuando GmailApp está bloqueado.
 */
function sendViaBrevo_(recipient, subject, plainText, options) {
  Logger.log('🛑 Brevo desactivado por orden del usuario.');
  return { ok: false, error: 'Brevo desactivado' };
  var BREVO_API_KEY = 'BREVO_DISABLED_BY_USER';

  var toList = recipient.split(',').map(function(e) { return { email: e.trim() }; });

  var payload = {
    sender: { name: options.name || 'Universal Assistance', email: SENDER_EMAIL },
    to: toList,
    subject: subject,
    htmlContent: options.htmlBody || plainText,
    textContent: plainText,
    replyTo: { email: options.replyTo || SENDER_EMAIL }
  };

  var response = UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': BREVO_API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  if (code !== 201 && code !== 200) {
    var respBody = response.getContentText();
    throw new Error('Brevo error (' + code + '): ' + respBody.slice(0, 100));
  }
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
    .map((row, i) =>  ({ row, rowIndex: i + 2 }))
    .filter(({ row }) =>  {
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

  seleccionados.forEach(({ row, rowIndex }) =>  {
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

  // Derive day of week from date string (dd/mm/yyyy)
  const dayNames = ['Domingo','Lunes','Martes','Mi\u00e9rcoles','Jueves','Viernes','S\u00e1bado'];
  const dateParts = eventDate.split('/');
  const dateObj = dateParts.length === 3 ? new Date(dateParts[2], dateParts[1] - 1, dateParts[0]) : new Date();
  const dayOfWeek = dayNames[dateObj.getDay()] || 'Jueves';

  const firstName = firstName_(guestName);
  const subject   = `[DEMO] Universal Assistance te invita a la función exclusiva de Coyote vs. Acme`;

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
                     <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">${dayOfWeek} ${escapeHtml_(eventDate)} · ${escapeHtml_(eventTime)} hs</div>
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
    <!-- TRACKING_PIXEL -->
    <img src="${APPS_SCRIPT_WEBAPP_URL}?action=trackOpen&i=${escapeHtml_(code)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
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
 *       M=Canal N=Agencia/Convenio O=Referente UA P=FechaApertura
 */
/**
 * Función auxiliar inteligente para separar email embebido en el nombre,
 * remover comillas extrañas y auto-reparar registros.
 */
function cleanAndFixGuestRow_(name, email) {
  let cleanName = String(name || '').trim();
  let cleanEmail = String(email || '').trim();

  // Buscar dirección de correo embebida en el nombre
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const match = cleanName.match(emailRegex);

  if (match) {
    if (!cleanEmail) cleanEmail = match[1].toLowerCase();
    cleanName = cleanName.replace(emailRegex, '').replace(/[<>'"`(),;:\t]/g, '').trim();
  }

  // Si el nombre quedó vacío pero hay un correo (ej. "abritos@ua.com.uy")
  if (!cleanName && cleanEmail) {
    const prefix = cleanEmail.split('@')[0];
    cleanName = prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, l =>  l.toUpperCase());
  }

  // Quitar comillas sueltas o al final (ej. "Lucas Beathyate'")
  cleanName = cleanName.replace(/['"`]/g, '').trim();

  return { name: cleanName, email: cleanEmail };
}

/**
 * Devuelve la lista completa de invitados para el panel admin.
 * Auto-repara celdas con correos embebidos en la columna de nombre.
 * Auto-genera códigos UA-NNN para filas con nombre pero sin código (Columna A vacía).
 */
function adminGetGuestList() {
  const sheet   = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Asegurar que exista la Col Q (17) para la Etapa
  if (sheet.getMaxColumns() < 17) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 17 - sheet.getMaxColumns());
    sheet.getRange(1, 17).setValue('Etapa').setFontWeight('bold');
  }

  const range = sheet.getRange(2, 1, lastRow - 1, 17);
  const data = range.getDisplayValues();

  const result = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const code = String(r[0] || '').trim();
    if (!code && !String(r[1] || '').trim()) continue;

    const fixed = cleanAndFixGuestRow_(r[1], r[2]);
    let openedAtVal = r[15] || '';
    if (!openedAtVal && (r[4] === 'Confirmado' || r[4] === 'No asiste' || r[8])) {
      openedAtVal = r[8] ? `Abierto (${r[8]})` : 'Abierto (Registrado)';
    }

    let stageVal = String(r[16] || '').trim();
    const hasEmail = fixed.email && fixed.email.indexOf('@') >= 0 && fixed.email.toUpperCase() !== 'NO TENGO';
    if (!stageVal) {
      stageVal = hasEmail ? '1er Envío' : 'Envío Manual';
    } else if (!hasEmail && stageVal === '1er Envío') {
      stageVal = 'Envío Manual';
    }

    const compName = String(r[6] || '').trim();
    const hasComp = r[5] === 'Sí' || compName.length > 0;
    let computedSeats = Number(r[7] || 0);
    if (r[4] === 'Confirmado') {
      if (compName) {
        const cCount = compName.split('|').filter(x => x.trim().length > 0).length;
        computedSeats = Math.max(computedSeats, 1 + Math.max(1, cCount));
      } else if (hasComp) {
        computedSeats = Math.max(computedSeats, 2);
      } else {
        computedSeats = Math.max(computedSeats, 1);
      }
    } else {
      if (computedSeats === 0) computedSeats = hasComp ? 2 : 2;
    }

    let derivedStatus = String(r[4] || 'Pendiente').trim();
    if ((!derivedStatus || derivedStatus === 'Pendiente') && compName.length > 0) {
      derivedStatus = 'Confirmado';
    }

    result.push({
      code:           code,
      name:           fixed.name,
      email:          fixed.email,
      phone:          r[3],
      status:         derivedStatus,
      companion:      hasComp ? 'Sí' : (r[5] || 'No'),
      companionName:  r[6],
      totalSeats:     computedSeats,
      responseDate:   r[8],
      link:           r[9],
      mailStatus:     r[10] || '',
      demoCheck:      r[11],
      channel:        r[12] || '',
      agency:         r[13] || '',
      referent:       r[14] || '',
      openedAt:       openedAtVal,
      stage:          stageVal
    });
  }

  return result;
}

/**
 * Devuelve las estadísticas del dashboard.
 */
function adminGetStats() {
  const guests = adminGetGuestList();
  const total       = guests.length;
  const confirmed   = guests.filter(g =>  g.status === 'Confirmado').length;
  const notAttending= guests.filter(g =>  g.status === 'No asiste').length;
  const pending     = guests.filter(g =>  !g.status || g.status === 'Pendiente').length;
  // Solo contar como "enviado" si el estado contiene evidencia real de envío
  const sentKeywords = ['enviado', 'Enviado', 'ENVIADO', 'Sent', 'sent', 'Abierto', 'abierto', 'Entregado', 'entregado'];
  const withEmail   = guests.filter(g =>  {
    const ms = String(g.mailStatus || '').trim();
    if (!ms || ms === '' || ms.startsWith('Pendiente')) return false;
    return sentKeywords.some(kw =>  ms.indexOf(kw) >= 0);
  }).length;
  const noEmail     = total - withEmail;
  const totalSeats     = guests.reduce((s, g) => s + (Number(g.totalSeats) || 2), 0);
  const confirmedSeats = guests.filter(g => g.status === 'Confirmado').reduce((s, g) => s + (Number(g.totalSeats) || 2), 0);
  const responseRate   = total > 0 ? Math.round((confirmed + notAttending) / total * 100) : 0;

  return { total, confirmed, notAttending, pending, withEmail, noEmail, totalSeats, confirmedSeats, responseRate };
}

/**
 * Agrega un invitado individual. Extrae email de forma inteligente si vino pegado en el nombre.
 */
function adminAddGuest(name, email) {
  if (!name || !name.trim()) throw new Error('El nombre es obligatorio.');

  const fixed = cleanAndFixGuestRow_(name, email);
  name  = fixed.name;
  email = fixed.email;

  const sheet   = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  const existingCodes = lastRow >= 2
    ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(Boolean)
    : [];

  let maxNum = 0;
  existingCodes.forEach(c =>  {
    const m = String(c).match(/UA-(\d+)/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  const code = 'UA-' + String(maxNum + 1).padStart(3, '0');
  const link = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

  sheet.appendRow([code, name, email, '', 'Pendiente', '', '', 2, '', link, 'Pendiente de envío', '0', '', '', '', '']);

  try {
    generarReporteCine_Silent_();
  } catch (_) {}

  return { ok: true, code, link };
}

/**
 * Importación masiva de invitados desde el panel con parsing inteligente y prevención de duplicados.
 * guests: array de objetos {name, email, phone, channel, agency, seats, referent}
 */
function adminImportGuests(guests) {
  if (!Array.isArray(guests) || guests.length === 0) throw new Error('Lista vacía.');

  const sheet   = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();

  // Obtener datos existentes en la planilla para detectar duplicados
  const existingNames = new Set();
  let maxNum = 0;

  if (lastRow >= 2) {
    const existingValues = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    existingValues.forEach(r =>  {
      const code = String(r[0] || '').trim();
      const name = String(r[1] || '').trim().toLowerCase();
      const agency = String(r[13] || '').trim().toLowerCase();

      if (code) {
        const m = code.match(/UA-(\d+)/i);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
      }

      if (name) {
        existingNames.add(`${name}___${agency}`);
      }
    });
  }

  const rows = [];
  const duplicatesList = [];
  const seenInCurrentFile = new Set();

  guests.forEach(g =>  {
    const fixed = cleanAndFixGuestRow_(g.name, g.email);
    let fullName = fixed.name;
    let email = fixed.email;

    if (!fullName && !email) return;

    const channel = String(g.channel || '').trim();
    const agency = String(g.agency || '').trim();
    const referent = String(g.referent || '').trim();

    if (fullName.toUpperCase() === 'EXTRA' || fullName.toUpperCase() === 'CUPO') {
      fullName = `Cupo ${agency || channel || 'UA'}`;
    }

    const normKey = `${fullName.toLowerCase()}___${agency.toLowerCase()}`;
    const isCupo = fullName.toLowerCase().startsWith('cupo');

    if (!isCupo) {
      if (seenInCurrentFile.has(normKey) || existingNames.has(normKey)) {
        duplicatesList.push(fullName + (agency ? ` (${agency})` : ''));
        return; // Omitir duplicado
      }
    }

    seenInCurrentFile.add(normKey);
    maxNum++;
    const code = 'UA-' + String(maxNum).padStart(3, '0');
    const link = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
    const seats = parseInt(g.seats, 10) || 2;

    rows.push([
      code,                        // A: Código
      fullName,                    // B: Nombre Completo
      email,                       // C: Email
      String(g.phone || '').trim(),// D: Teléfono
      'Pendiente',                 // E: Estado
      'No',                        // F: Acompañante
      '',                          // G: Nombre Acompañante
      seats,                       // H: Total Lugares
      '',                          // I: Fecha Respuesta
      link,                        // J: Link Invitación
      'Pendiente de envío',        // K: Estado Email
      '0',                         // L: DEMO
      channel,                     // M: Canal
      agency,                      // N: Agencia / Convenio
      referent,                    // O: Referente UA
      ''                           // P: Fecha Apertura
    ]);
  });

  if (rows.length === 0 && duplicatesList.length >  0) {
    throw new Error(`Se detectó que los ${duplicatesList.length} invitados ya existen en la base de datos.`);
  }

  if (rows.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, 16).setValues(rows);
    try {
      generarReporteCine_Silent_();
    } catch (_) {}
  }

  return {
    ok: true,
    added: rows.length,
    skipped: duplicatesList.length,
    duplicatesList: duplicatesList.slice(0, 8)
  };
}

/**
 * Elimina un invitado por código de forma ultra-rápida en memoria.
 */
function adminDeleteGuest(code) {
  return adminDeleteGuests([code]);
}

/**
 * Elimina múltiples invitados por sus códigos de forma ultra-rápida (en lote).
 * Filtra los datos en memoria y reescribe en 1 sola llamada, evitando el lag de deleteRow fila por fila.
 */
function adminDeleteGuests(codes) {
  if (!codes || !codes.length) return { ok: true, deleted: 0 };
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, deleted: 0 };

  const numCols = Math.max(sheet.getLastColumn(), 17);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const targetCodes = new Set(codes.map(c => String(c || '').trim().toLowerCase()).filter(Boolean));

  const keptRows = [];
  let deletedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const rowCode = String(data[i][0] || '').trim().toLowerCase();
    if (rowCode && targetCodes.has(rowCode)) {
      deletedCount++;
    } else {
      keptRows.push(data[i]);
    }
  }

  if (deletedCount > 0) {
    sheet.getRange(2, 1, lastRow - 1, numCols).clearContent();
    if (keptRows.length > 0) {
      sheet.getRange(2, 1, keptRows.length, numCols).setValues(keptRows);
    }
    // Eliminar filas sobrantes si es necesario
    if (lastRow > keptRows.length + 1) {
      const excess = lastRow - (keptRows.length + 1);
      sheet.deleteRows(keptRows.length + 2, excess);
    }
  }

  invalidarCacheCompleto_();
  try { generarReporteCine_Silent_(); } catch (_) {}
  return { ok: true, deleted: deletedCount };
}

/**
 * Actualiza los datos de un invitado existente en la planilla.
 * guestData: { code, name, email, phone, stage, channel, agency, referent, totalSeats, status, companion, companionName }
 */
function adminUpdateGuest(data) {
  if (!data || !data.code) throw new Error('Código de invitado requerido.');
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('No hay invitados registrados.');

  const numCols = Math.max(sheet.getLastColumn(), 17);
  const values = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const cleanTargetCode = String(data.code || '').trim().toLowerCase();

  let foundIndex = -1;
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === cleanTargetCode) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    const newRow = [
      data.code,
      String(data.name || 'Extra Vendedor').trim(),
      String(data.email || '').trim(),
      String(data.phone || '').trim(),
      String(data.status || 'Pendiente').trim(),
      (data.companion === 'Sí' || data.companion === true || data.companion === 'yes') ? 'Sí' : 'No',
      String(data.companionName || '').trim(),
      Number(data.totalSeats) || 2,
      '',
      `${LANDING_URL}?i=${encodeURIComponent(data.code)}`,
      'Pendiente de envío',
      '0',
      String(data.channel || 'AGENCIA').trim(),
      String(data.agency || '').trim(),
      String(data.referent || 'UA').trim(),
      String(data.stage || '1er Envío').trim(),
      ''
    ];
    sheet.appendRow(newRow);
    invalidarCacheCompleto_();
    try { generarReporteCine_Silent_(); } catch (_) {}
    return { ok: true, guest: data, created: true };
  }

  const row = values[foundIndex];
  if (data.name !== undefined && data.name !== '') row[1] = String(data.name).trim();
  if (data.email !== undefined) row[2] = String(data.email || '').trim();
  if (data.phone !== undefined) row[3] = String(data.phone || '').trim();
  if (data.status !== undefined && data.status !== '') row[4] = String(data.status).trim();
  if (data.companion !== undefined) row[5] = (data.companion === 'Sí' || data.companion === true || data.companion === 'yes') ? 'Sí' : 'No';
  if (data.companionName !== undefined) row[6] = String(data.companionName || '').trim();
  if (data.totalSeats !== undefined && data.totalSeats !== '') row[7] = Number(data.totalSeats) || 2;
  if (data.channel !== undefined) row[12] = String(data.channel || '').trim();
  if (data.agency !== undefined) row[13] = String(data.agency || '').trim();
  if (data.referent !== undefined) row[14] = String(data.referent || '').trim();
  if (data.stage !== undefined) row[15] = String(data.stage || '1er Envío').trim();

  // Guardar la fila actualizada en una sola llamada
  sheet.getRange(foundIndex + 2, 1, 1, numCols).setValues([row]);

  invalidarCacheCompleto_();
  try { generarReporteCine_Silent_(); } catch (_) {}
  return { ok: true, guest: data, message: `Invitado ${data.code} actualizado correctamente.` };
}

/**
 * Limpia filas duplicadas o vacías del Sheet "Invitados" preservando la primera ocurrencia de cada código.
 */
function adminCleanDuplicates() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, deleted: 0 };

  const numCols = Math.max(sheet.getLastColumn(), 17);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const seenCodes = new Set();
  const cleanData = [];

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const code = String(r[0] || '').trim();
    const name = String(r[1] || '').trim();

    if (!code && !name) continue;

    if (code && seenCodes.has(code)) {
      continue; // Omitir copia duplicada
    }

    if (code) seenCodes.add(code);
    cleanData.push(r);
  }

  const deletedCount = data.length - cleanData.length;
  if (deletedCount > 0) {
    sheet.getRange(2, 1, lastRow - 1, numCols).clearContent();
    sheet.getRange(2, 1, cleanData.length, numCols).setValues(cleanData);
  }

  invalidarCacheCompleto_();
  try { generarReporteCine_Silent_(); } catch (_) {}

  return { ok: true, deleted: deletedCount, remaining: cleanData.length };
}

/**
 * Pasa todos los invitados en estado Pendiente a Expirado de manera atómica y directa en Google Sheets.
 */
function expirarTodosLosPendientes_() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, count: 0 };

  const numCols = Math.max(sheet.getLastColumn(), 17);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  let count = 0;

  for (let i = 0; i < data.length; i++) {
    const status = String(data[i][4] || '').trim();
    if (status === 'Pendiente' || !status) {
      data[i][4] = 'Expirado';
      count++;
    }
  }

  if (count > 0) {
    sheet.getRange(2, 1, data.length, numCols).setValues(data);
  }

  invalidarCacheCompleto_();
  try { generarReporteCine_Silent_(); } catch (_) {}

  return { ok: true, expiredCount: count, total: data.length };
}

/**
 * Restaura los 16 invitados VIP/especiales a estado Confirmado sin enviar ningún correo.
 */
function restaurarVIPsConfirmados_() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, count: 0 };

  const numCols = Math.max(sheet.getLastColumn(), 17);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

  const VIP_MATCHES = [
    { code: 'UA-C40101A1', name: 'Mariano Mosca', seats: 4 },
    { code: 'UA-C40404D4', name: 'J. Olivera', seats: 5 },
    { code: 'UA-C40202B2', name: 'W. Helou', seats: 2 },
    { code: 'UA-C40303C3', name: 'B. Perdomo', seats: 2 },
    { code: 'UA-AFE5BD48', name: 'Gimena Rodriguez', seats: 4 },
    { code: 'UA-6A820E9B', name: 'Gustavo Amoroso', seats: 3 },
    { code: 'UA-805814BB', name: 'Sandra Yuane', seats: 3 },
    { code: 'UA-98620481', name: 'Rodrigo Pinto', seats: 3 },
    { code: 'UA-96126527', name: 'Tiffany Herrera', seats: 2 },
    { code: 'UA-0FB47E1B', name: 'Ignacio Vidal', seats: 2 },
    { code: 'UA-C9E7B342', name: 'Belén Arbiza', seats: 2 },
    { code: 'UA-7BA7B4C8', name: 'Carmen Galan', seats: 2 },
    { code: 'UA-2E904FBD', name: 'Emiliano Arevalo', seats: 2 },
    { code: 'UA-E2D839E8-C', name: 'Enrique Haladjian', seats: 2 },
    { code: 'UA-12B86D7F-MJ', name: 'Maria Jose', seats: 2 },
    { code: 'UA-98620610', name: 'Orlandys Suarez', seats: 2 }
  ];

  let restored = 0;
  for (let i = 0; i < data.length; i++) {
    const rowCode = String(data[i][0] || '').trim();
    const rowName = String(data[i][1] || '').trim().toLowerCase();

    const match = VIP_MATCHES.find(v => v.code === rowCode || (v.name && rowName.includes(v.name.toLowerCase())));
    if (match) {
      data[i][4] = 'Confirmado';
      data[i][5] = match.seats > 1 ? 'Sí' : 'No';
      if (match.seats > Number(data[i][7] || 0)) {
        data[i][7] = match.seats;
      }
      restored++;
    }
  }

  if (restored > 0) {
    sheet.getRange(2, 1, data.length, numCols).setValues(data);
  }

  invalidarCacheCompleto_();
  try { generarReporteCine_Silent_(); } catch (_) {}

  return { ok: true, restoredCount: restored };
}



/**
 * Envía un correo de aclaración / disculpas directo a la casilla de la agencia seleccionada.
 */
function adminSendClarificationEmail(targetKey, customMsg) {
  const map = {
    angela:   { email: 'ahoffmann@asesp.com.uy', name: 'Angela Hoffmann' },
    paola:    { email: 'paola.pradie@semm.com.uy', name: 'Paola Pradie' },
    nadia:    { email: 'ca72787@casmu.com', name: 'Nadia Núñez' },
    agustina: { email: 'agustina.magnani@traveloz.com.uy', name: 'Agustina Magnani' },
    elisa:    { email: 'elisa.costa@cosem.com.uy', name: 'Elisa Costa' },
    laura:    { email: 'laura.caprio@semm.com.uy', name: 'Laura Caprio' },
    karen:    { email: 'servicioscomplementarios@hospitalevangelico.com', name: 'Karen Ramillo / Myriam Cardozo' },
    lucas_test: { email: 'lucasbeathyate@gmail.com', name: 'Lucas Beathyate (PRUEBA)' }
  };

  const target = map[targetKey];
  if (!target) throw new Error('Contacto no válido.');

  const subject = `Aclaración importante sobre tu invitación · Universal Assistance`;
  const textMsg = customMsg || `Hola ${target.name},\n\nTe escribimos de parte de Universal Assistance para aclararte el envío de las invitaciones...`;

  const htmlBody = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>@media only screen and (max-width:600px){.card{width:100%!important;border-radius:16px!important;}.pad{padding:20px 16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Aclaración importante sobre tus invitaciones a la función exclusiva de Coyote vs. Acme.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">
<tr><td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
  <div style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:0.5px;">UNIVERSAL ASSISTANCE</div>
  <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td class="pad" style="padding:28px 24px;background-color:#0b2149;">
  <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">FUNCIÓN EXCLUSIVA · MOVIE MONTEVIDEO SHOPPING</div>
  <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:24px;font-weight:900;line-height:1.2;text-transform:uppercase;">COYOTE VS ACME</h1>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:20px;">
  <tr><td style="padding:16px;">
    <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">COMUNICADO OFICIAL</div>
    <div style="font-size:15px;font-weight:800;color:#ffffff;">Aclaración sobre tus invitaciones</div>
  </td></tr></table>

  <div style="font-size:14px;color:#e2e8f0;line-height:1.65;margin-bottom:20px;white-space:pre-wrap;">${escapeHtml_(textMsg)}</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;border:1px solid rgba(56,189,248,0.3);border-radius:12px;">
  <tr><td style="padding:14px 16px;text-align:center;">
    <div style="font-size:11px;font-weight:800;color:#38bdf8;">DETALLES DEL EVENTO</div>
    <div style="font-size:13px;color:#ffffff;font-weight:700;margin-top:4px;">Jueves 27 de Agosto · 20:00 hs (Llegada: 19:30 hs)</div>
    <div style="font-size:12px;color:#cbd5e1;margin-top:2px;">Movie Montevideo Shopping</div>
  </td></tr></table>
</td></tr>
<tr><td style="padding:18px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
  <div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
  <div style="font-size:11px;color:#38bdf8;margin-top:4px;font-weight:700;">
    Tel: 2901 7378 &nbsp;|&nbsp; <a href="mailto:lucasb@ua.com.uy" style="color:#ffffff;text-decoration:underline;">lucasb@ua.com.uy</a>
  </div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  sendViaBrevo_(target.email, subject, textMsg, {
    name: 'Universal Assistance',
    replyTo: SENDER_EMAIL,
    htmlBody: htmlBody
  });

  return { ok: true, email: target.email, name: target.name };
}

/**
 * Reenvía el mail de confirmación a un invitado por código.
 * Útil cuando el envío original falló (ej: error Brevo).
 */
function adminResendConfirmationEmail(code) {
  if (!code) throw new Error('Código de invitado requerido.');

  const sheet = getSheet_(SHEET_INVITADOS);
  const row = findGuestRow_(sheet, code);
  if (!row) throw new Error('Invitado no encontrado: ' + code);

  const values = sheet.getRange(row, 1, 1, 11).getValues()[0];
  const guestName = values[1] || 'Invitado VIP';
  const email = values[2];
  const status = values[4];
  const companionName = values[6] || '';
  const totalSeats = Number(values[7]) || 1;

  if (!email) throw new Error('El invitado no tiene email registrado.');
  if (status !== 'Confirmado') throw new Error('El invitado no está confirmado (estado: ' + status + ').');

  sendConfirmationEmail_(email, guestName, totalSeats, companionName, code);

  // Actualizar mailStatus en columna K (11) para quitar el error
  const nowStr = Utilities.formatDate(new Date(), 'GMT-03:00', 'dd/MM HH:mm');
  sheet.getRange(row, 11).setValue('Reenviado (' + nowStr + ' hs)');

  return { ok: true, email: email, name: guestName, code: code };
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
  rows.forEach((row, i) =>  {
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

  codes.forEach(code =>  {
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
 * Registra la apertura de un correo electrónico o la visita al link personalizado.
 */
function recordEmailOpen_(code) {
  if (!code) return;
  try {
    const sheet = getSheet_(SHEET_INVITADOS);
    const row = findGuestRow_(sheet, code);
    if (!row) return;

    const currentStatus = String(sheet.getRange(row, 11).getValue() || '');

    // Solo actualizar si no fue marcado ya como Abierto
    if (currentStatus.indexOf('Abierto') === -1) {
      const nowStr = Utilities.formatDate(new Date(), 'GMT-03:00', 'dd/MM HH:mm');
      sheet.getRange(row, 11).setValue(`Enviado (Abierto ${nowStr} hs)`);
    }
  } catch (err) {
    console.error('Error al registrar apertura de email:', err);
  }
}

/**
 * Busca la fila de un invitado en la pestaña Invitados por su código UA-NNN (1-indexed).
 */
function findGuestRow_(sheet, code) {
  if (!code) return 0;
  const targetCode = String(code).toUpperCase().trim();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  for (let i = 0; i < codes.length; i++) {
    if (String(codes[i] || '').toUpperCase().trim() === targetCode) {
      return i + 2;
    }
  }
  return 0;
}

/**
 * Envía emails de invitación REAL a los códigos indicados con estado OK o Error.
 * codes: array de strings con los códigos UA-NNN
 */
function adminSendProductionEmails(codes) {
  try {
  if (!Array.isArray(codes) || codes.length === 0) return { ok: false, sent: 0, errors: ['Sin destinatarios.'] };

  // ── GUARDIÁN DE CUOTA ──
  // MailApp.getRemainingDailyQuota() puede retornar -1 cuando se usa GmailApp.
  // Si retorna 0, la cuota está agotada. Si retorna -1, no podemos saberlo y dejamos pasar.
  var quotaRemaining = -1;
  try { quotaRemaining = MailApp.getRemainingDailyQuota(); } catch (_) {}
  if (quotaRemaining === 0) {
    return {
      ok: false,
      sent: 0,
      quotaExhausted: true,
      errors: ['Cuota diaria de Google agotada. Los envíos se reanudarán automáticamente cuando Google renueve la cuota (aprox. 24hs). Ningún mail fue marcado como error.'],
      quota: 0
    };
  }

  const sheet = getSheet_(SHEET_INVITADOS);
  const sent = [];
  const errors = [];
  const skipped = [];
  const processedEmails = new Set();
  const nowStr = Utilities.formatDate(new Date(), 'GMT-03:00', 'dd/MM HH:mm');

  codes.forEach((code, i) =>  {
    const row = findGuestRow_(sheet, code);
    if (!row) { errors.push(`${code}: no encontrado`); return; }
    const values = sheet.getRange(row, 1, 1, 12).getValues()[0];
    const rawEmail = values[2];
    const cleanEmail = cleanEmailRecipients_(rawEmail);
    const name   = values[1];
    const status = String(values[10] || '').trim();

    // ── FILTRO DE EMAIL INVÁLIDO ──
    // Omitir silenciosamente filas sin email válido (NO TENGO, vacío, sin @)
    if (!cleanEmail || !cleanEmail.includes('@')) {
      skipped.push(`${code}: sin email válido`);
      return;
    }

    // ── DEDUPLICACIÓN DE CORREO POR LOTE Y CANDADO DE 24 HORAS (CacheService) ──
    const cache = CacheService.getScriptCache();
    const emailLockKey = 'SENT_LOCK_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    
    if (processedEmails.has(cleanEmail) || cache.get(emailLockKey)) {
      skipped.push(`${code}: email ya enviado recientemente a esta casilla (${cleanEmail})`);
      return;
    }

    // PROTECCIÓN DE SEGURIDAD POR FILA:
    // Si esta fila/código ya fue marcada como "Enviado", "Abierto", o "Omitido", omitir inmediatamente
    if (status.indexOf('Enviado') >= 0 || status.indexOf('enviad') >= 0 || status.indexOf('Abierto') >= 0 || status.indexOf('Omitido') >= 0) {
      skipped.push(`${code}: ya enviado o procesado previamente`);
      return;
    }

    // ── CANDADO GLOBAL EN TODA LA PLANILLA PARA EL MISMO EMAIL ──
    // Si la casilla ya recibió un mail en CUALQUIER otra fila de la planilla, omitir para no repetir
    const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
    const alreadySentToEmail = allData.some(r => {
      const otherEmail = cleanEmailRecipients_(r[2]);
      const otherStatus = String(r[10] || '').trim();
      return otherEmail === cleanEmail && (otherStatus.indexOf('Enviado') >= 0 || otherStatus.indexOf('Abierto') >= 0);
    });

    if (alreadySentToEmail) {
      sheet.getRange(row, 11).setValue(`Omitido (mail ya enviado a ${cleanEmail})`);
      skipped.push(`${code}: casilla ${cleanEmail} ya recibió invitacion en otra fila`);
      return;
    }

    processedEmails.add(cleanEmail);
    try { cache.put(emailLockKey, '1', 86400); } catch (_) {} // Candado de 24 horas por email

    // ── RE-VERIFICAR CUOTA ANTES DE CADA ENVÍO ──
    var currentQuota = -1;
    try { currentQuota = MailApp.getRemainingDailyQuota(); } catch (_) {}
    if (currentQuota === 0) {
      errors.push(`${code}: cuota agotada durante el envío`);
      return;
    }

    try {
      sendInvitationEmail_(rawEmail, name, code);
      sheet.getRange(row, 11).setValue(`Enviado (${nowStr} hs)`);
      sent.push(code);
    } catch (err) {
      const errMsg = err.message || String(err);
      // Si el error es de cuota/rate limit, NO escribir error en la planilla
      if (errMsg.indexOf('demasiadas veces') >= 0 || errMsg.indexOf('Limit') >= 0 || errMsg.indexOf('quota') >= 0) {
        errors.push(`${code}: cuota agotada - ${errMsg}`);
      } else {
        sheet.getRange(row, 11).setValue(`Error al enviar: ${errMsg.slice(0, 40)}`);
        errors.push(`${code}: ${errMsg}`);
      }
    }

    if (i < codes.length - 1) Utilities.sleep(2500);
  });

  invalidarCacheCompleto_();
  return { ok: true, sent: sent.length, skipped: skipped.length, skippedDetails: skipped, errors, quota: quotaRemaining };

  } catch (fatalErr) {
    // CATCH GLOBAL: capturar cualquier error no previsto y retornarlo como dato
    return {
      ok: false,
      sent: 0,
      errors: ['ERROR FATAL DEL SERVIDOR: ' + (fatalErr.message || String(fatalErr))],
      fatalError: fatalErr.message || String(fatalErr),
      stack: fatalErr.stack || ''
    };
  }
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
  const links = codes.map(row =>  {
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

  const timeNowStr = Utilities.formatDate(new Date(), 'GMT-03:00', 'dd/MM HH:mm');
  const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  const sent = [], errors = [];

  data.forEach((r, idx) =>  {
    const rowCode = String(r[0] || '').trim();
    if (codes && codes.length >  0 && !codes.includes(rowCode)) return;

    const status = String(r[4] || '').toLowerCase().trim();
    const email  = String(r[2] || '').trim();

    if (!email) {
      if (codes && codes.includes(rowCode)) {
        sheet.getRange(idx + 2, 11).setValue('Error: Sin email cargado');
      }
      return;
    }

    if (!status.includes('confirmad')) return;

    const companionVal = String(r[5] || '').toLowerCase().trim() === 'sí' || String(r[5] || '').toLowerCase().trim() === 'si';
    const seats = Number(r[7]) || (companionVal ? 2 : 1);
    const name  = r[1];
    const companionName = r[6] || '';

    try {
      sendReminderEmail_(email, name, seats, companionName, rowCode);
      sheet.getRange(idx + 2, 11).setValue(`Enviado (Recordatorio ${timeNowStr} hs)`);
      sent.push(rowCode);
    } catch (err) {
      const errMsg = err.message || String(err);
      sheet.getRange(idx + 2, 11).setValue(`Error: ${errMsg.slice(0, 40)}`);
      errors.push(`${rowCode}: ${errMsg}`);
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
  const existing = new Set(values.map(r =>  String(r[0] || '').trim()).filter(Boolean));

  // Determinar el máximo numérico existente
  let maxNum = 0;
  existing.forEach(c =>  {
    const m = String(c).match(/UA-(\d+)/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });

  let generated = 0;
  values.forEach(row =>  {
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
  const valid = effectiveEmail === senderEmail || aliases.map(String).map(v =>  v.toLowerCase()).includes(senderEmail);
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
  const adminGuests = adminGetGuestList();
  const sheetInv = getSheet_(SHEET_INVITADOS);
  const lastRowInv = sheetInv.getLastRow();
  
  let checkinMap = new Map();
  if (lastRowInv >= 2) {
    const dataInv = sheetInv.getRange(2, 1, lastRowInv - 1, 12).getDisplayValues();
    dataInv.forEach(r => {
      const code = String(r[0] || '').trim().toLowerCase();
      const checkinCol = String(r[11] || '').trim();
      if (code && checkinCol.startsWith('Ingresó')) {
        let checkinTimeStr = '';
        if (checkinCol.includes('(')) {
          const m = checkinCol.match(/\(([^)]+)\)/);
          if (m) checkinTimeStr = m[1];
        }
        checkinMap.set(code, { checkedIn: true, checkinTime: checkinTimeStr });
      }
    });
  }

  const guests = adminGuests.map(g => {
    const codeKey = (g.code || '').toLowerCase().trim();
    const cInfo = checkinMap.get(codeKey) || { checkedIn: false, checkinTime: '' };
    return {
      code: g.code,
      name: g.name,
      status: g.status,
      seats: Number(g.totalSeats || 1),
      companionName: g.companionName || '',
      agency: g.agency || '',
      checkedIn: cInfo.checkedIn,
      checkinTime: cInfo.checkinTime
    };
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

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000); // Bloqueo seguro para soportar múltiples operadores en simultáneo
  } catch (_) {}

  try {
    // 1. Actualizar pestaña Invitados (base de datos principal)
    const sheetInv = getSheet_(SHEET_INVITADOS);
    const row = findGuestRow_(sheetInv, cleanCode);
    if (row) {
      const currentStatus = clean_(sheetInv.getRange(row, 5).getValue());
      if (!currentStatus || currentStatus === 'Pendiente') {
        sheetInv.getRange(row, 5).setValue('Confirmado');
      }
      sheetInv.getRange(row, 12).setValue(`Ingresó (${nowTime})`);
    }

    // 2. Invalidad caché individual para reflejo instantáneo
    try {
      CacheService.getScriptCache().remove('GUEST_V2_' + cleanCode);
    } catch (_) {}

    SpreadsheetApp.flush(); // Forzar guardado inmediato en Google Sheets
  } catch (e) {
    Logger.log('Error al actualizar Invitados: ' + e);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }

  return { ok: true, code: cleanCode, time: nowTime };
}

/**
 * Deshace el ingreso a sala de un invitado.
 */
function undoIngress_(code) {
  if (!code) throw new Error('Código no especificado');
  const cleanCode = code.toUpperCase().trim();
  const sheetInv = getSheet_(SHEET_INVITADOS);
  const row = findGuestRow_(sheetInv, cleanCode);
  if (row) {
    sheetInv.getRange(row, 12).setValue('');
    SpreadsheetApp.flush();
  }
  return { ok: true, code: cleanCode, undo: true };
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


// ═══════════════════════════════════════════════════════════════════════
// HERRAMIENTA DE ADMINISTRACIÓN: Borrar todos los datos (mantiene headers)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Borra TODAS las filas de datos de la hoja Invitados manteniendo
 * únicamente la fila de encabezados (fila 1).
 *
 * ⚠️ ACCIÓN IRREVERSIBLE — ejecutar solo cuando se quiera empezar de cero.
 *
 * Cómo ejecutar:
 *   Apps Script editor → selector de función → "clearAllData" → ▶ Run
 */
function clearAllData() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_INVITADOS);

  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ No se encontró la hoja "' + SHEET_INVITADOS + '"');
    return;
  }

  const totalRows = sheet.getLastRow();

  if (totalRows <= 1) {
    SpreadsheetApp.getUi().alert('ℹ️ La hoja ya está vacía (solo tiene headers). Nada que borrar.');
    return;
  }

  const dataRows = totalRows - 1;

  const ui   = SpreadsheetApp.getUi();
  const resp = ui.alert(
    '⚠️ CONFIRMACIÓN FINAL',
    'Se van a borrar ' + dataRows + ' fila(s) de la hoja "' + SHEET_INVITADOS + '".\n\n' +
    'ESTA ACCIÓN ES IRREVERSIBLE. ¿Confirmás?',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) {
    ui.alert('Operación cancelada. No se borró nada.');
    return;
  }

  sheet.deleteRows(2, dataRows);

  const reportSheet = ss.getSheetByName('Reporte Cine Movie');
  if (reportSheet && reportSheet.getLastRow() >  1) {
    reportSheet.deleteRows(2, reportSheet.getLastRow() - 1);
  }

  ui.alert(
    '✅ Listo',
    'Se borraron ' + dataRows + ' fila(s).\n\n' +
    'La hoja quedó limpia con solo los headers.\n' +
    'Podés cargar los invitados reales.',
    ui.ButtonSet.OK
  );

  Logger.log('clearAllData: ' + dataRows + ' filas borradas — ' + new Date().toISOString());
}


// ═══════════════════════════════════════════════════════════════════════
// IMPORTACIÓN OFICIAL DE INVITADOS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Importa la lista oficial de 126 invitados con Canal, Agencia/Convenio y Referente UA.
 * Ejecutar desde el editor de Apps Script ->  importOfficialList ->  ▶ Ejecutar
 */
function importOfficialList() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_INVITADOS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_INVITADOS);
  }

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

  // Limpiar contenido previo
  sheet.clearContents();

  // Escribir y dar formato a los encabezados
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  try {
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#071938')
      .setFontColor('#ffffff');
  } catch (_) {}

  const rawList = [
    ["MARIANNA", "TOMASI", "FUNCIONARIO SURVIEW", "OFICINA", 2, "AM/MT"],
    ["LAURA", "CAPRIO", "SALUD", "SEMM", 2, "AM/MT"],
    ["ANDRES", "RODRIGUEZ", "SALUD", "SEMM", 2, "AM/MT"],
    ["DIEGO", "DE CARLINI", "SALUD", "SEMM", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "SEMM", 2, "AM/MT"],
    ["KARINA", "MACADAR", "SALUD", "SEMM", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "SEMM", 2, "AM/MT"],
    ["PAOLA", "PRADIE", "SALUD", "SEMM CALL", 3, "AM/MT"],
    ["ANDRES", "VOELKER", "SALUD", "SEMM", 2, "AM/MT"],
    ["JUAN", "BORRELI", "SALUD", "SEMM", 3, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "SEMM CALL", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "SEMM CALL", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "SEMM CALL", 2, "AM/MT"],
    ["NESTOR", "CONDE", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["ANGELA", "HOFFMAN", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["MONICA", "NAUMIS", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["LUCY", "HERNANDEZ", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["ALBERTO", "YAFFE", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "ASOC ESPAÑOLA", 2, "AM/MT"],
    ["KAREN", "RAMILLO", "SALUD", "EVANGELICO", 2, "AM/MT"],
    ["MYRIAM", "CARDOZO", "SALUD", "EVANGELICO", 2, "AM/MT"],
    ["JORGE", "MUÑOZ", "SALUD", "EVANGELICO", 2, "AM/MT"],
    ["IGNACIO", "BARBOT", "SALUD", "EVANGELICO", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "EVANGELICO", 2, "AM/MT"],
    ["SANTIAGO", "DE LUCA", "SALUD", "CASMU", 2, "AM/MT"],
    ["NADIA", "NUÑEZ", "SALUD", "CASMU", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "CASMU", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "CASMU", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "CASMU", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "CASMU", 2, "AM/MT"],
    ["ANA", "LOPEZ", "SALUD", "SUMMUM", 2, "AM/MT"],
    ["NATALIA", "LABAT", "SALUD", "SUMMUM", 2, "AM/MT"],
    ["MARIANA", "FIRPO", "SALUD", "SUMMUM", 2, "AM/MT"],
    ["ALEJANDRA", "SAAVEDRA", "CORREDOR DE SEGUROS", "SAAVEDRA SEGUROS", 2, "MT"],
    ["DELIA", "VILARO", "CORREDOR DE SEGUROS", "DVS SEGUROS", 2, "MT"],
    ["ELISA", "COSTA", "SALUD", "COSEM", 2, "AM/MT"],
    ["SANTIAGO", "FLEITAS", "SALUD", "COSEM", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "COSEM", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "COSEM", 2, "AM/MT"],
    ["EXTRA", "VENDEDOR", "SALUD", "COSEM", 2, "AM/MT"],
    ["JOAQUIN", "BARRETO", "SALUD", "AMSJ", 2, "AM/MT"],
    ["GUSTAVO", "AMORIN", "SALUD", "ASISTENCIAL MEDICA", 2, "AM/MT"],
    ["JOAQUIN", "GUILLEN", "SALUD", "ASISTENCIAL MEDICA", 2, "AM/MT"],
    ["GUSTAVO", "BURGHI", "SALUD", "ASISTENCIAL MEDICA", 2, "AM/MT"],
    ["SILVINA", "TORTORELLA", "SALUD", "ASISTENCIAL MEDICA", 2, "AM/MT"],
    ["FERNANDO", "BERVEJILLO", "CORREDOR DE SEGUROS", "", 2, "MT"],
    ["LAURA", "FERNANDEZ", "SALUD", "SEGURO AMERICANO", 2, "AM/MT"],
    ["FACUNDO", "QUIROZ", "SALUD", "SEGURO AMERICANO", 2, "AM/MT"],
    ["FERNANDA", "CABRERA", "SALUD", "SEGURO AMERICANO", 2, "AM/MT"],
    ["EXTRA", "DIRECTIVA", "SALUD", "SEGURO AMERICANO", 2, "AM/MT"],
    ["LAURA", "SUAREZ", "CORREDOR DE SEGUROS", "RISSO SEGUROS", 2, "MT"],
    ["JORGE", "JEREZ", "SALUD", "MP", 2, "AM/MT"],
    ["JORGE", "FERRAGUZ", "SALUD", "MP", 2, "AM/MT"],
    ["NATALIA", "CAIMI", "BANCO", "OCA", 2, "AM/MT"],
    ["GABRIELA", "PEREZ", "BANCO", "OCA", 2, "AM/MT"],
    ["JUAN PABLO", "FERNANDEZ", "BANCO", "OCA", 2, "AM/MT"],
    ["FLORENCIA", "DIAZ", "BANCO", "OCA", 2, "AM/MT"],
    ["IGNACIO", "MARIÑO", "BANCO", "OCA", 2, "AM/MT"],
    ["RAUL", "MONTOSSI", "BANCO", "ITAU", 3, "AM/MT"],
    ["EXTRA", "DIRECTIVA", "BANCO", "ITAU", 2, "AM/MT"],
    ["EXTRA", "DIRECTIVA", "BANCO", "ITAU", 2, "AM/MT"],
    ["ROSINA", "URIOSTE", "BANCO", "BBVA", 2, "AM/MT"],
    ["JOAQUIN", "TOLOSA", "BANCO", "BBVA", 2, "AM/MT"],
    ["AGUSTIN", "CIRILI", "CORREDOR DE SEGUROS", "SBI", 2, "AM/MT"],
    ["GUSTAVO", "SPINELLA", "CORREDOR DE SEGUROS", "SBI", 2, "AM/MT"],
    ["FABIAN", "GIOVANOLA", "CORREDOR DE SEGUROS", "SBI", 2, "AM/MT"],
    ["CAMILA", "MIGALES", "CORREDOR DE SEGUROS", "SBI", 2, "AM/MT"],
    ["YAMILA", "BARRERA", "CORREDOR DE SEGUROS", "SBI", 2, "AM/MT"],
    ["EXTRA", "DIRECCION", "BANCO", "SANTANDER", 2, "AM/UA AR"],
    ["EXTRA", "DIRECCION", "BANCO", "SANTANDER", 2, "AM/UA AR"],
    ["VERONICA", "CORREA", "CORREDOR DE SEGUROS", "PORTO SERVICIOS", 2, "AM/MT"],
    ["ANA", "CAMIOU", "FUNCIONARIO SURVIEW", "", 2, "FUNCIONARIO"],
    ["ANA LAURA", "BRITOS", "FUNCIONARIO SURVIEW", "", 2, "FUNCIONARIO"],
    ["SILVANA", "SAGARIO", "EMPRESA", "BIG CHESSE", 2, "MT"],
    ["CECILIA", "MENDEZ", "FUNCIONARIO SURVIEW", "", 2, "FUNCIONARIO"],
    ["JIMENA", "QUINTANA", "FUNCIONARIO SURVIEW", "", 2, "FUNCIONARIO"],
    ["SEBASTIAN", "MARTINEZ", "FUNCIONARIO SURVIEW", "", 2, "FUNCIONARIO"],
    ["THOILME", "SILVA", "FUNCIONARIO SURVIEW", "", 3, "FUNCIONARIO"],
    ["GABRIELA", "CONTI", "AGENCIA", "COIT", 2, "AB"],
    ["VICTORIA", "MENDEZ", "AGENCIA", "JM", 2, "AB"],
    ["VALENTINA", "MENDEZ", "FUNCIONARIO SURVIEW", "", 1, "FUNCIONARIO"],
    ["SOFIA", "RAMIREZ", "FUNCIONARIO SURVIEW", "", 2, "FUNCIONARIO"],
    ["VICTORIA", "PEREIRA", "AGENCIA", "CONOSUR", 2, "AB"],
    ["MARIO", "ETCHESURE", "AGENCIA", "CONOSUR", 2, "AB"],
    ["YHONSON", "CHOCA", "FUNCIONARIO SURVIEW", "", 2, "FUNCIONARIO"],
    ["PABLO", "ANANIKIAN", "AGENCIA", "SUNLIVE", 2, "AB"],
    ["ALEJANDRO", "MENDEZ", "FUNCIONARIO SURVIEW", "", 1, "FUNCIONARIO"],
    ["PAULA", "ARAMENDIA", "FUNCIONARIO SURVIEW", "", 1, "FUNCIONARIO"],
    ["ADRIANA", "FRAGA", "AGENCIA", "NUEVOS MUNDOS", 3, "ANA C."],
    ["DIEGO", "CORREA", "AGENCIA", "MELITOUR", 2, "AB"],
    ["GIULIA", "BARROS", "EMPRESA", "TRYOLABS", 1, "MT"],
    ["SABRINA", "USTINELLI", "EMPRESA", "TRYOLABS", 1, "MT"],
    ["ROSINA", "INTROINI", "EMPRESA", "PWC", 2, "MT"],
    ["VERONICA", "SANCHIZ", "EMPRESA", "PWC", 2, "MT"],
    ["ADRIANA", "RUMBOS", "AGENCIA", "RUMBOS", 2, "AB"],
    ["MAIRA", "PEREZ", "EMPRESA", "GENERSOL DISEL", 2, "MT"],
    ["MARIA EUGENIA", "DÍAZ", "EMPRESA", "BIOERIX", 1, "MT"],
    ["FLORENCIA", "NAVIA", "EMPRESA", "BIOERIX", 1, "MT"],
    ["ALEJO", "QUINTA", "EMPRESA", "BIOERIX", 1, "MT"],
    ["INES", "GIRO", "EMPRESA", "AMS", 2, "MT"],
    ["ZOILA", "ZELA", "EMPRESA", "AIR CLASS", 2, "MT"],
    ["ABEL", "GARCIA", "EMPRESA", "BRENDISOL", 2, "MT"],
    ["INES", "BARRABINO", "CORREDOR DE SEGUROS", "NGS", 2, "MT"],
    ["JOEL", "FELDER", "CORREDOR DE SEGUROS", "EDF", 3, "MT"],
    ["CAROLINA", "GOÑI", "EMPRESA", "GREYCON", 2, "MT"],
    ["FABIANA", "MASINI", "CORREDOR DE SEGUROS", "MASINI SEGUROS", 2, "MT"],
    ["GONZALO", "MASINI", "CORREDOR DE SEGUROS", "MASINI SEGUROS", 2, "MT"],
    ["LAURA", "RISSO", "CORREDOR DE SEGUROS", "RISSO SEGUROS", 2, "MT"],
    ["VERONICA", "BONFIGLIO", "EMPRESA", "NUEVO SIGLO", 2, "MT"],
    ["RICARDO", "HAUSMAN", "CORREDOR DE SEGUROS", "RICARDO HAUSMAN", 2, "MT"],
    ["SUSANA", "GARCIA", "CORREDOR DE SEGUROS", "SUSANA GARCIA SEGUROS", 2, "MT"],
    ["JORGE", "VIDIELLA", "EMPRESA", "LABORATORIO LIBRA", 2, "MT"],
    ["CRISTOBAL", "FERNANDEZ", "CORREDOR DE SEGUROS", "FL SEGUROS", 2, "MT"],
    ["TRAVELOZ", "", "AGENCIA", "TRAVELOZ", 2, "AB"],
    ["TRAVELOZ", "", "AGENCIA", "TRAVELOZ", 2, "AB"],
    ["TRAVELOZ", "", "AGENCIA", "TRAVELOZ", 2, "AB"],
    ["DESTINICO", "", "AGENCIA", "DESTINICO", 2, "AB"],
    ["DESTINICO", "", "AGENCIA", "DESTINICO", 2, "AB"],
    ["DESTINICO", "", "AGENCIA", "DESTINICO", 2, "AB"],
    ["OM TRAVEL", "", "AGENCIA", "OM TRAVEL", 2, "AB"],
    ["OM TRAVEL", "", "AGENCIA", "OM TRAVEL", 2, "AB"],
    ["OM TRAVEL", "", "AGENCIA", "OM TRAVEL", 2, "AB"]
  ];

  function formatTitle(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(w =>  w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  const rows = [];
  let counter = 1;

  rawList.forEach(item =>  {
    const nom = item[0] ? item[0].trim() : '';
    const ape = item[1] ? item[1].trim() : '';
    const canal = item[2] ? item[2].trim() : '';
    const convenio = item[3] ? item[3].trim() : '';
    const asientos = item[4] || 2;
    const referente = item[5] ? item[5].trim() : '';

    const code = 'UA-' + String(counter).padStart(3, '0');
    counter++;

    let fullName = (formatTitle(nom) + ' ' + formatTitle(ape)).trim();
    if (nom === 'EXTRA') {
      fullName = `Cupo ${formatTitle(ape)} (${convenio || canal || 'UA'})`;
    } else if (['TRAVELOZ', 'DESTINICO', 'OM TRAVEL'].includes(nom)) {
      fullName = `Cupo ${formatTitle(nom)} (${convenio || 'Agencia'})`;
    }

    const inviteLink = `${LANDING_URL}?i=${code}`;

    rows.push([
      code,                 // A: Código
      fullName,             // B: Nombre Completo
      '',                   // C: Email
      '',                   // D: Teléfono
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
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  try { generarReporteCine_Silent_(); } catch (_) {}

  Logger.log('importOfficialList: ' + rows.length + ' invitados importados con exito.');
  return { ok: true, count: rows.length };
}

// ═══════════════════════════════════════════════════════════════════════
// REPARACIÓN Y SINCRONIZACIÓN FORZADA
// ═══════════════════════════════════════════════════════════════════════

/**
 * Función del menú "🔧 Reparar y Sincronizar Tablas (Desfase)"
 * Fuerza una sincronización completa: importa desde la hoja externa,
 * genera códigos faltantes, invalida el caché y regenera el reporte.
 */
/**
 * ✅ ACTUALIZAR TODO — Función principal de sincronización completa.
 * Orquesta: caché, reconstrucción desde Hoja1, generación de links,
 * regeneración del Reporte de Sala y la Hoja3 de distribución.
 */
/**
 * 🔄 ACTUALIZAR TODO — Lógica silenciosa de sincronización completa.
 * Ejecuta: Caché ->  Sync Hoja1 ->  Sync Hoja3 ->  Generar Códigos ->  Generar Links ->  Reporte Sala ->  Caché
 */
function actualizarTodo_Silent_() {
  const log = [];
  let hayErrores = false;

  // ── PASO 1: Limpiar caché ──
  try {
    invalidarCacheCompleto_();
    log.push('✅ Caché limpiado');
  } catch (e) {
    log.push('⚠️ Caché: ' + (e.message || e));
  }

  // ── PASO 1.5: Limpiar estados de email falsos (batch) ──
  try {
    const cleanSheet = getSheet_(SHEET_INVITADOS);
    const cleanLastRow = cleanSheet.getLastRow();
    if (cleanLastRow >= 2) {
      const mailData = cleanSheet.getRange(2, 11, cleanLastRow - 1, 2).getValues();
      let cleaned = 0;
      const updates = []; // [row, value]
      mailData.forEach((row, i) =>  {
        const mailStatus = String(row[0] || '').trim();
        const demoCheck = String(row[1] || '').trim().toUpperCase();
        if (mailStatus.indexOf('DEMO') >= 0 && demoCheck !== 'TRUE' && demoCheck !== 'SÍ' && demoCheck !== 'SI' && demoCheck !== 'YES' && demoCheck !== '✓' && demoCheck !== 'X') {
          updates.push(i);
          cleaned++;
        }
      });
      // Batch clear: rewrite column K in one shot
      if (cleaned >  0) {
        const colK = mailData.map((row, i) =>  [updates.indexOf(i) >= 0 ? '' : row[0]]);
        cleanSheet.getRange(2, 11, colK.length, 1).setValues(colK);
        log.push(`✅ ${cleaned} estados de email falsos corregidos`);
      }
    }
  } catch (e) {
    log.push('⚠️ Limpieza mail: ' + (e.message || e));
  }

  // ── PASO 2: Reconstruir tabla Invitados desde Hoja1 (incluye códigos y links) ──
  let recount = 0;
  try {
    const res = repararYReconstruirInvitados();
    if (res.error) {
      log.push('⚠️ Sync Hoja1: ' + res.error);
    } else {
      recount = res.count || 0;
      log.push(`✅ Hoja1 sincronizada (${recount} invitados con códigos y links)`);
    }
  } catch (e) {
    log.push('⚠️ Sync Hoja1: ' + (e.message || e));
    hayErrores = true;
  }

  // ── PASO 6: Regenerar reporte de sala ──
  try {
    generarReporteCine_Silent_();
    log.push('✅ Reporte de sala regenerado');
  } catch (e) {
    log.push('⚠️ Reporte: ' + (e.message || e));
  }

  // ── PASO 7: Volver a limpiar caché ──
  try {
    invalidarCacheCompleto_();
  } catch (_) {}

  return {
    ok: !hayErrores,
    log: log,
    recount: recount
  };
}

/**
 * ✅ ACTUALIZAR TODO — Función principal interactiva (menú de Sheets).
 */
function actualizarTodo() {
  let ui;
  try { ui = SpreadsheetApp.getUi(); } catch (_) {}

  if (ui) {
    const resp = ui.alert(
      '🔄 Actualizar Todo',
      'Esto va a ejecutar la sincronización completa:\n\n' +
      '1️⃣  Importar/sincronizar invitados desde Hoja1\n' +
      '2️⃣  Generar códigos UA-NNN para filas sin código\n' +
      '3️⃣  Generar links de invitación (Columna J)\n' +
      '4️⃣  Regenerar el Reporte de Sala (Reporte_Cine_Movie)\n' +
      '5️⃣  Actualizar la Hoja3 de distribución\n' +
      '6️⃣  Limpiar caché para reflejar cambios al instante\n\n' +
      '¿Continuar?',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;
  }

  const res = actualizarTodo_Silent_();

  if (ui) {
    const icon = res.ok ? '✅' : '⚠️';
    ui.alert(
      `${icon} Actualización Completa`,
      res.log.join('\n') + '\n\n📌 Recargá el Panel Admin para ver todos los cambios.',
      ui.ButtonSet.OK
    );
  }

  return res;
}

/**
 * Función backend para el Panel Admin Web
 */
function adminActualizarTodo() {
  return actualizarTodo_Silent_();
}

function invalidarCacheCompleto_() {
  try {
    const cache = CacheService.getScriptCache();
    const sheet = getSheet_(SHEET_INVITADOS);
    const lastRow = sheet.getLastRow();

    // Limpiar caché de configuración
    cache.remove('CONFIG_CACHE_V2');

    // Limpiar caché de cada invitado
    if (lastRow >= 2) {
      const codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      const keysToRemove = codes
        .filter(c =>  c)
        .map(c =>  'GUEST_V2_' + String(c).toUpperCase().trim());
      if (keysToRemove.length >  0) {
        cache.removeAll(keysToRemove);
      }
    }
  } catch (_) {}
}

/**
 * Genera códigos UA-NNN para filas del sheet "Invitados" que tienen nombre
 * pero no tienen código en la Columna A. Retorna la cantidad generada.
 */
function generarCodigosFaltantes_Silent_() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

  // Obtener el máximo número UA existente
  let maxNum = 0;
  data.forEach(r =>  {
    const code = String(r[0] || '').trim();
    if (code) {
      const m = code.match(/UA-(\d+)/i);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    }
  });

  let generated = 0;
  data.forEach((r, i) =>  {
    const code = String(r[0] || '').trim();
    const name = String(r[1] || '').trim();
    if (!code && name) {
      maxNum++;
      const newCode = 'UA-' + String(maxNum).padStart(3, '0');
      const link = `${LANDING_URL}?i=${encodeURIComponent(newCode)}`;
      const sheetRow = i + 2;
      sheet.getRange(sheetRow, 1).setValue(newCode);
      if (!r[9]) sheet.getRange(sheetRow, 10).setValue(link);
      generated++;
    }
  });

  if (generated >  0) {
    try { SpreadsheetApp.flush(); } catch (_) {}
  }

  return generated;
}

/**
 * Agrega los 9 invitados faltantes del 2do Envío a la planilla de Google Sheets.
 */
function addSecondBatchGuests() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  
  // Buscar código máximo existente
  const data = sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 1).getValues();
  let maxNum = 213;
  data.forEach(r => {
    const code = String(r[0] || '').trim();
    const m = code.match(/UA-(\d+)/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });

  const missingGuests = [
    { name: 'Juan Pablo', email: 'juanpablo@libertyuruguay.com.uy', agency: 'Liberty Uruguay' },
    { name: 'Pablo', email: 'pablo@libertyuruguay.com.uy', agency: 'Liberty Uruguay' },
    { name: 'Magdalena Larrosa', email: 'magdalena@batistaviajes.com.uy', agency: 'Batista Viajes' },
    { name: 'Martín Moller', email: 'martin@batistaviajes.com.uy', agency: 'Batista Viajes' },
    { name: 'Isabel Lobato', email: 'isabel@batista.travel', agency: 'Batista Travel' },
    { name: 'Alejandro García', email: 'alejandro@rumbosturismo.com', agency: 'Rumbos Turismo' },
    { name: 'Enrique', email: 'enrique@rumbosturismo.com', agency: 'Rumbos Turismo' },
    { name: 'Adriana Dupuy', email: 'adriana@rumbosturismo.com', agency: 'Rumbos Turismo' },
    { name: 'Virginia Willebald', email: 'virginia@rumbosturismo.com', agency: 'Rumbos Turismo' }
  ];

  const rows = [];
  missingGuests.forEach(g => {
    maxNum++;
    const code = 'UA-' + String(maxNum).padStart(3, '0');
    const link = `${LANDING_URL}?i=${code}`;
    rows.push([
      code,                 // A: Código
      g.name,               // B: Nombre Completo
      g.email,              // C: Email
      '',                   // D: Teléfono
      'Pendiente',          // E: Estado
      'No',                 // F: Acompañante
      '',                   // G: Nombre Acompañante
      2,                    // H: Total Lugares
      '',                   // I: Fecha Respuesta
      link,                 // J: Link Invitación
      'Pendiente de envío', // K: Estado Email
      '0',                  // L: DEMO
      'AGENCIA',            // M: Canal
      g.agency,             // N: Agencia / Convenio
      '2do Envío'           // O: Referente / Etapa
    ]);
  });

  sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
  invalidarCacheCompleto_();
  try { generarReporteCine_Silent_(); } catch (_) {}

  Logger.log('Se agregaron ' + rows.length + ' invitados del 2do Envío con éxito.');
  return { ok: true, count: rows.length, added: missingGuests };
}

/**
 * Limpia los mensajes de error por límite de velocidad de la Columna K para devolverlos a estado 'Pendiente de envío'.
 */
function cleanRateLimitErrors_() {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, cleaned: 0 };

  const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  let cleaned = 0;
  let protectedRows = 0;
  data.forEach((row, i) => {
    const val = String(row[10] || '').trim();
    // PROTECCIÓN: Nunca resetear filas que ya fueron enviadas o abiertas exitosamente
    if (val.indexOf('Enviado') >= 0 || val.indexOf('enviad') >= 0 || val.indexOf('Abierto') >= 0) {
      protectedRows++;
      return;
    }
    if (val.indexOf('Error') >= 0) {
      sheet.getRange(i + 2, 11).setValue('');
      cleaned++;
    }
  });

  invalidarCacheCompleto_();
  return { ok: true, cleaned, protectedRows };
}

/**
 * Actualiza el maxSeats (Columna H) de un invitado específico por su código.
 * Permite asignar un número personalizado de entradas (ej. 4 = invitado + 3 acompañantes).
 */
function setMaxSeats_(code, seats) {
  if (!code) return { ok: false, error: 'Falta el código del invitado.' };
  if (seats < 1 || seats > 10) return { ok: false, error: 'El valor de seats debe estar entre 1 y 10.' };

  const sheet = getSheet_(SHEET_INVITADOS);
  const row = findGuestRow_(sheet, code);
  if (!row) return { ok: false, error: 'Invitado no encontrado: ' + code };

  sheet.getRange(row, 8).setValue(seats); // Columna H = maxSeats
  invalidarCacheCompleto_();

  const name = sheet.getRange(row, 2).getValue();
  return { ok: true, code, name, newMaxSeats: seats, message: name + ' ahora tiene ' + seats + ' entradas (' + (seats - 1) + ' acompañantes).' };
}

/**
 * Marca las filas que coincidan con un código o dirección de correo como Enviado manualmente.
 */
function markGuestSent_(code, email) {
  const sheet = getSheet_(SHEET_INVITADOS);
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  let updated = 0;
  const nowStr = Utilities.formatDate(new Date(), 'GMT-03:00', 'dd/MM HH:mm');

  data.forEach((row, i) => {
    const rCode = String(row[0] || '').trim();
    const rEmail = String(row[2] || '').trim().toLowerCase();
    if ((code && rCode === code) || (email && rEmail === email.toLowerCase())) {
      sheet.getRange(i + 2, 11).setValue(`Enviado (${nowStr} hs)`);
      updated++;
    }
  });

  invalidarCacheCompleto_();
  return { ok: true, updated };
}



