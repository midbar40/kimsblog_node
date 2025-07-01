import express from "express";
import cors from "cors";
import corsOptions from "./config/corsOptions";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("postman 하이!");
});

app.listen(port, () => {
  console.log(`서버 ${port}포트 시작됨`);
});
