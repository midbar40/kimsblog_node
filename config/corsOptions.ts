const corsOptions = {
  origin: ["http://localhost:5173", "https://kimsblog.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

export default corsOptions;
