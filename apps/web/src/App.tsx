import { Link, Route, Routes, useNavigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SelectCharacters from "./pages/Select";
import Battle from "./pages/Battle";

export default function App() {
  const nav = useNavigate();
  const token = localStorage.getItem("token");
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ marginRight: "auto" }}>LOC — Demo 3x3</h2>
        <Link to="/">Home</Link>
        <Link to="/register">Cadastro</Link>
        <Link to="/login">Login</Link>
        <Link to="/select">Seleção</Link>
        <Link to="/battle">Batalha</Link>
        {token && (
          <button onClick={() => { localStorage.removeItem("token"); nav("/"); }} style={{ marginLeft: 8 }}>
            Sair
          </button>
        )}
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/select" element={<SelectCharacters />} />
        <Route path="/battle" element={<Battle />} />
      </Routes>
    </div>
  );
}
function Home() {
  return (
    <div>
      <p>Bem-vindo. Use o menu para testar: Cadastro, Login, Seleção de 3 personagens e a tela de Batalha 3x3 (simulada).</p>
      <small>Backend esperado: http://localhost:3001</small>
    </div>
  );
}
