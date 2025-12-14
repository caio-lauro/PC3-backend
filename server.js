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

// TODO

// Run app on PORT
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
