import React, { useMemo, useRef, useState, useEffect } from "react"
import { RuleEngine, type BattleState, type ActiveSkill, emptyEnergy } from "@arena/engine"

const skillsA: ActiveSkill[] = [
  { id:"atk_magico", name:"Raio",     cost:{ AZUL:1 },    cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] },
  { id:"escudo",     name:"Barreira", cost:{ VERDE:1 },   cooldown:1, target:"SELF",  effects:[{ kind:"ESCUDO", value:250 }] },
  { id:"controle",   name:"Atordoar", cost:{ BRANCO:1 },  cooldown:1, target:"ENEMY", effects:[{ kind:"STUN", duration:1 }] },
  { id:"util",       name:"Marca",    cost:{ PRETA:1 },   cooldown:1, target:"ENEMY", effects:[{ kind:"MARCACAO", duration:2 }] },
]
const skillsB: ActiveSkill[] = [
  { id:"golpe",    name:"Golpe",     cost:{ VERMELHO:1 }, cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] },
  { id:"guarda",   name:"Guarda",    cost:{ VERDE:1 },    cooldown:1, target:"SELF",  effects:[{ kind:"ESCUDO", value:300 }] },
  { id:"provocar", name:"Provocar",  cost:{ BRANCO:1 },   cooldown:1, target:"ENEMY", effects:[{ kind:"SILENCE", duration:1 }] },
  { id:"marreta",  name:"Marreta",   cost:{ PRETA:1 },    cooldown:1, target:"ENEMY", effects:[{ kind:"DANO", value:250 }] },
]
const lookup: Record<string, ActiveSkill> = Object.fromEntries([...skillsA, ...skillsB].map(s => [s.id, s]))

type TeamId = "A"|"B"

export default function App() {
  const engine = useMemo(()=> new RuleEngine(777), [])
  const [state, setState] = useState<BattleState | null>(null)

  // Console/log
  const [showConsole, setShowConsole] = useState<boolean>(true)
  const [log, setLog] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement | null>(null)
  function time(){ return new Date().toLocaleTimeString() }
  function addLog(line: string){
    setLog(prev => [...prev, `[${time()}] ${line}`])
  }
  useEffect(() => {
    // auto-scroll no console
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

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
    engine.startMatch(s);               addLog("startMatch(): +1 energia time A")
    engine.startTurn(s);                addLog("startTurn(): +3 energias aleatórias para A")
    engine.convertToBlack(s as any, "AZUL" as any) && addLog("convertToBlack(AZUL→PRETA)")
    engine.resolveQueue(
      s,
      [{ actorTeam:"A", actorId:"A1", skillId:"atk_magico", target:{ team:"B" } }],
      (id)=>lookup[id]
    );                                  addLog("resolveQueue(): A1 usa Raio (250) em B")
    setState({ ...s })
  }

  function nextTurn(){
    if(!state) return
    const s = { ...state }
    engine.endTurn(s); addLog(`endTurn(): fim do turno do time ${state.activeTeamId}`)
    engine.startTurn(s); addLog(`startTurn(): início do turno do time ${s.activeTeamId} (+3 energias)`)
    setState({ ...s })
  }

  function act(team:TeamId, actorId:string, skillId:string, targetTeam?:TeamId){
    if(!state) return
    const s = { ...state }
    const target = { team: targetTeam ?? (team==="A" ? "B" : "A") }
    const skillName = lookup[skillId]?.name ?? skillId
    addLog(`resolveQueue(): ${team}:${actorId} tenta usar ${skillName}`)
    engine.resolveQueue(s, [{ actorTeam:team, actorId, skillId, target }], id=>lookup[id])
    setState({ ...s })
    addLog(`${team}:${actorId} usou ${skillName}`)
  }

  function energyBlock(label:string, pool:any){
    return (
      <div style={{ border:"1px solid #ddd", borderRadius:12, padding:12, background:"#fff", color:"#111" }}>
        <h3 style={{ marginTop:0 }}>{label}</h3>
        <pre style={{ margin:0 }}>{JSON.stringify(pool, null, 2)}</pre>
      </div>
    )
  }

  const hpA = state?.teams.A.characters.map(c=>`${c.id}:${c.hp}(+${c.shield} esc)`).join("  ") ?? "-"
  const hpB = state?.teams.B.characters.map(c=>`${c.id}:${c.hp}(+${c.shield} esc)`).join("  ") ?? "-"

  return (
    <div style={{ fontFamily:"system-ui, sans-serif", padding:16, lineHeight:1.45, color:"#111" }}>
      <h1 style={{ marginBottom:8 }}>Arena Multiverso — MVP (web)</h1>
      <p>Demo: turnos, energia aleatória e ações rápidas — com console de logs.</p>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        <button onClick={setupAndFirstAction} style={btn}>Setup & Primeira Ação (A1: Raio)</button>
        <button onClick={nextTurn} style={btn}>Próximo Turno</button>
        <button onClick={()=>act("A","A1","atk_magico","B")} style={btn}>A1: Raio</button>
        <button onClick={()=>act("B","B1","golpe","A")} style={btn}>B1: Golpe</button>
        <button onClick={()=>setShowConsole(s=>!s)} style={btnAlt}>{showConsole ? "Ocultar Console" : "Mostrar Console"}</button>
        <button onClick={()=>setLog([])} style={btnAlt}>Limpar Console</button>
      </div>

      {state && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
          {energyBlock("Time A — Energia", state.teams.A.energy)}
          {energyBlock("Time B — Energia", state.teams.B.energy)}
          <div style={{ gridColumn:"1 / span 2", border:"1px dashed #ccc", borderRadius:12, padding:12, background:"#fff" }}>
            <div><strong>HP A:</strong> {hpA}</div>
            <div><strong>HP B:</strong> {hpB}</div>
          </div>
        </div>
      )}

      {showConsole && (
        <div style={consoleWrap}>
          <div style={consoleHeader}>Console</div>
          <div ref={logRef} style={consoleBody}>
            {log.length === 0 ? <div style={{ opacity:.6 }}>— sem eventos ainda —</div> :
              log.map((l,i)=><div key={i} style={{ whiteSpace:"pre-wrap" }}>{l}</div>)
            }
          </div>
        </div>
      )}
    </div>
  )
}

const btn: React.CSSProperties = {
  padding:"9px 14px",
  borderRadius:12,
  border:"1px solid #bdbdbd",
  cursor:"pointer",
  background:"linear-gradient(180deg, #ffffff, #f3f3f3)",
  color:"#111",
  fontWeight:600
}
const btnAlt: React.CSSProperties = {
  ...btn,
  background:"linear-gradient(180deg, #f9fafb, #ececec)"
}
const consoleWrap: React.CSSProperties = {
  marginTop:16,
  border:"1px solid #d1d5db",
  borderRadius:12,
  overflow:"hidden",
  background:"#111",
  color:"#e5e7eb",
  boxShadow:"0 1px 3px rgba(0,0,0,.1)"
}
const consoleHeader: React.CSSProperties = {
  padding:"8px 12px",
  fontWeight:700,
  background:"#0b0b0b",
  borderBottom:"1px solid #222"
}
const consoleBody: React.CSSProperties = {
  maxHeight:220,
  overflow:"auto",
  padding:"10px 12px",
  fontFamily:"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize:13,
  lineHeight:1.5
}
