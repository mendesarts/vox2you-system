const express = require('express');
const router = express.Router();
const { performBackup } = require('../utils/backup');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// POST /admin/backup - Trigger manual backup
router.post('/backup', async (req, res) => {
    try {
        const filename = await performBackup();
        if (filename) {
            res.json({ message: 'Backup realizado com sucesso', filename });
        } else {
            res.status(404).json({ error: 'Nenhum banco de dados para fazer backup' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/backups - List existing backups
router.get('/backups', (req, res) => {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao ler diretório de backups' });
        }
        const backups = files
            .filter(f => f.endsWith('.sqlite'))
            .map(f => {
                const stat = fs.statSync(path.join(BACKUP_DIR, f));
                return {
                    filename: f,
                    createdAt: stat.birthtime,
                    size: stat.size
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt); // Newest first

        res.json(backups);
    });
});

module.exports = router;
