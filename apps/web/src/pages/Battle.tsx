import { useEffect, useState } from "react";

export default function Battle() {
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const team3 = JSON.parse(sessionStorage.getItem("team3") || "[]");

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/battle/test");
      const data = await res.json();
      setOut(data);
    } catch (e) {
      setOut({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); }, []);

  return (
    <div>
      <h3>Batalha 3x3 (demo)</h3>
      <p>Seu time: {team3.length ? team3.join(", ") : "não selecionado (use 'Seleção')"} </p>
      <button onClick={run} disabled={loading}>
        {loading ? "Executando..." : "Simular Passar Turno"}
      </button>
      <pre style={{ background:"#111", color:"#0f0", padding:8, marginTop:12 }}>
        {out ? JSON.stringify(out, null, 2) : "Aguardando..."}
      </pre>
    </div>
  );
}
