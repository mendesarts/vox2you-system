const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'vox2you.sqlite');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const performBackup = () => {
    return new Promise((resolve, reject) => {
        // Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        // Check if DB exists
        if (!fs.existsSync(DB_PATH)) {
            console.log('No database file found to backup.');
            return resolve(null);
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupFilename = `vox2you-backup-${timestamp}.sqlite`;
        const backupPath = path.join(BACKUP_DIR, backupFilename);

        fs.copyFile(DB_PATH, backupPath, (err) => {
            if (err) {
                console.error('Backup failed:', err);
                reject(err);
            } else {
                console.log(`Database backup created: ${backupFilename}`);

                // Cleanup old backups (keep last 10)
                cleanOldBackups();

                resolve(backupFilename);
            }
        });
    });
};

const cleanOldBackups = () => {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return;

        const dbFiles = files.filter(f => f.startsWith('vox2you-backup-') && f.endsWith('.sqlite'));
        if (dbFiles.length > 10) {
            // Sort by name (which includes timestamp) descending
            dbFiles.sort().reverse();

            // Delete files after the 10th one
            const filesToDelete = dbFiles.slice(10);
            filesToDelete.forEach(file => {
                fs.unlink(path.join(BACKUP_DIR, file), err => {
                    if (err) console.error(`Error deleting old backup ${file}:`, err);
                });
            });
        }
    });
};

module.exports = { performBackup };
