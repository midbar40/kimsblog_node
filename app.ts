import express from "express";
import cors from "cors";
import corsOptions from "./config/corsOptions";
import dotenv from "dotenv";

// 라우터 import
import postsRouter from "./routes/post";
import commentRouter from "./routes/comment";
import temporaryRouter from "./routes/temporary";
import quizRouter from "./routes/quiz";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: "50mb" })); // JSON 파싱 미들웨어
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// cors 설정
app.use(cors(corsOptions));

// 라우터 연결
app.use("/api/posts", postsRouter);
app.use("/api/comment", commentRouter);
app.use("/api/temp-posts", temporaryRouter);
app.use("/api/quiz", quizRouter);

// 연결 확인용
app.get("/", (req, res) => {
  res.send("postman 하이!");
});

app.listen(port, () => {
  console.log(`서버 ${port}포트 시작됨`);
});
