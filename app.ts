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

// Health 체크 엔드포인트 (모든 미들웨어보다 먼저 설정)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 연결확인용
app.get("/", (req, res) => {
  res.status(200).json({
    message: "서버 연결됨",
    status: "OK",
  });
});

app.use(express.json({ limit: "50mb" })); // JSON 파싱 미들웨어
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// cors 설정
app.use(cors(corsOptions));

// 라우터 연결
app.use("/api/posts", postsRouter);
app.use("/api/comment", commentRouter);
app.use("/api/temp-posts", temporaryRouter);
app.use("/api/quiz", quizRouter);

app.listen(port, () => {
  console.log(`서버 ${port}포트 시작됨`);
});
