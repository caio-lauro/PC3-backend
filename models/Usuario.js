import mongoose from "mongoose";

const UsuarioSchema = new mongoose.Schema({
	nome: { type: String, required: true },
	telefone: { type: String, required: true },
	CEP: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	senha: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Usuario", UsuarioSchema);