const { spawnSync } = require('child_process');

const path = require('path');

const unityExe = process.env.UNITY_EXE_PATH || 'C:\\Program Files\\Unity 6000.6.0f1\\Editor\\Unity.exe';
const projectPath = process.env.UNITY_PROJECT_PATH || path.resolve(__dirname, '../simulation');

console.log('Testing Unity launch synchronously...');
const res = spawnSync(unityExe, ['-projectPath', projectPath, '-logFile', '-'], {
  encoding: 'utf8',
  timeout: 15000 // wait max 15 seconds
});

console.log('Status code:', res.status);
console.log('Signal:', res.signal);
console.log('Stderr:', res.stderr);
console.log('Stdout (first 1000 chars):', (res.stdout || '').substring(0, 1000));
console.log('Stdout (last 1000 chars):', (res.stdout || '').slice(-1000));
