const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vox2you.sqlite');

const backupTables = ['Classes_backup', 'Courses_backup', 'Students_backup', 'Enrollments_backup', 'FinancialRecords_backup'];

db.serialize(() => {
    backupTables.forEach(table => {
        db.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
            if (err) console.error(`Error dropping ${table}:`, err);
            else console.log(`Dropped ${table}`);
        });
    });
});

db.close();
