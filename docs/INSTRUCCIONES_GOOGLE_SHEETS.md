# Guía de Administración & Google Sheets para la Invitación Universal Assistance

Esta guía contiene las instrucciones paso a paso para administrar la lista oficial de invitados, configurar la planilla de **Google Sheets**, desplegar el **Google Apps Script** y generar los enlaces personalizados para enviar por WhatsApp o correo.

---

## 1. Estructura de la Planilla en Google Sheets

Creá un nuevo libro en **Google Sheets** (ej: `Invitaciones UA Cine 2026`) y asegurate de que la primera hoja contenga exactamente las siguientes encabezados en la **Fila 1**:

| Columna | Nombre exacto de la Columna | Descripción / Ejemplo |
| :--- | :--- | :--- |
| **A** | `Codigo` | Código único del invitado (ej: `UA-001`, `UA-002`). |
| **B** | `Nombre` | Nombre y apellido del invitado (ej: `Lucas Beathyate`). |
| **C** | `Email` | Correo electrónico del invitado. |
| **D** | `Telefono` | Teléfono de contacto. |
| **E** | `Estado` | Estado actual (`Pendiente`, `Confirmado`, `No asiste`). |
| **F** | `TieneAcompanante` | Indica si asiste con acompañante (`SI` / `NO`). |
| **G** | `NombreAcompanante` | Nombre y apellido del acompañante. |
| **H** | `TotalAccesos` | Número total de lugares reservados (`1` o `2`). |
| **I** | `FechaRespuesta` | Timestamp de cuando respondió el formulario. |

---

## 2. Código de Google Apps Script (`Code.gs`)

1. En tu libro de Google Sheets, ve al menú superior: **Extensiones** > **Apps Script**.
2. Borra todo el código que aparezca por defecto y pega el siguiente script completo:

```javascript
/**
 * Backend Google Apps Script para Invitaciones Universal Assistance
 * Función Especial Coyote vs. Acme - Montevideo Shopping
 */

function doGet(e) {
    if (String(row[0]).trim().toUpperCase() === String(code).trim().toUpperCase()) {
      return jsonpResponse({
        ok: true,
        guest: {
          code: row[0],
          name: row[1],
          email: row[2],
          phone: row[3],
          status: row[4] || 'Pendiente',
          hasCompanion: row[5] === 'SI',
          companionName: row[6] || '',
          totalSeats: Number(row[7]) || 1,
          responseDate: row[8] || ''
        },
        event: {
          name: 'Función especial Coyote vs. Acme',
          brand: 'Universal Assistance',
          date: '27/08/2026',
          time: '20:00',
          arrivalTime: '19:30',
          venue: 'Movie Montevideo Shopping',
          mapsUrl: 'https://maps.google.com/?q=Movie+Montevideo+Shopping',
          intro: 'Queremos compartir contigo una función especial.',
          confirmationMessage: 'Tu asistencia quedó registrada.'
        }
      }, callback);
    }
  }

  return jsonpResponse({ ok: false, error: 'No encontramos tu invitación en la lista.' }, callback);
}

function handleRsvp(params, callback) {
  const code = params.code;
  const attendance = params.attendance; // "SI" o "NO"
  const hasCompanion = params.hasCompanion; // "SI" o "NO"
  const companionName = params.companionName || '';
  const email = params.email || '';
  const phone = params.phone || '';

  if (!code) {
    return jsonpResponse({ ok: false, error: 'Falta el código de invitación.' }, callback);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === String(code).trim().toUpperCase()) {
      const rowIndex = i + 1; // 1-indexed
      const status = attendance === 'SI' ? 'Confirmado' : 'No asiste';
      const totalSeats = attendance === 'SI' ? (hasCompanion === 'SI' ? 2 : 1) : 0;
      const nowString = Utilities.formatDate(new Date(), 'America/Montevideo', 'dd/MM/yyyy HH:mm:ss');

      // Actualizar fila en Google Sheets
      if (email) sheet.getRange(rowIndex, 3).setValue(email);
      if (phone) sheet.getRange(rowIndex, 4).setValue(phone);
      sheet.getRange(rowIndex, 5).setValue(status);
      sheet.getRange(rowIndex, 6).setValue(hasCompanion);
      sheet.getRange(rowIndex, 7).setValue(companionName);
      sheet.getRange(rowIndex, 8).setValue(totalSeats);
      sheet.getRange(rowIndex, 9).setValue(nowString);

      const guestObj = {
        code: data[i][0],
        name: data[i][1],
        email: email || data[i][2],
        totalSeats: totalSeats
      };

      // Enviar Correo HTML Estilo Ticket VIP si confirmó asistencia
      if (attendance === 'SI' && guestObj.email) {
        sendTicketEmail(guestObj.email, guestObj);
      }

      return jsonpResponse({
        ok: true,
        message: 'Respuesta guardada con éxito',
        status: status,
        totalSeats: totalSeats
      }, callback);
    }
  }

  return jsonpResponse({ ok: false, error: 'No se pudo encontrar la invitación para actualizar.' }, callback);
    } else if (isAttending) {
      mailStatus = 'Confirmado sin correo electrónico';
    } else {
      mailStatus = 'No asiste';
    }

    sheet.getRange(row, 10).setValue(mailStatus);

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

  const values = sheet.getRange(row, 1, 1, 10).getDisplayValues()[0];
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
      mailStatus: values[9]
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
    .addItem('💬 Generar Botones de WhatsApp', 'generarLinksWhatsApp')
    .addItem('⏰ Programar Recordatorio Automático (24hs antes)', 'crearActivadorRecordatorioAuto')
    .addItem('✉️ Enviar Recordatorio Ahora (Manual)', 'enviarRecordatorioAConfirmados')
    .addItem('🎲 Generar Códigos Faltantes', 'generarCodigosFaltantes')
    .addItem('✉️ Enviar Correo de Prueba', 'enviarMailDePrueba')
    .addToUi();
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
      '☐ Sin Ingresar',
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

    // Reemplazar saltos de línea por %20 para evitar errores de análisis en la fórmula de Sheets
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
<html lang="es">
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
<html lang="es">
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

            <!-- LÍNEA DE TROQUELADO CON MUESCAS LATERALES DEL COLOR DEL FONDO DE PANTALLA (#071938) -->
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

            <!-- SECCIÓN QR Y CÓDIGO DE ENTRADA (100% CENTRADO EN PC Y CELULAR) -->
            <tr>
              <td class="ticket-pad" align="center" style="padding:18px 20px 24px 20px;background-color:#0b2149 !important;text-align:center;">
                
                <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;letter-spacing:1px;margin-bottom:8px;text-align:center;">CÓDIGO DE ENTRADA</div>
                
                <!-- TABLA CÓDIGO CENTRADA -->
                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 14px auto;">
                  <tr>
                    <td align="center" style="background-color:#38bdf8 !important;color:#071938 !important;font-family:monospace,'Courier New',sans-serif;font-size:19px;font-weight:900;padding:6px 20px;border-radius:8px;letter-spacing:1px;text-align:center;">
                      ${escapeHtml_(code)}
                    </td>
                  </tr>
                </table>

                <!-- TABLA QR CENTRADA -->
                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 10px auto;">
                  <tr>
                    <td align="center" style="background-color:#ffffff !important;padding:8px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.5);text-align:center;">
                      <img src="${qrImgUrl}" width="140" height="140" alt="Código QR Entrada" style="display:block;margin:0 auto;background-color:#ffffff !important;max-width:140px;height:auto;border:0;">
                    </td>
                  </tr>
                </table>

                <div style="font-size:10px;font-weight:800;color:#38bdf8 !important;letter-spacing:0.5px;text-align:center;margin-bottom:16px;">ESCANEÁ EN BOLETERÍA</div>

                <!-- TABLA BOTÓN CENTRADA -->
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
        <div style="background-color: #071938; padding: 24px; text-align: center; color: #ffffff;">
          <div style="font-weight: 900; font-size: 14px; margin-bottom: 8px;">Universal Assistance</div>
          <div style="font-size: 11px; color: #94a3b8;">
            2901 7378 · <a href="mailto:lucasb@ua.com.uy" style="color: #38bdf8; text-decoration: none;">lucasb@ua.com.uy</a> · <a href="https://www.universal-assistance.com" style="color: #38bdf8; text-decoration: none;">www.universal-assistance.com</a>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    MailApp.sendEmail({
      to: email,
      subject: '🎟️ Confirmación de Asistencia - Coyote vs. Acme | Universal Assistance (' + guest.code + ')',
      htmlBody: htmlBody
    });
  } catch (err) {
    Logger.log('Error enviando mail: ' + err.toString());
  }
}

function jsonpResponse(data, callback) {
  const json = JSON.stringify(data);
  const output = callback ? `${callback}(${json})` : json;
  return ContentService.createTextOutput(output).setMimeType(
    callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON
  );
}
```

---

## 3. Despliegue del Apps Script como Web App

1. Dentro del editor de Apps Script, hacé clic en el botón azul **Implementar** (arriba a la derecha) > **Nueva implementación**.
2. Selecciona tipo: **Aplicación web**.
3. Configuración:
   - **Descripción**: `Backend Invitaciones UA v1`
   - **Ejecutar como**: `Me` (Tu cuenta)
   - **Quién tiene acceso**: `Anyone` (Cualquier usuario, incluso anónimo).
4. Presioná **Implementar** y autorizá los permisos.
5. Copiá la **URL de la aplicación web** resultante (comienza con `https://script.google.com/macros/s/.../exec`).

---

## 4. Generación de Enlaces de Invitación para WhatsApp

En tu planilla de Google Sheets, podés crear una columna **J** llamada `EnlacePersonalizado` con la siguiente fórmula para generar los links automáticos para cada invitado:

```excel
=CONCATENATE("https://ua-eventos-uy.web.app/coyote-vs-acme?i=", A2)
```

Al enviar este enlace a cada asistente por WhatsApp o correo, al hacer clic verán inmediatamente su invitación personalizada con su nombre, accesos y pase VIP con código QR.
