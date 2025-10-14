import React, { useMemo, useRef, useState, useEffect } from "react"
import { RuleEngine, type BattleState, type ActiveSkill, emptyEnergy } from "@arena/engine"

type TeamId = "A"|"B"
type QA = { actorTeam: TeamId; actorId: string; skillId: string; target?: { team: TeamId; id?: string } }

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

export default function App() {
  const engine = useMemo(()=> new RuleEngine(777), [])
  const [state, setState]   = useState<BattleState | null>(null)
  const [queue, setQueue]   = useState<QA[]>([])
  const [log, setLog]       = useState<string[]>([])
  const [showConsole, setShowConsole] = useState<boolean>(true)
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(()=>{ if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [log])
  const t = () => new Date().toLocaleTimeString()
  const addLog = (m:string)=> setLog(prev=>[...prev, `[${t()}] ${m}`])

  const toRuntime = (id:string, hp:number) => ({ id, hp, shield:0, cooldowns:{}, effects:[] as any[] })

  function setupMatch(){
    // Estado inicial: +1 energia para o time ativo AO INICIAR A PARTIDA; NÃO soma +3 ainda.
    const s: BattleState = {
      turnNumber: 1,                 // turn 1 começa com A
      activeTeamId: "A",
      teams: {
        A: { id:"A", characters:[toRuntime("A1",900), toRuntime("A2",1000), toRuntime("A3",1000)], items: [], energy: emptyEnergy() },
        B: { id:"B", characters:[toRuntime("B1",1300), toRuntime("B2",1200), toRuntime("B3",1200)], items: [], energy: emptyEnergy() },
      },
      settings: { turnDurationSec:60, maxActionsPerTurn:3, maxPerCharacterPerTurn:1 },
    }
    engine.startMatch(s) // +1 energia aleatória somente para o time ativo (A)
    setState({ ...s })
    setQueue([])
    setLog([`startMatch(): +1 energia para o time ${s.activeTeamId}`])
  }

  function queueAction(actorTeam: TeamId, actorId: string, skillId: string){
    if(!state) return
    // só permite fila para o time do turno
    if (actorTeam !== state.activeTeamId) { addLog(`ignorado: não é o turno do time ${actorTeam}`); return }
    // aplica regra de no máximo 3 ações e 1 por personagem
    const byChar = new Map(queue.map(q=>[q.actorId,0]))
    for (const q of queue) byChar.set(q.actorId, (byChar.get(q.actorId)??0)+1)
    if (queue.length >= state.settings.maxActionsPerTurn) { addLog("fila cheia (3 ações)"); return }
    if ((byChar.get(actorId)??0) >= state.settings.maxPerCharacterPerTurn) { addLog(`limite: ${actorId} já tem ação no turno`); return }
    const targetTeam: TeamId = actorTeam==="A" ? "B" : "A"
    setQueue(prev => [...prev, { actorTeam, actorId, skillId, target:{ team: targetTeam } }])
    const skillName = lookup[skillId]?.name ?? skillId
    addLog(`fila += ${actorTeam}:${actorId} • ${skillName}`)
  }

  function convertToBlack(baseColor: "AZUL"|"VERMELHO"|"VERDE"|"BRANCO"){
    if(!state) return
    const s = { ...state }
    const ok = engine.convertToBlack(s as any, baseColor as any)
    if (ok) addLog(`convertToBlack(): 1 ${baseColor} → PRETA (não conta como ação)`)
    else addLog(`convertToBlack(): falhou (sem ${baseColor} disponível)`)
    setState({ ...s })
  }

  function confirmTurn(){
    if(!state) return
    const s = { ...state }
    // valida fila
    // @ts-ignore — engine.validateQueue retorna {ok, reason?}
    const v = engine.validateQueue(s, queue)
    if (!v.ok) { addLog(`ERRO: ${v.reason || "fila inválida"}`); return }
    // executa ações DA FILA
    engine.resolveQueue(s, queue, (id)=>lookup[id])
    addLog(`resolveQueue(): executadas ${queue.length} ação(ões) do time ${s.activeTeamId}`)
    // passa o turno
    engine.endTurn(s)
    addLog(`endTurn(): fim do turno do time ${state.activeTeamId}`)
    // início do novo turno — a partir do 2º turno global, ganha +3
    engine.startTurn(s)
    addLog(`startTurn(): início do turno do time ${s.activeTeamId} ${s.turnNumber>=2 ? "(+3 energias)" : ""}`)
    setQueue([])
    setState({ ...s })
  }

  function timeoutPass(){
    if(!state) return
    const s = { ...state }
    // descarta fila
    if (queue.length>0) addLog(`timeout: descartando ${queue.length} ação(ões) não confirmadas`)
    // passa o turno sem executar
    engine.endTurn(s)
    addLog(`endTurn(): timeout — turno passou do time ${state.activeTeamId}`)
    engine.startTurn(s)
    addLog(`startTurn(): início do turno do time ${s.activeTeamId} ${s.turnNumber>=2 ? "(+3 energias)" : ""}`)
    setQueue([])
    setState({ ...s })
  }

  const hpA = state?.teams.A.characters.map(c=>`${c.id}:${c.hp}(+${c.shield} esc)`).join("  ") ?? "-"
  const hpB = state?.teams.B.characters.map(c=>`${c.id}:${c.hp}(+${c.shield} esc)`).join("  ") ?? "-"
  const canActA = state?.activeTeamId === "A"
  const canActB = state?.activeTeamId === "B"

  return (
    <div style={{ fontFamily:"system-ui, sans-serif", padding:16, lineHeight:1.45, color:"#111" }}>
      <h1 style={{ marginBottom:8 }}>Arena Multiverso — MVP (web)</h1>
      <p>Fluxo correto: ações entram na <strong>fila</strong> e só executam ao <strong>Confirmar/Passar</strong>. Timeout descarta a fila.</p>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        <button onClick={setupMatch} style={btn}>Iniciar Partida</button>

        <button onClick={()=>queueAction("A","A1","atk_magico")} style={{...btn, opacity: canActA?1:.5}} disabled={!canActA}>Fila: A1 — Raio</button>
        <button onClick={()=>queueAction("B","B1","golpe")}      style={{...btn, opacity: canActB?1:.5}} disabled={!canActB}>Fila: B1 — Golpe</button>

        <button onClick={confirmTurn} style={{...btnPrimary}}>Confirmar / Passar</button>
        <button onClick={timeoutPass} style={btnAlt}>Simular Timeout (descarta & passa)</button>

        <button onClick={()=>convertToBlack("AZUL")}      style={btnAlt}>Conversão: AZUL→PRETA</button>
        <button onClick={()=>setShowConsole(s=>!s)} style={btnAlt}>{showConsole ? "Ocultar Console" : "Mostrar Console"}</button>
        <button onClick={()=>setLog([])} style={btnAlt}>Limpar Console</button>
      </div>

      {state && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
          <div style={card}>
            <h3 style={{ marginTop:0 }}>Time A — Energia</h3>
            <pre style={{ margin:0 }}>{JSON.stringify(state.teams.A.energy, null, 2)}</pre>
          </div>
          <div style={card}>
            <h3 style={{ marginTop:0 }}>Time B — Energia</h3>
            <pre style={{ margin:0 }}>{JSON.stringify(state.teams.B.energy, null, 2)}</pre>
          </div>
          <div style={{ gridColumn:"1 / span 2", ...card, borderStyle:"dashed" }}>
            <div><strong>Turno:</strong> {state.turnNumber} • <strong>Ativo:</strong> {state.activeTeamId}</div>
            <div style={{ marginTop:6 }}><strong>HP A:</strong> {hpA}</div>
            <div><strong>HP B:</strong> {hpB}</div>
          </div>
          <div style={{ gridColumn:"1 / span 2", ...card }}>
            <h3 style={{ marginTop:0 }}>Fila de Ações (turno {state.activeTeamId})</h3>
            {queue.length===0 ? <div style={{opacity:.6}}>— vazia —</div> :
              <ol>{queue.map((q,i)=> <li key={i}>{q.actorTeam}:{q.actorId} • {lookup[q.skillId]?.name ?? q.skillId}</li>)}</ol>}
            <small>Regras: até 3 ações/turno; máx. 1 ação por personagem no mesmo turno.</small>
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

const card: React.CSSProperties = {
  border:"1px solid #ddd",
  borderRadius:12,
  padding:12,
  background:"#fff",
  color:"#111"
}
const btn: React.CSSProperties = {
  padding:"9px 14px",
  borderRadius:12,
  border:"1px solid #bdbdbd",
  cursor:"pointer",
  background:"linear-gradient(180deg, #ffffff, #f3f3f3)",
  color:"#111",
  fontWeight:700
}
const btnPrimary: React.CSSProperties = {
  ...btn,
  background:"linear-gradient(180deg, #eef6ff, #dbeafe)",
  border:"1px solid #93c5fd"
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
  maxHeight:240,
  overflow:"auto",
  padding:"10px 12px",
  fontFamily:"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize:13,
  lineHeight:1.5
}
