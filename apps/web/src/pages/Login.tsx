import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [out, setOut] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data?.token) localStorage.setItem("token", data.token);
      setOut(data);
    } catch (err) {
      setOut({ error: String(err) });
    }
  }

  return (
    <div>
      <h3>Login</h3>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">Entrar</button>
      </form>
      <pre style={{ background:"#111", color:"#0f0", padding:8, marginTop:12 }}>{out ? JSON.stringify(out, null, 2) : "..."}</pre>
    </div>
  );
}
