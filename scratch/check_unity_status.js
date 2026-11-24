const http = require('http');
const { execSync, spawn } = require('child_process');

console.log('=== Unity Process and Port Inspection ===');
try {
  const tasklist = execSync('tasklist').toString();
  const matching = tasklist.split('\n').filter(line => /unity/i.test(line));
  console.log('Matching Unity processes:');
  if (matching.length > 0) {
    matching.forEach(m => console.log('  ' + m.trim()));
  } else {
    console.log('  None found in tasklist.');
  }
} catch (e) {
  console.error('Tasklist error:', e.message);
}

console.log('\nChecking http://127.0.0.1:7890/api/ping ...');
const req = http.get('http://127.0.0.1:7890/api/ping', { timeout: 2000 }, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HTTP 7890 Ping response:', res.statusCode, data));
});
req.on('error', err => console.log('HTTP 7890 Ping error:', err.message));
req.on('timeout', () => { req.destroy(); console.log('HTTP 7890 Ping timeout'); });
