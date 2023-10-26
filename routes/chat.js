import express from "express";
const router = express.Router();

import {
  getChat,
  getChats
} from "../controllers/chat.js";

router.route("/").post(getChat).get(getChats);

export default router;