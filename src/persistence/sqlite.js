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
            if (err) return reject(`Failed to open database: ${err.message}`);

            if (process.env.NODE_ENV !== 'test')
                console.log(`Using SQLite database at ${location}`);

            db.run(
                `CREATE TABLE IF NOT EXISTS todo_items (
                    id TEXT PRIMARY KEY, 
                    name TEXT NOT NULL, 
                    completed BOOLEAN NOT NULL
                )`,
                (err) => {
                    if (err) return reject(`Failed to create table: ${err.message}`);
                    resolve();
                }
            );
        });
    });
}

async function teardown() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) return reject(`Failed to close database: ${err.message}`);
                resolve();
            });
        } else {
            resolve();
        }
    });
}

async function getItems() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM todo_items', (err, rows) => {
            if (err) return reject(`Failed to fetch items: ${err.message}`);
            resolve(
                rows.map((item) => ({
                    ...item,
                    completed: item.completed === 1, // Ensure boolean type
                }))
            );
        });
    });
}

async function getItem(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM todo_items WHERE id = ?', [id], (err, row) => {
            if (err) return reject(`Failed to fetch item: ${err.message}`);
            if (!row) return resolve(null); // Return null if item not found
            resolve({
                ...row,
                completed: row.completed === 1, // Ensure boolean type
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
                if (err) return reject(`Failed to store item: ${err.message}`);
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
                if (err) return reject(`Failed to update item: ${err.message}`);
                resolve();
            }
        );
    });
}

async function removeItem(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM todo_items WHERE id = ?', [id], (err) => {
            if (err) return reject(`Failed to delete item: ${err.message}`);
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
