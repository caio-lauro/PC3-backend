import mongoose from "mongoose";

const PratoSchema = new mongoose.Schema({
	nome: { type: String, required: true },
	preco: { type: Number, required: true },
	categoria: { type: String, required: true },
	ingredientes: [{ type: String, required: true }]
}, { timestamps: true });

export default mongoose.model("Prato", PratoSchema);