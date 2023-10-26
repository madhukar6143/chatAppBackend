import express from "express";
import dotenv from "dotenv";
const app = express();
import mongoose from "mongoose";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
const server = createServer(app);
import authRoute from "./routes/auth.js";
import chatRoute from "./routes/chat.js";
import messageRoute from "./routes/message.js";
import authenticateUser from "./middleware/auth.js";
import OpenAIApi from "openai";

// Initialize the OpenAI API with your API key
const openai = new OpenAIApi({
  apiKey: "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",
});
const dbConnectionString =
  "mongodb+srv://madhu:madhu@clusterbackend.szevd.mongodb.net/chatdb?retryWrites=true&w=majority";
dotenv.config();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
  .connect(dbConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Hey!! This is a sign that the server is running");
});

app.use("/auth", authRoute);
app.use("/chat", authenticateUser, chatRoute);
// app.use("/chat", chatRoute);
// app.use("/message", messageRoute);
app.use("/message", authenticateUser, messageRoute);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected "+ socket.id)
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log(userData._id + " connected")
    socket.emit("connected");
  });
  

  socket.on("join-chat", (room) => {
    console.log(room+" joined")
    socket.join(room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop-typing", (room) => socket.in(room).emit("stop-typing"));

  socket.on("new-message", async (newMessageReceived) => {
    let chat = newMessageReceived.chat;
  
    if (!chat.users) return console.log("chat.users not defined");
  
    chat.users.forEach(async (user) => {
      if (user._id === newMessageReceived.sender._id) return;
  
      try {
        // Specify the GPT-3 model (e.g., "text-davinci-002") in the request
        const correctedMessage = await openai.completions.create({
          model: "text-davinci-002", // Specify the model here
          prompt: `Correct the grammar of the following message: "${newMessageReceived.message}"`,
          max_tokens: 50,
        });
  
        const correctedText = correctedMessage.choices[0].text;
  
        // Send the corrected message back to the sender for confirmation
        socket.in(newMessageReceived.sender._id).emit("message-corrected", {
          originalMessage: newMessageReceived.message,
          correctedMessage: correctedText,
        });
      } catch (error) {
        console.error("Error correcting grammar:", error);
      }
    });
  });

  socket.off("setup", () => {
    console.log("Socket disconnected")
    socket.leave(userData._id);
  });
});

server.listen(PORT, () => console.log("Server is running on port", PORT));
