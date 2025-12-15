const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vox2you.sqlite');

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS Classes;", function (err) {
        if (err) console.log(err);
        else console.log("Classes table dropped.");
    });
});

db.close();
