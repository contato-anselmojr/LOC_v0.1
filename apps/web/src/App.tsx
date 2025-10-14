import React, { useMemo, useState } from "react"
import { RuleEngine, type BattleState, type ActiveSkill, emptyEnergy } from "@arena/engine"

const skillsA: ActiveSkill[] = [
  { id:"atk_magico", name:"Raio",   cost:{ AZUL:1 },    cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] },
  { id:"escudo",     name:"Barreira", cost:{ VERDE:1 }, cooldown:1, target:"SELF",  effects:[{ kind:"ESCUDO", value:250 }] },
  { id:"controle",   name:"Atordoar", cost:{ BRANCO:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"STUN", duration:1 }] },
  { id:"util",       name:"Marca",    cost:{ PRETA:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"MARCACAO", duration:2 }] },
]
const skillsB: ActiveSkill[] = [
  { id:"golpe",   name:"Golpe",   cost:{ VERMELHO:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] },
  { id:"guarda",  name:"Guarda",  cost:{ VERDE:1 },    cooldown:1, target:"SELF",  effects:[{ kind:"ESCUDO", value:300 }] },
  { id:"provocar",name:"Provocar",cost:{ BRANCO:1 },   cooldown:1, target:"ENEMY", effects:[{ kind:"SILENCE", duration:1 }] },
  { id:"marreta", name:"Marreta", cost:{ PRETA:1 },    cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] },
]
const lookup: Record<string, ActiveSkill> = Object.fromEntries([...skillsA, ...skillsB].map(s => [s.id, s]))

type TeamId = "A"|"B"

export default function App() {
  const engine = useMemo(()=> new RuleEngine(777), [])
  const [state, setState] = useState<BattleState | null>(null)
  const [log, setLog] = useState<string[]>([])

  function toRuntime(id:string, hp:number){ return { id, hp, shield:0, cooldowns:{}, effects:[] as any[] } }

  function setupAndFirstAction(){
    const s: BattleState = {
      turnNumber: 0,
      activeTeamId: "A",
      teams: {
        A: { id:"A", characters:[toRuntime("A1",900), toRuntime("A2",1000), toRuntime("A3",1000)], items: [], energy: emptyEnergy() },
        B: { id:"B", characters:[toRuntime("B1",1300), toRuntime("B2",1200), toRuntime("B3",1200)], items: [], energy: emptyEnergy() },
      },
      settings: { turnDurationSec:60, maxActionsPerTurn:3, maxPerCharacterPerTurn:1 },
    }
    engine.startMatch(s)
    engine.startTurn(s)
    // tentativa de conversão para PRETA (a partir de AZUL se houver)
    engine.convertToBlack(s as any, "AZUL" as any)
    // A1 usa Raio em B (auto target vivo)
    engine.resolveQueue(
      s,
      [{ actorTeam:"A", actorId:"A1", skillId:"atk_magico", target:{ team:"B" } }],
      (id)=>lookup[id]
    )
    setState({ ...s })
    setLog([
      "Match start: +1 energia para time A",
      "Start turn A: +3 energias aleatórias",
      "Conversão: 1 base -> PRETA (se havia AZUL)",
      "A1 usa Raio (250) em B",
    ])
  }

  function nextTurn(){
    if(!state) return
    const s = { ...state }
    engine.endTurn(s)
    engine.startTurn(s)
    setState({ ...s })
    setLog(prev => [...prev, `Próximo turno: agora é o time ${s.activeTeamId}`])
  }

  function act(team:TeamId, actorId:string, skillId:string, targetTeam?:TeamId){
    if(!state) return
    const s = { ...state }
    const target = { team: targetTeam ?? (team==="A" ? "B" : "A") }
    engine.resolveQueue(s, [{ actorTeam:team, actorId, skillId, target }], id=>lookup[id])
    setState({ ...s })
    const skillName = lookup[skillId]?.name ?? skillId
    setLog(prev => [...prev, `${team}:${actorId} usa ${skillName}`])
  }

  function energyBlock(label:string, pool:any){
    return (
      <div style={{ border:"1px solid #ddd", borderRadius:12, padding:12 }}>
        <h3 style={{ marginTop:0 }}>{label}</h3>
        <pre style={{ margin:0 }}>{JSON.stringify(pool, null, 2)}</pre>
      </div>
    )
  }

  const hpA = state?.teams.A.characters.map(c=>`${c.id}:${c.hp}(+${c.shield} esc)`).join("  ") ?? "-"
  const hpB = state?.teams.B.characters.map(c=>`${c.id}:${c.hp}(+${c.shield} esc)`).join("  ") ?? "-"

  return (
    <div style={{ fontFamily:"system-ui, sans-serif", padding:16, lineHeight:1.45 }}>
      <h1 style={{ marginBottom:8 }}>Arena Multiverso — MVP (web)</h1>
      <p>Demo: simular início de partida, avançar turnos e acionar golpes rápidos.</p>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        <button onClick={setupAndFirstAction} style={btn}>Setup & Primeira Ação (A1: Raio)</button>
        <button onClick={nextTurn} style={btn}>Próximo Turno</button>
        <button onClick={()=>act("A","A1","atk_magico","B")} style={btn}>A1: Raio</button>
        <button onClick={()=>act("B","B1","golpe","A")} style={btn}>B1: Golpe</button>
      </div>

      {state && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
          {energyBlock("Time A — Energia", state.teams.A.energy)}
          {energyBlock("Time B — Energia", state.teams.B.energy)}
          <div style={{ gridColumn:"1 / span 2", border:"1px dashed #ccc", borderRadius:12, padding:12 }}>
            <div><strong>HP A:</strong> {hpA}</div>
            <div><strong>HP B:</strong> {hpB}</div>
          </div>
        </div>
      )}

      {log.length>0 && (
        <div style={{ marginTop:16 }}>
          <h3>Log</h3>
          <ul>
            {log.map((l,i)=><li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

const btn: React.CSSProperties = {
  padding:"8px 12px",
  borderRadius:12,
  border:"1px solid #ccc",
  cursor:"pointer",
  background:"linear-gradient(180deg, #fff, #f6f6f6)"
}
