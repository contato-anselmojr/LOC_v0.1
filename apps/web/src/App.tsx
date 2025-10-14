import React, { useMemo, useState } from "react";
import { RuleEngine, type BattleState, type ActiveSkill, emptyEnergy } from "@arena/engine";

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [state, setState] = useState<BattleState | null>(null);
  const engine = useMemo(()=> new RuleEngine(777), []);

  function setupAndSimulate() {
    const skillsA: ActiveSkill[] = [
      { id:"atk_magico", name:"Raio", cost:{ AZUL:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] },
      { id:"escudo", name:"Barreira", cost:{ VERDE:1 }, cooldown:1, target:"SELF", effects:[{ kind:"ESCUDO", value:250 }] },
      { id:"controle", name:"Atordoar", cost:{ BRANCO:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"STUN", duration:1 }] },
      { id:"util", name:"Marca", cost:{ PRETA:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"MARCACAO", duration:2 }] }
    ];
    const skillsB: ActiveSkill[] = [
      { id:"golpe", name:"Golpe", cost:{ VERMELHO:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] },
      { id:"guarda", name:"Guarda", cost:{ VERDE:1 }, cooldown:1, target:"SELF", effects:[{ kind:"ESCUDO", value:300 }] },
      { id:"provocar", name:"Provocar", cost:{ BRANCO:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"SILENCE", duration:1 }] },
      { id:"marreta", name:"Marreta", cost:{ PRETA:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] }
    ];
    const toRuntime = (id:string, hp:number) => ({ id, hp, shield:0, cooldowns:{}, effects:[] as any[] });

    const s: BattleState = {
      turnNumber: 0,
      activeTeamId: "A",
      teams: {
        A: { id:"A", characters:[toRuntime("A1",900), toRuntime("A2",1000), toRuntime("A3",1000)], items: [], energy: emptyEnergy() },
        B: { id:"B", characters:[toRuntime("B1",1300), toRuntime("B2",1200), toRuntime("B3",1200)], items: [], energy: emptyEnergy() }
      },
      settings: { turnDurationSec:60, maxActionsPerTurn:3, maxPerCharacterPerTurn:1 }
    };

    const lookup: Record<string, ActiveSkill> = Object.fromEntries([...skillsA, ...skillsB].map(s=>[s.id, s]));
    engine.startMatch(s);
    engine.startTurn(s);
    engine.convertToBlack(s, "AZUL");
    engine.resolveQueue(s, [{ actorTeam:"A", actorId:"A1", skillId:"atk_magico", target:{ team:"B" } }], (id)=>lookup[id]);

    setState({ ...s });
    setLog(["Match start: +1 energia para A","Start turn A: +3 energias aleatórias","Conversão: 1 base -> PRETA","A1 usa Raio (250) em B"]);
  }

  return (
    <div style={{ fontFamily:"system-ui, sans-serif", padding:16, lineHeight:1.4 }}>
      <h1 style={{ marginBottom:8 }}>Arena Multiverso — MVP (web)</h1>
      <p>Demo mínima: simular início de partida e 1 ação usando o <code>@arena/engine</code>.</p>
      <button onClick={setupAndSimulate} style={{ padding:"8px 12px", borderRadius:12, border:"1px solid #ccc", cursor:"pointer" }}>
        Setup & Simular Turno A
      </button>
      {state && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:16 }}>
          <div><h3>Time A — Energia</h3><pre>{JSON.stringify(state.teams.A.energy, null, 2)}</pre></div>
          <div><h3>B1 — HP após ataque</h3><pre>{state.teams.B.characters[0].hp}</pre></div>
        </div>
      )}
      {log.length>0 && (<div style={{ marginTop:16 }}><h3>Log</h3><ul>{log.map((l,i)=><li key={i}>{l}</li>)}</ul></div>)}
    </div>
  );
}
