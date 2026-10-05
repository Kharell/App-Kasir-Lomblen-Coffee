import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CartLineSchema = new Schema(
  {
    menuId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    note: { type: String },
  },
  { _id: false }
);

const TotalsSchema = new Schema(
  {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const TransactionSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, trim: true },
    tableNo: { type: String, trim: true, index: true },
    lines: { type: [CartLineSchema], required: true },
    totals: { type: TotalsSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "qris", "ewallet", "va"],
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "paid", "void"],
      default: "open",
      index: true,
    },
    paidAmount: { type: Number },
    changeAmount: { type: Number },
    cashierId: { type: String, required: true, index: true },
    cashierName: { type: String, required: true },
    note: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

// Laporan harian: filter per tanggal + kasir + metode pembayaran.
TransactionSchema.index({ createdAt: -1, status: 1 });

export type TransactionDocument = InferSchemaType<typeof TransactionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TransactionModel =
  (mongoose.models.Transaction as mongoose.Model<TransactionDocument>) ??
  mongoose.model<TransactionDocument>("Transaction", TransactionSchema);