const BACKEND = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const args = Object.fromEntries(process.argv.slice(2).filter(a=>a.startsWith('--')).map(a=>{const[k,v]=a.slice(2).split('=');return[k,v];}));
const TOTAL       = parseInt(args.users       || '100', 10);
const CONCURRENCY = parseInt(args.concurrency || '20',  10);
const DELAY       = parseInt(args.delay        || '100', 10);

const NAMES   = ['Lucas','Maria','Juan','Ana','Carlos','Laura','Diego','Paula','Martin','Sofia'];
const SURNAMES = ['Garcia','Lopez','Rodriguez','Martinez','Gonzalez','Perez','Sanchez','Fernandez'];

function fakeGuest(i) {
  const withCompanion = i % 3 === 0;
  return new URLSearchParams({
    code:          'UA-SIM-' + String(i).padStart(4,'0'),
    guestName:     NAMES[i % NAMES.length] + ' ' + SURNAMES[i % SURNAMES.length],
    email:         'test' + i + '@example.com',
    phone:         '099' + String(100000 + i).slice(1),
    attendance:    'yes',
    companion:     withCompanion ? 'yes' : 'no',
    companionName: withCompanion ? 'Acomp ' + i : '',
    allowUpdate:   '1',
    simulate:      '1'
  });
}

async function sendOne(i) {
  const t0 = Date.now();
  try {
    const r = await fetch(BACKEND, { method:'POST', body: fakeGuest(i), signal: AbortSignal.timeout(15000) });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch(_) { json = {}; }
    return { ok: r.ok && json.ok === true, ms: Date.now()-t0, err: (!r.ok||!json.ok) ? (json.error||'HTTP '+r.status) : null };
  } catch(e) { return { ok: false, ms: Date.now()-t0, err: e.message }; }
}

function pct(arr, p) { return arr[Math.floor(arr.length * p)]; }

(async () => {
  console.log('');
  console.log('============================================================');
  console.log('  UA RSVP LOAD TEST - MODO SIMULACION (sin datos reales)');
  console.log('============================================================');
  console.log('  Usuarios    : ' + TOTAL);
  console.log('  Concurrencia: ' + CONCURRENCY + ' por lote');
  console.log('  Delay       : ' + DELAY + 'ms entre lotes');
  console.log('  simulate=1  : NO escribe en Sheets ni envia emails');
  console.log('============================================================');
  console.log('  Iniciando...');
  console.log('');

  const results = [];
  const t0 = Date.now();

  for (let i = 0; i < TOTAL; i += CONCURRENCY) {
    const batch = Array.from({length: Math.min(CONCURRENCY, TOTAL - i)}, (_,j) => i+j);
    const bres  = await Promise.all(batch.map(sendOne));
    results.push(...bres);
    const done = results.length;
    const ok   = results.filter(r=>r.ok).length;
    const pctDone = Math.round(done/TOTAL*100);
    process.stdout.write('\r  Progreso: ' + pctDone + '% | OK: ' + ok + ' | ERR: ' + (done-ok) + '/' + done + '   ');
    if (i + CONCURRENCY < TOTAL) await new Promise(r=>setTimeout(r,DELAY));
  }

  const totalMs = Date.now() - t0;
  const ok      = results.filter(r=>r.ok);
  const failed  = results.filter(r=>!r.ok);
  const times   = results.map(r=>r.ms).sort((a,b)=>a-b);
  const avg     = Math.round(times.reduce((s,t)=>s+t,0)/times.length);

  console.log('\n');
  console.log('============================================================');
  console.log('  RESULTADOS');
  console.log('============================================================');
  console.log('  Total       : ' + results.length);
  console.log('  Exitosos    : ' + ok.length + ' (' + (ok.length/results.length*100).toFixed(1) + '%)');
  console.log('  Fallidos    : ' + failed.length);
  console.log('  Tiempo total: ' + (totalMs/1000).toFixed(2) + 's');
  console.log('');
  console.log('  LATENCIA (ms):');
  console.log('    Min  : ' + times[0]);
  console.log('    Prom : ' + avg);
  console.log('    P50  : ' + pct(times,0.50));
  console.log('    P90  : ' + pct(times,0.90));
  console.log('    P99  : ' + pct(times,0.99));
  console.log('    Max  : ' + times[times.length-1]);

  if (failed.length > 0) {
    console.log('');
    console.log('  ERRORES:');
    const g = {};
    failed.forEach(f=>{ g[f.err]=(g[f.err]||0)+1; });
    Object.entries(g).forEach(([e,c])=>console.log('    ['+c+'x] '+e));
  }

  console.log('');
  console.log('  VEREDICTO:');
  const p90 = pct(times, 0.90);
  if (failed.length === 0 && p90 < 5000) {
    console.log('  APTO PARA PRODUCCION - sin errores y P90 < 5s.');
  } else if (failed.length/results.length < 0.02 && p90 < 10000) {
    console.log('  ACEPTABLE - menos del 2% de errores.');
  } else {
    console.log('  REVISAR - tasa de error alta. Probá con --concurrency=10 --delay=200');
  }
  console.log('============================================================');
  console.log('');
})();
