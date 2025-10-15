import React, { useState } from "react";

interface Fighter { name: string; hp: number; maxHp: number; dmg: number; }
const fighters: Fighter[] = [
  { name: "Aria", hp: 100, maxHp: 100, dmg: 18 },
  { name: "Brom", hp: 120, maxHp: 120, dmg: 14 },
  { name: "Cyra", hp: 90, maxHp: 90, dmg: 22 },
  { name: "Dax", hp: 110, maxHp: 110, dmg: 16 },
  { name: "Edda", hp: 95, maxHp: 95, dmg: 20 },
  { name: "Faye", hp: 85, maxHp: 85, dmg: 24 },
];

export default function App() {
  const [a, setA] = useState(fighters[0]);
  const [b, setB] = useState(fighters[1]);

  const attack = () => {
    const newHp = Math.max(b.hp - a.dmg, 0);
    setB({ ...b, hp: newHp });
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>⚔️ Sistema de Batalha LOC</h1>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "2rem" }}>
        {[a, b].map((f, i) => (
          <div key={i}>
            <h2>{f.name}</h2>
            <div style={{ width: "160px", background: "#ddd", border: "1px solid #aaa" }}>
              <div style={{
                width: `${(f.hp / f.maxHp) * 100}%`,
                height: "10px",
                background: i === 0 ? "limegreen" : "crimson"
              }} />
            </div>
            <p>{f.hp}/{f.maxHp} HP</p>
          </div>
        ))}
      </div>
      <button onClick={attack} style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}>Atacar ⚡</button>
    </div>
  );
}
