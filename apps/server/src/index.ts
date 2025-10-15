import express from "express";
import cors from "cors";
import battleRouter from "./routes/battle";

const app = express();
app.use(cors());
app.use(express.json());

// Rotas principais
app.use("/api", battleRouter);

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`� Servidor rodando em http://localhost:${PORT}`);
});
