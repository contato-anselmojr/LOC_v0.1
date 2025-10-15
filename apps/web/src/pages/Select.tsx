import { useEffect, useState } from "react";

type Pickable = { id: string; name: string; hp: number };
const CATALOG: Pickable[] = [
  { id: "Grom", name: "Grom", hp: 10000 },
  { id: "Lyra", name: "Lyra", hp: 8000 },
  { id: "Kael", name: "Kael", hp: 7000 },
  { id: "Mira", name: "Mira", hp: 7500 },
  { id: "Ryn", name: "Ryn", hp: 6000 },
  { id: "Shen", name: "Shen", hp: 11000 },
  { id: "Vex", name: "Vex", hp: 6500 },
];

export default function SelectCharacters() {
  const [pick, setPick] = useState<string[]>(() => JSON.parse(sessionStorage.getItem("team3") || "[]"));

  function toggle(id: string) {
    setPick(p => {
      if (p.includes(id)) return p.filter(x=>x!==id);
      if (p.length >= 3) return p; // limite 3
      return [...p, id];
    });
  }

  useEffect(() => {
    sessionStorage.setItem("team3", JSON.stringify(pick));
  }, [pick]);

  return (
    <div>
      <h3>Seleção de Personagens (escolha 3)</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12, maxWidth:720 }}>
        {CATALOG.map(c => (
          <button key={c.id}
            onClick={()=>toggle(c.id)}
            style={{
              padding:12, border:"1px solid #444", borderRadius:8,
              background: pick.includes(c.id) ? "#2a6" : "#222", color:"#fff", textAlign:"left"
            }}>
            <div style={{ fontWeight:700 }}>{c.name}</div>
            <div>HP: {c.hp}</div>
            <div>{pick.includes(c.id) ? "Selecionado" : "Clique para selecionar"}</div>
          </button>
        ))}
      </div>
      <p style={{ marginTop:12 }}>Selecionados: {pick.join(", ") || "nenhum"}</p>
    </div>
  );
}
