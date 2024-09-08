import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URL as string)
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err: any) => {
    console.log(err?.message ?? "Failed DB connection");
  });
