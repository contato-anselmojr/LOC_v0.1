import { Link, Route, Routes, useNavigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SelectCharacters from "./pages/Select";
import Battle from "./pages/Battle";

export default function App() {
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans px-6 py-4">
      <header className="flex gap-4 items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="mr-auto text-xl font-semibold">LOC — Demo 3×3</h2>
        <nav className="flex gap-3">
          <Link to="/" className="hover:text-blue-400">Home</Link>
          <Link to="/register" className="hover:text-blue-400">Cadastro</Link>
          <Link to="/login" className="hover:text-blue-400">Login</Link>
          <Link to="/select" className="hover:text-blue-400">Seleção</Link>
          <Link to="/battle" className="hover:text-blue-400">Batalha</Link>
          {token && (
            <button
              onClick={() => {
                localStorage.removeItem("token");
                nav("/");
              }}
              className="ml-3 text-sm text-red-400 hover:text-red-300"
            >
              Sair
            </button>
          )}
        </nav>
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
    <div className="text-gray-300 leading-relaxed">
      <p>
        Bem-vindo. Use o menu para testar: Cadastro, Login, Seleção de 3 personagens e a tela de Batalha 3×3 (simulada).
      </p>
      <small className="opacity-70">Backend esperado: http://localhost:3001</small>
    </div>
  );
}
