import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { Role } from "@/types";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["cashier", "manager", "admin", "waiter"],
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", UserSchema);

/** Panduan awal sebelum hashing — JANGAN pernah simpan bentuk ini. */
export type UserCredentials = Omit<UserDocument, "passwordHash">;