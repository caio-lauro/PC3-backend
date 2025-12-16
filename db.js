import mongoose from "mongoose";
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
	.then(() => console.log("MongoDB conectado"))
	.catch(err => console.error("Erro ao conectar no MongoDB:", err));

export default mongoose;