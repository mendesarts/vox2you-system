const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'voxflow.sqlite');
console.log('Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

db.serialize(() => {
    db.all("SELECT id, name, email, password, role FROM Users WHERE email = 'admin@voxflow.com'", (err, rows) => {
        if (err) {
            console.error('Error querying database:', err);
        } else {
            console.log('Admin User(s) found:', rows);
        }
        db.close();
    });
});
