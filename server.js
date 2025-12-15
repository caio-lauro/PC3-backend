import 'dotenv/config';
import express from "express";
import cors from "cors";
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

	// Verificar nome
	if (name.trim().length < 3) {
		return res.status(400).json({ error: "O nome deve possuir pelo menos 3 letras." });
	} else if (!/^[\p{L} ]+$/u.test(name)) {
		return res.status(400).json({ error: "O nome deve possuir apenas letras do alfabeto." });
	}

	// Verificar telefone
	const splittedNumber = phone.split(" ");
	console.log(splittedNumber);
	if (
		(splittedNumber.length < 2 || splittedNumber.length > 3) ||
		(!/^\(([1-9]{2})\)/.test(splittedNumber[0])) ||
		(splittedNumber.length === 3 && splittedNumber[1] !== '9') ||
		(!/^([0-9]{4})-([0-9]{4})/.test(splittedNumber.at(-1)))
	) {
		return res.status(400).json({ error: "Número de telefone inválido" });
	}

	// Verificar CEP
	if (!/^([0-9]{5})-([0-9]{3})/.test(cep)) {
		return res.status(400).json({ error: "CEP inválido" });
	}

	// Verificar e-mail
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return res.status(400).json({ error: "E-mail inválido" });
	}

	if (password !== confirm) {
		return res.status(400).json({ error: "Senha e confirmação devem coincidir!" });
	}

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

app.post("/api/login", (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: "Todos os campos devem ser preenchidos." });
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return res.status(400).json({ error: "E-mail inválido." });
	}

	try {
		const user = DB.prepare(`SELECT * FROM Usuarios WHERE email = ?`).get(email);

		if (!user) {
			return res.status(401).json({ error: "E-mail e/ou senha incorreto(s)." });
		}

		const correctPassword = bcrypt.compareSync(password, user.senha);

		if (!correctPassword) {
			return res.status(401).json({ error: "E-mail e/ou senha incorreto(s)." });
		}

		const token = jwt.sign(
			{ id: user.id },
			JWT_SECRET
		);

		return res.json({ token });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.get("/api/pratos", (req, res) => {
	try {
		const pratos = DB.prepare(`
			SELECT * FROM Pratos ORDER BY categoria;
		`).all();

		return res.status(200).json(pratos);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.post("/api/adicionar", (req, res) => {
	const { name, price, category, ingredients } = req.body;

	if (!name || !price || !category || !ingredients) {
		return res.status(400).json({ error: "Todos os campos devem ser preenchidos." });
	}

	if (!/^[\p{L} ]+$/u.test(name)) {
		return res.status(400).json({ error: "O nome deve possuir apenas letras do alfabeto." });
	}

	if (!/^([0-9]{1,}),([0-9]{2})/.test(price)) {
		return res.status(400).json({ error: "Preço inválido." });
	}

	if (category !== "entrada" && category !== "principal" && category !== "sobremesa") {
		return res.status(400).json({ error: "Categoria inválida." });
	}

	const splittedIngredients = ingredients.split(',').map(ingredient => ingredient.trim());

	splittedIngredients.forEach(ingredient => {
		if (!/^[\p{L} ]+$/u.test(ingredient))
			return res.status(400).json({ error: "Ingredientes inválidos." });
	});

	const ingredient_array = splittedIngredients.map(ingredient => ingredient.charAt(0).toUpperCase() + ingredient.slice(1));

	try {
		const floatPrice = parseFloat(price.replace(',', '.'));

		const stmt = DB.prepare(`
			INSERT INTO Pratos (nome, preco, categoria, ingredientes)
			VALUES (?, ?, ?, ?)
		`);

		const result = stmt.run(name, floatPrice, category, ingredient_array.join(','));

		return res.status(200).json({ id: result.lastInsertRowid });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.post("/api/remover", (req, res) => {
	const { id } = req.body;

	try {
		const stmt = DB.prepare(`
			DELETE FROM Pratos WHERE id = ?	
		`);

		const result = stmt.run(parseInt(id));
		return res.status(200).json({ changes: result.changes });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.get("/api/me", auth, (req, res) => {
	const user = DB.prepare(`\
		SELECT id, email FROM Usuarios
		WHERE id = ?
	`).get(req.user.id);

	res.json({ ok: true, user });
})

function auth(req, res, next) {
	const header = req.headers.authorization;

	if (!header) {
		console.error("Token não fornecido");
		return res.status(401).json({ error: "Token não fornecido" })
	};

	const [, token] = header.split(" ");

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload;
		next();
	} catch (error) {
		return res.status(401).json({ error: "Token inválido" });
	}
}

// Run app on PORT
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
