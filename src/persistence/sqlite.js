const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const location = process.env.SQLITE_DB_LOCATION || '/etc/todos/todo.db';

let db;

function init() {
    const dirName = path.dirname(location);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(location, (err) => {
            if (err) return reject(err);

            if (process.env.NODE_ENV !== 'test')
                console.log(`Using SQLite database at ${location}`);

            db.run(
                `CREATE TABLE IF NOT EXISTS todo_items (
                    id TEXT PRIMARY KEY, 
                    name TEXT NOT NULL, 
                    completed INTEGER NOT NULL DEFAULT 0
                )`,
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    });
}

async function teardown() {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function getItems() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM todo_items', (err, rows) => {
            if (err) return reject(err);
            resolve(
                rows.map((item) => ({
                    ...item,
                    completed: item.completed === 1, 
                }))
            );
        });
    });
}

async function getItem(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM todo_items WHERE id = ?', [id], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            resolve({
                ...row,
                completed: row.completed === 1, 
            });
        });
    });
}

async function storeItem(item) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)',
            [item.id, item.name, item.completed ? 1 : 0],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

async function updateItem(id, item) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE todo_items SET name = ?, completed = ? WHERE id = ?',
            [item.name, item.completed ? 1 : 0, id],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

async function removeItem(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM todo_items WHERE id = ?', [id], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};
