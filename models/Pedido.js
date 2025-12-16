import mongoose from "mongoose";

const ItemPedidoSchema = new mongoose.Schema({
	prato: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Prato",
		required: true
	},
	quantidade: {
		type: Number,
		required: true,
		min: 1
	}
});

const PedidoSchema = new mongoose.Schema({
	usuario: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Usuario",
		required: true
	},
	itens: [ItemPedidoSchema],
	valor_total: {
		type: Number,
		required: true
	}
}, { timestamps: true });

export default mongoose.model("Pedido", PedidoSchema);