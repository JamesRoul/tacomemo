const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./database/mydatabase.db', (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

module.exports = db;