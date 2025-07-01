import express from "express";
import cors from "cors";
import corsOptions from "./config/corsOptions";
import dotenv from "dotenv";

// 라우터 import 
import postsRouter from './routes/post'

dotenv.config();

const app = express();
const port = 3000;

// cors 설정
app.use(cors(corsOptions));

// 라우터 연결
app.use('/api/posts', postsRouter)


// 연결 확인용  
app.get("/", (req, res) => {
  res.send("postman 하이!");
});

app.listen(port, () => {
  console.log(`서버 ${port}포트 시작됨`);
});
