import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import DB from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
const SALT_ROUNDS = 3;
const SALT = bcrypt.genSaltSync(SALT_ROUNDS);

// Permission for frontend to access backend
app.use(
	cors({
		origin: [
			process.env.FRONTEND_URL || "http://localhost:5173", 
			"http://127.0.0.1:5173"
		],
		methods: ["GET", "POST"],
		allowedHeaders: ['Content-Type', 'Authorization']
	})
);

// Allows JSON for requests
app.use(express.json());


// API Routes

app.post("/api/cadastrar", (req, res) => {
	const { name, phone, cep, email, password, confirm } = req.body;

	if (!name || !phone || !cep || !email || !password || !confirm) {
		return res.status(400).json({ error: "Todos os campos devem ser preenchidos." });
	}

	// TODO: demais verificações

	try {
		const isRegistered = DB.prepare(`SELECT * FROM Usuarios WHERE email = ?`).get(email);
		if (isRegistered) {
			return res.status(400).json({ error: "E-mail já cadastrado." });
		}

		const hashedPassword = bcrypt.hashSync(password, SALT);

		const stmt = DB.prepare(`
			INSERT INTO Usuarios (nome, telefone, CEP, email, senha)
			VALUES (?, ?, ?, ?, ?)
		`);

		const result = stmt.run(name,phone,cep,email,hashedPassword);

		return res.status(200).json({ id: result.lastInsertRowid });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

// Run app on PORT
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
