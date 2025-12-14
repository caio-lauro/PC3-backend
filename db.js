import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'db.sqlite');
const DB = new Database(dbPath);

DB.pragma("foreign_keys = ON");

DB.prepare(`
    CREATE TABLE IF NOT EXISTS Usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        CEP TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL
    )
`).run();

DB.prepare(`
    CREATE TABLE IF NOT EXISTS Pratos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        categoria TEXT NOT NULL,
        ingredientes TEXT NOT NULL
    )
`).run();

DB.prepare(`
    CREATE TABLE IF NOT EXISTS Pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        valor_total REAL NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
    )
`).run();

DB.prepare(`
    CREATE TABLE IF NOT EXISTS Pratos_pedido (
        id_pedido INTEGER NOT NULL,
        id_prato INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        FOREIGN KEY (id_pedido) REFERENCES Pedidos(id),
        FOREIGN KEY (id_prato) REFERENCES Pratos(id)
    )
`).run();


export default DB;