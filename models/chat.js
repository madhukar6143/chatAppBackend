import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    users: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
    }
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);