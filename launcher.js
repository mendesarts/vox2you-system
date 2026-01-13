const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (msg) => {
    fs.appendFileSync(path.join(__dirname, 'launcher.log'), msg + '\n');
    console.log(msg);
};

log('Starting Launcher...');

const startService = (name, command, args, cwd) => {
    log(`Starting ${name}...`);
    const child = spawn(command, args, {
        cwd: path.join(__dirname, cwd),
        stdio: 'ignore', // Detach completely
        detached: true
    });
    child.unref();
    log(`${name} started with PID ${child.pid}`);
};

// Backend
startService('Backend', 'node', ['index.js'], 'server');

// Frontend
startService('Frontend', 'npm', ['run', 'dev'], 'client');

log('Launcher finished.');
