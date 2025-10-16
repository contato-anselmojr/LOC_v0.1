import express from "express";
import cors from "cors";
import battleRouter from "./routes/battle";

const app = express();
app.use(cors());
app.use(express.json());

// --- rotas principais ---
app.use("/api", battleRouter); // ✅ Aqui conecta suas rotas

// rota de teste
app.get("/", (_, res) => res.send("✅ Servidor Arena Multiverso ativo"));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`[loc-server] rodando na porta ${PORT}`);
});
