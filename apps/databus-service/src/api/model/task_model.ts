import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "RETRYING";
  assignedWorker?: string;
  retries: number;
  maxRetries: number;
  result?: any;
  error?: string;
  nextRetryAt?: Date;
  backoffDelay?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "RETRYING"],
      default: "PENDING",
    },
    assignedWorker: { type: String },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 5 },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    nextRetryAt: { type: Date },
    backoffDelay: { type: Number, default: 1000 }, // Initial delay in milliseconds
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>("Task", TaskSchema);
