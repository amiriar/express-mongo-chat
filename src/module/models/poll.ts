import mongoose, { Schema, model, Document, ObjectId } from "mongoose";

const optionSchema = new Schema(
  {
    optionText: { type: String, required: true },
    voteCount: { type: Number, default: 0 },
  },
  {
    _id: false, // Disabling _id for each option to keep it simple
  }
);

const pollSchema = new Schema<IPoll>(
  {
    sender: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participants: {
      type: [mongoose.Types.ObjectId],
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, minlength: 3, maxlength: 255 },
    description: { type: String, maxlength: 1024 },
    options: { type: [optionSchema], required: true },
    totalVotes: { type: Number, default: 0 },
    votes: {
      type: Map, // Mapping of participant id to their selected option(s)
      of: { type: [String], required: true },
      default: {},
    },
    status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "draft",
    },
    isAnonymous: { type: Boolean, default: false },
    isMultiSelect: { type: Boolean, default: false },
    expiresAt: { type: Date },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

interface IPoll extends Document {
  sender: ObjectId | string;
  participants: Array<ObjectId | string>;
  title: string;
  description?: string;
  options: Array<{
    optionText: string;
    voteCount: number;
  }>;
  totalVotes: number;
  votes: Map<string, Array<string>>; // Maps participant ID to their selected option(s)
  status: "draft" | "active" | "closed";
  isAnonymous: boolean;
  isMultiSelect: boolean;
  expiresAt?: Date;
  visibility: "public" | "private";
  createdBy: ObjectId | string;
  updatedBy?: ObjectId | string;
}

const PollModel = model<IPoll>("poll", pollSchema);

export { PollModel, IPoll };
