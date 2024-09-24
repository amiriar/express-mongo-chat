import mongoose, { Schema, model, Document, ObjectId } from "mongoose";

const feedbackSchema = new Schema<IFeedback>(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, minlength: 10, maxlength: 2000 },
    rating: { type: Number, min: 1, max: 5, required: false },
    category: {
      type: String,
      enum: ["bug", "feature_request", "general", "other"],
      default: "general",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

interface IFeedback extends Document {
  user: ObjectId | string;
  message: string;
  rating?: number;
  category: "bug" | "feature_request" | "general" | "other";
  createdAt: Date;
}

const FeedbackModel = model<IFeedback>("feedback", feedbackSchema);

export { FeedbackModel, IFeedback };
