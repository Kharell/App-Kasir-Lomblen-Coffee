import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { MenuCategory } from "@/types";

/**
 * Skema Menu.
 * `price` disimpan sebagai Number (miliaran, bukan sen) agar
 * kalkulasi floating-point tetap presisi untuk nilai uang dalam rupiah.
 */
const MenuSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: {
      type: String,
      enum: ["kopi", "non-kopi", "ringan", "berat"],
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true, index: true },
    preparationMinutes: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true }
);

export type MenuDocument = InferSchemaType<typeof MenuSchema> & { _id: mongoose.Types.ObjectId };

export const MenuModel =
  (mongoose.models.Menu as mongoose.Model<MenuDocument>) ??
  mongoose.model<MenuDocument>("Menu", MenuSchema);

export type { MenuCategory };