import 'dotenv/config';
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import "./db.js";
import Usuario from "./models/Usuario.js";
import Prato from "./models/Prato.js";
import Pedido from "./models/Pedido.js";

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

app.post("/api/cadastrar", async (req, res) => {
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
		const isRegistered = await Usuario.findOne({ email });
		if (isRegistered) {
			return res.status(400).json({ error: "E-mail já cadastrado." });
		}

		const hashedPassword = bcrypt.hashSync(password, SALT);

		const user = await Usuario.create({
			nome: name,
			telefone: phone,
			CEP: cep,
			email: email,
			senha: hashedPassword
		});

		return res.status(200).json({ id: user._id });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.post("/api/login", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: "Todos os campos devem ser preenchidos." });
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return res.status(400).json({ error: "E-mail inválido." });
	}

	try {
		const user = await Usuario.findOne({ email });

		if (!user) {
			return res.status(401).json({ error: "E-mail e/ou senha incorreto(s)." });
		}

		const correctPassword = bcrypt.compareSync(password, user.senha);

		if (!correctPassword) {
			return res.status(401).json({ error: "E-mail e/ou senha incorreto(s)." });
		}

		const token = jwt.sign(
			{ id: user._id },
			JWT_SECRET
		);

		return res.json({ token });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.get("/api/pratos", async (req, res) => {
	try {
		const pratos = await Prato.find().sort({ categoria: 1 });
		return res.status(200).json(pratos);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.post("/api/adicionar", async (req, res) => {
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

		const prato = await Prato.create({
			nome: name,
			preco: floatPrice,
			categoria: category,
			ingredientes: ingredient_array
		});

		return res.status(200).json({ id: prato._id });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.post("/api/remover", async (req, res) => {
	const { id } = req.body;

	try {
		const result = await Prato.deleteOne({ _id: id });
		return res.status(200).json({ changes: result.deletedCount });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro do servidor, tente novamente mais tarde." });
	}
});

app.get("/api/me", auth, async (req, res) => {
	const user = await Usuario.findById(req.user.id)
		.select("_id email");

	res.json({ ok: true, user });
});

app.post("/api/pedir", auth, async (req, res) => {
	try {
		const itens = req.body;

		if (!itens || itens.length === 0) {
			return res.status(400).json({ error: "Pedido vazio." });
		}

		let valor_total = 0;

		for (const item of itens) {
			if (item.quantidade <= 0) {
				return res.status(400).json({ error: "Quantidade inválida." });
			}

			const prato = await Prato.findById(item.prato);

			if (!prato) {
				return res.status(404).json({ error: "Prato não encontrado." });
			}

			valor_total += prato.preco * item.quantidade;
		}

		const pedido = await Pedido.create({
			usuario: req.user.id,
			itens,
			valor_total
		});

		return res.status(201).json(pedido);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Erro ao criar pedido." });
	}
});

app.get("/api/pedidos", auth, async (req, res) => {
	try {
		const pedidos = await Pedido.find({ usuario: req.user.id })
			.populate("itens.prato", "nome preco");

		return res.json(pedidos);
	} catch (err) {
		return res.status(500).json({ error: "Erro ao buscar pedidos." });
	}
});

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
