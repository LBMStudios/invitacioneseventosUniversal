const https = require('https');

const scriptUrl = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function fetchUrl(url) {
  https.get(url, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return fetchUrl(res.headers.location);
    }
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const list = json.guests || [];
        
        let confirmedList = [];
        let totalSeatsSum = 0;
        
        list.forEach(g => {
          if (g.status === 'Confirmado') {
            const seats = Number(g.totalSeats) || 2;
            totalSeatsSum += seats;
            confirmedList.push({
              code: g.code,
              name: g.name,
              status: g.status,
              companion: g.companion,
              companionName: g.companionName,
              totalSeats: seats
            });
          }
        });
        
        console.log('Total confirmados:', confirmedList.length);
        console.log('Suma exacta de butacas (totalSeats):', totalSeatsSum);
        console.log('Ocupación exacta sobre 300:', (totalSeatsSum / 300 * 100).toFixed(1) + '%');
        console.log('Detalle de confirmados:');
        console.log(JSON.stringify(confirmedList, null, 2));
      } catch (e) {
        console.log('Error:', e.message);
      }
    });
  }).on('error', err => console.error('Request error:', err));
}

fetchUrl(scriptUrl);
