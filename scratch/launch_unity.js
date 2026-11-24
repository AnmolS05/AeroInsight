const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const unityExe = process.env.UNITY_EXE_PATH || 'C:\\Program Files\\Unity 6000.6.0f1\\Editor\\Unity.exe';
const projectPath = process.env.UNITY_PROJECT_PATH || path.resolve(__dirname, '../simulation');
const logFile = path.resolve(__dirname, 'unity_editor_boot.log');

if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

console.log('Launching Unity Editor from:', unityExe);
console.log('Project Path:', projectPath);
console.log('Log File:', logFile);

const args = [
  '-projectPath', projectPath,
  '-logFile', logFile
];

const out = fs.openSync(logFile, 'a');
const err = fs.openSync(logFile, 'a');

const subprocess = spawn(unityExe, args, {
  detached: true,
  stdio: ['ignore', out, err]
});

subprocess.unref();

console.log('Spawned Unity process PID:', subprocess.pid);
