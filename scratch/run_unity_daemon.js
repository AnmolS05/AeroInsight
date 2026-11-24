const { spawn } = require('child_process');

const path = require('path');

const unityExe = process.env.UNITY_EXE_PATH || 'C:\\Program Files\\Unity 6000.6.0f1\\Editor\\Unity.exe';
const projectPath = process.env.UNITY_PROJECT_PATH || path.resolve(__dirname, '../simulation');

console.log('[Unity Daemon] Starting Unity Editor for AeroInsight simulation...');
console.log('[Unity Daemon] Executable:', unityExe);
console.log('[Unity Daemon] Project:', projectPath);

const child = spawn(unityExe, ['-projectPath', projectPath, '-logFile', '-'], {
  stdio: 'inherit'
});

child.on('error', (err) => {
  console.error('[Unity Daemon] Process error:', err);
});

child.on('exit', (code, signal) => {
  console.log(`[Unity Daemon] Unity exited with code ${code}, signal ${signal}`);
});
