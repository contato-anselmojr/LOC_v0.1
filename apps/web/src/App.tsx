import React, { useMemo, useRef, useState, useEffect } from "react"
import { RuleEngine, type BattleState, type ActiveSkill, emptyEnergy } from "@arena/engine"

type TeamId = "A"|"B"
type BaseColor = "AZUL"|"VERMELHO"|"VERDE"|"BRANCO"

type CharacterId = "A"|"B"|"C"|"D"|"E"|"F"
type SlotIdA = "A1"|"A2"|"A3"
type SlotIdB = "B1"|"B2"|"B3"

type QA = { actorTeam: TeamId; actorId: string; skillId: string; target?: { team: TeamId; id?: string } }

type Screen = "SELECT" | "BATTLE"

/** ---------- CATÁLOGO DE PERSONAGENS (A–F) COM 4 SKILLS CADA ---------- */
function S(id:string, name:string, cost:Partial<Record<"AZUL"|"VERMELHO"|"VERDE"|"BRANCO"|"PRETA",number>>, effects:ActiveSkill["effects"], target:ActiveSkill["target"]="ENEMY"): ActiveSkill {
  return { id, name, cost, cooldown:1, target, effects }
}
(window as any).CHAR_KITS = CHAR_KITS;\nconst CHAR_KITS: Record<CharacterId, { name:string; kit: ActiveSkill[] }> = {
  A: { name:"Arcana (Mago DPS)",
       kit: [
         S("A_as1","Raio", {AZUL:1}, [{kind:"DANO",value:250}], "ENEMY"),
         S("A_as2","Explosão", {AZUL:2}, [{kind:"DANO",value:350}], "ENEMY"),
         S("A_as3","Marca Arcana", {PRETA:1}, [{kind:"MARCACAO",duration:2}], "ENEMY"),
         S("A_as4","Atordoar", {BRANCO:1}, [{kind:"STUN",duration:1}], "ENEMY"),
       ]},
  B: { name:"Blademan (Lutador)",
       kit: [
         S("B_bs1","Golpe", {VERMELHO:1}, [{kind:"DANO",value:250}], "ENEMY"),
         S("B_bs2","Cortar", {VERMELHO:2}, [{kind:"DANO",value:350}], "ENEMY"),
         S("B_bs3","Guarda", {VERDE:1}, [{kind:"ESCUDO",value:300}], "SELF"),
         S("B_bs4","Provocar", {BRANCO:1}, [{kind:"SILENCE",duration:1}], "ENEMY"),
       ]},
  C: { name:"Clériga (Suporte Cura)",
       kit: [
         // ajustado para ALLY (alvo único) para demonstrar seleção de aliado
         S("C_cs1","Benção", {VERDE:1}, [{kind:"ESCUDO",value:250}], "ALLY"),
         S("C_cs2","Luz", {AZUL:1}, [{kind:"DANO",value:200}], "ENEMY"),
         S("C_cs3","Selo", {BRANCO:1}, [{kind:"SILENCE",duration:1}], "ENEMY"),
         S("C_cs4","Reforço", {VERDE:1}, [{kind:"RESISTENCIA",duration:2,value:0}], "ALLY_TEAM"),
       ]},
  D: { name:"Defensor (Tank Early)",
       kit: [
         S("D_ds1","Muralha", {VERDE:2}, [{kind:"ESCUDO",value:350}], "SELF"),
         S("D_ds2","Impacto", {VERMELHO:1}, [{kind:"DANO",value:220}], "ENEMY"),
         S("D_ds3","Atordoar", {BRANCO:1}, [{kind:"STUN",duration:1}], "ENEMY"),
         S("D_ds4","Quebra-Marcas", {PRETA:1}, [{kind:"DANO",value:250}], "ENEMY"),
       ]},
  E: { name:"Envenenadora (DoT)",
       kit: [
         S("E_es1","Dardo", {VERMELHO:1}, [{kind:"DANO",value:230}], "ENEMY"),
         S("E_es2","Veneno", {PRETA:1}, [{kind:"DOT",duration:2,value:80}], "ENEMY"),
         S("E_es3","Fumaça", {BRANCO:1}, [{kind:"SILENCE",duration:1}], "ENEMY"),
         S("E_es4","Estocada", {VERMELHO:2}, [{kind:"DANO",value:330}], "ENEMY"),
       ]},
  F: { name:"Frost (Controle)",
       kit: [
         S("F_fs1","Gélido", {AZUL:1}, [{kind:"DANO",value:220}], "ENEMY"),
         S("F_fs2","Congelar", {BRANCO:1}, [{kind:"STUN",duration:1}], "ENEMY"),
         S("F_fs3","Barreira de Gelo", {VERDE:1}, [{kind:"ESCUDO",value:280}], "SELF"),
         S("F_fs4","Estilhaçar", {AZUL:2}, [{kind:"DANO",value:340}], "ENEMY"),
       ]},
}

/** ---------- APP ---------- */
export default function App() {
  const engine = useMemo(()=> new RuleEngine(777), [])

  /** TELA ATUAL */
  const [screen, setScreen] = useState<Screen>("SELECT")

  /** SELEÇÃO */
  const [teamA, setTeamA] = useState<{slots: Record<SlotIdA, CharacterId|null>}>({ slots:{A1:null,A2:null,A3:null} })
  const [teamB, setTeamB] = useState<{slots: Record<SlotIdB, CharacterId|null>}>({ slots:{B1:null,B2:null,B3:null} })
  const [pickTeam, setPickTeam] = useState<TeamId>("A")
  const [pickSlotA, setPickSlotA] = useState<SlotIdA>("A1")
  const [pickSlotB, setPickSlotB] = useState<SlotIdB>("B1")
  const [selectMsg, setSelectMsg] = useState<string>("")

  /** Mapeamento final dos picks para usar na batalha (skills corretas por slot) */
  const [picks, setPicks] = useState<{
    A: Record<SlotIdA, CharacterId>,
    B: Record<SlotIdB, CharacterId>
  } | null>(null)

  /** BATALHA */
  const [state, setState] = useState<BattleState | null>(null)
  const [queue, setQueue] = useState<QA[]>([])
  const [showConsole, setShowConsole] = useState<boolean>(true)
  const [log, setLog] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement|null>(null)
  const t = ()=> new Date().toLocaleTimeString()
  const addLog = (m:string)=> setLog(prev=>[...prev, `[${t()}] ${m}`])
  useEffect(()=>{ if(logRef.current){ logRef.current.scrollTop = logRef.current.scrollHeight } },[log])

  // Timer
  const TURN_SECONDS = 60
  const [remaining, setRemaining] = useState<number>(TURN_SECONDS)
  const [timerOn, setTimerOn] = useState<boolean>(false)
  useEffect(()=>{
    if (!timerOn || !state) return
    const id = window.setInterval(()=>{
      setRemaining(prev=>{
        if(prev<=1){ window.clearInterval(id); timeoutPass(true); return TURN_SECONDS }
        return prev-1
      })
    },1000)
    return ()=> window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerOn, state?.activeTeamId, state?.turnNumber])
  function resetTimer(start:boolean){ setRemaining(TURN_SECONDS); setTimerOn(start) }

  /** ---------- HELPERS ---------- */
  const toRuntime = (id:string, hp:number)=>({ id, hp, shield:0, cooldowns:{}, effects:[] as any[] })
  function buildLookupFromPicks(aSlots:Record<SlotIdA,CharacterId>, bSlots:Record<SlotIdB,CharacterId>){
    const entries: ActiveSkill[] = []
    const add = (cid:CharacterId|null)=>{ if(!cid) return; entries.push(...CHAR_KITS[cid].kit) }
    Object.values(aSlots).forEach(add)
    Object.values(bSlots).forEach(add)
    return Object.fromEntries(entries.map(s=>[s.id,s])) as Record<string,ActiveSkill>
  }
  const [lookup, setLookup] = useState<Record<string,ActiveSkill>>({})

  /** ---------- TELA DE SELEÇÃO ---------- */
  function pickChar(cid:CharacterId){
    setSelectMsg("")
    if(pickTeam==="A"){
      const used = Object.values(teamA.slots).includes(cid)
      if(used){ setSelectMsg(`⚠️ ${cid} já está no Time A.`); return }
      const s = {...teamA.slots}; s[pickSlotA] = cid; setTeamA({slots:s})
    } else {
      const used = Object.values(teamB.slots).includes(cid)
      if(used){ setSelectMsg(`⚠️ ${cid} já está no Time B.`); return }
      const s = {...teamB.slots}; s[pickSlotB] = cid; setTeamB({slots:s})
    }
  }
  function canConfirmTeams(){
    const aOk = Object.values(teamA.slots).every(Boolean)
    const bOk = Object.values(teamB.slots).every(Boolean)
    return aOk && bOk
  }
  function confirmTeams(){
    if(!canConfirmTeams()) return
    const Aids = Object.keys(teamA.slots) as SlotIdA[]
    const Bids = Object.keys(teamB.slots) as SlotIdB[]
    // HP base simples para demonstração
    const hpOf = (cid:CharacterId|null)=> {
      switch(cid){
        case "D": return 1300 // Tank
        case "B": return 1100 // Lutador
        case "A": return 900  // Mago
        case "E": return 900  // DoT
        case "F": return 950  // Controle
        case "C": return 1000 // Suporte
        default: return 1000
      }
    }
    const s: BattleState = {
      turnNumber: 1,
      activeTeamId: "A",
      teams: {
        A: { id:"A",
             characters: Aids.map(slot=> toRuntime(slot, hpOf(teamA.slots[slot])) ),
             items: [],
             energy: emptyEnergy()
        },
        B: { id:"B",
             characters: Bids.map(slot=> toRuntime(slot, hpOf(teamB.slots[slot])) ),
             items: [],
             energy: emptyEnergy()
        },
      },
      settings: { turnDurationSec:TURN_SECONDS, maxActionsPerTurn:3, maxPerCharacterPerTurn:1 },
    }
    engine.startMatch(s)
    setState({...s})
    setPicks({ A: teamA.slots as any, B: teamB.slots as any })
    setLookup(buildLookupFromPicks(teamA.slots as any, teamB.slots as any))
    setQueue([])
    setLog([`Times confirmados: A(${Aids.map(x=>teamA.slots[x]).join(",")}) vs B(${Bids.map(x=>teamB.slots[x]).join(",")})`,
            `startMatch(): +1 energia para o time A`])
    resetTimer(true)
    setScreen("BATTLE")
  }

  /** ---------- BATALHA: alvo explícito ---------- */
  // Modo de seleção de alvo após clicar skill que exige alvo unitário
  const [pendingTarget, setPendingTarget] = useState<null | { actorTeam:TeamId; actorId:string; skillId:string; targetTeam:TeamId }>(null)

  function startAction(actorTeam: TeamId, actorId: string, skill: ActiveSkill){
    if(!state) return
    if (actorTeam !== state.activeTeamId) { addLog(`ignorado: não é o turno do time ${actorTeam}`); return }

    // SELF -> enfileira direto com alvo = self
    if (skill.target === "SELF") {
      enqueueAction(actorTeam, actorId, skill.id, actorTeam, actorId)
      return
    }
    // ALLY_TEAM -> não precisa alvo específico (aplica no time todo)
    if (skill.target === "ALLY_TEAM") {
      enqueueAction(actorTeam, actorId, skill.id, actorTeam, undefined)
      return
    }
    // ENEMY / ALLY -> exige escolher um personagem
    const targetTeam: TeamId = (skill.target === "ALLY") ? actorTeam : (actorTeam === "A" ? "B" : "A")
    setPendingTarget({ actorTeam, actorId, skillId: skill.id, targetTeam })
    addLog(`selecione o alvo em ${targetTeam} para ${actorId} • ${skill.name}`)
  }

  function chooseTarget(slotId: string, teamClicked: TeamId){
    if(!pendingTarget || !state) return
    if(teamClicked !== pendingTarget.targetTeam) return
    enqueueAction(pendingTarget.actorTeam, pendingTarget.actorId, pendingTarget.skillId, pendingTarget.targetTeam, slotId)
    setPendingTarget(null)
  }

  function cancelTargeting(){ setPendingTarget(null) }

  function enqueueAction(actorTeam: TeamId, actorId: string, skillId: string, targetTeam: TeamId, targetId?: string){
    if(!state) return
    const byChar = new Map(queue.map(q=>[q.actorId,0]))
    for (const q of queue) byChar.set(q.actorId, (byChar.get(q.actorId)??0)+1)
    if (queue.length >= state.settings.maxActionsPerTurn) { addLog("fila cheia (3 ações)"); return }
    if ((byChar.get(actorId)??0) >= state.settings.maxPerCharacterPerTurn) { addLog(`limite: ${actorId} já tem ação no turno`); return }
    setQueue(prev => [...prev, { actorTeam, actorId, skillId, target:{ team: targetTeam, id: targetId } }])
    const skillName = lookup[skillId]?.name ?? skillId
    addLog(`fila += ${actorTeam}:${actorId} • ${skillName}${targetId?` → alvo ${targetTeam}:${targetId}`:""}`)
  }

  function confirmTurn(){
    if(!state) return
    const s = { ...state }
    // @ts-ignore
    const v = engine.validateQueue(s, queue)
    if (!v.ok) { addLog(`ERRO: ${v.reason || "fila inválida"}`); return }
    engine.resolveQueue(s, queue, (id)=>lookup[id])
    addLog(`resolveQueue(): executadas ${queue.length} ação(ões) do time ${s.activeTeamId}`)
    engine.endTurn(s);   addLog(`endTurn(): fim do turno do time ${state.activeTeamId}`)
    engine.startTurn(s); addLog(`startTurn(): início do turno do time ${s.activeTeamId} ${s.turnNumber>=2 ? "(+3 energias)" : ""}`)
    setQueue([])
    setState({ ...s })
    setPendingTarget(null)
    resetTimer(true)
  }

  function timeoutPass(fromTimer=false){
    if(!state) return
    const s = { ...state }
    if (queue.length>0) addLog(`timeout: descartando ${queue.length} ação(ões) não confirmadas`)
    engine.endTurn(s);   addLog(`endTurn(): ${(fromTimer?"timeout — ":"")}turno passou do time ${state.activeTeamId}`)
    engine.startTurn(s); addLog(`startTurn(): início do turno do time ${s.activeTeamId} ${s.turnNumber>=2 ? "(+3 energias)" : ""}`)
    setQueue([])
    setState({ ...s })
    setPendingTarget(null)
    resetTimer(true)
  }

  function convertToBlack(baseColor: BaseColor){
    if(!state) return
    const s = { ...state }
    const ok = engine.convertToBlack(s as any, baseColor as any)
    addLog(ok ? `convertToBlack(): 1 ${baseColor} → PRETA` : `convertToBlack(): falhou (sem ${baseColor})`)
    setState({ ...s })
  }

  /** ---------- UI COMPOSTA ---------- */
  if (screen === "SELECT") {
    return (
      <div style={{ fontFamily:"system-ui, sans-serif", padding:16, color:"#111" }}>
        <h1>Seleção de Times</h1>
        <p>Escolha 3 personagens para cada time. Depois confirme para ir à batalha.</p>

        {selectMsg && <div style={{margin:"8px 0", padding:"8px 10px", border:"1px solid #facc15", background:"#fef9c3", borderRadius:10, color:"#713f12"}}>{selectMsg}</div>}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px 1fr", gap:16, alignItems:"start" }}>
          {/* Team A panel */}
          <TeamPickPanel
            title="Time A"
            team="A"
            slots={teamA.slots}
            pickSlot={pickSlotA}
            onPickSlot={(s)=>{ setPickTeam("A"); setPickSlotA(s as SlotIdA) }}
          />

          {/* Catalogo */}
          <div style={catalogWrap}>
            <div style={catalogHeader}>
              <strong>Catálogo (A–F)</strong>
              <div style={{fontSize:12,color:"#475569"}}>Clique para atribuir ao slot selecionado do time {pickTeam}</div>
            </div>
            <div style={catalogGrid}>
              {(["A","B","C","D","E","F"] as CharacterId[]).map(cid=>{
                const data = CHAR_KITS[cid]
                return (
                  <button key={cid} onClick={()=>pickChar(cid)} style={cardBtn}>
                    <div style={{fontSize:24, fontWeight:900}}>{cid}</div>
                    <div style={{fontSize:12,opacity:.75, textAlign:"center"}}>{data.name}</div>
                    <div style={{marginTop:6, fontSize:11, opacity:.8}}>
                      {data.kit.map(k=><span key={k.id} style={pill}>{k.name}</span>)}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Team B panel */}
          <TeamPickPanel
            title="Time B"
            team="B"
            slots={teamB.slots}
            pickSlot={pickSlotB}
            onPickSlot={(s)=>{ setPickTeam("B"); setPickSlotB(s as SlotIdB) }}
          />
        </div>

        <div style={{display:"flex", gap:10, marginTop:16}}>
          <button
            onClick={confirmTeams}
            disabled={!canConfirmTeams()}
            style={{...btnPrimary, opacity: canConfirmTeams()?1:.5}}
          >
            Confirmar Times e Ir para Batalha
          </button>
          <button onClick={()=>{
            setTeamA({slots:{A1:null,A2:null,A3:null}})
            setTeamB({slots:{B1:null,B2:null,B3:null}})
            setPickTeam("A"); setPickSlotA("A1"); setPickSlotB("B1")
            setSelectMsg("")
          }} style={btnAlt}>Limpar Seleção</button>
        </div>
      </div>
    )
  }

  // --------- TELA DE BATALHA — LAYOUT VERTICAL POR TIME (igual à seleção) ----------
  const hpA = state?.teams.A.characters.map(c=>`${c.id}:${c.hp}(+${c.shield} esc)`).join("  ") ?? "-"
  const hpB = state?.teams.B.characters.map(c=>`${c.id}:${c.hp}(+${c.shield} esc)`).join("  ") ?? "-"
  const mm = String(Math.floor(remaining/60)).padStart(2,"0")
  const ss = String(remaining%60).padStart(2,"0")
  const canActA = state?.activeTeamId === "A"
  const canActB = state?.activeTeamId === "B"

  return (
    <div style={{ fontFamily:"system-ui, sans-serif", padding:16, color:"#111" }}>
      <h1>Arena Multiverso — Batalha</h1>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
        <button onClick={()=>setScreen("SELECT")} style={btnAlt}>Voltar para Seleção</button>
        <button onClick={()=>convertToBlack("AZUL")} style={btnAlt}>Conversão: AZUL→PRETA</button>
        <button onClick={confirmTurn} style={btnPrimary}>Confirmar / Passar</button>
        <button onClick={()=>timeoutPass(false)} style={btnAlt}>Simular Timeout</button>
        <span style={{ alignSelf:"center", fontWeight:800, padding:"6px 10px", border:"1px solid #d1d5db", borderRadius:10, background:"#fff" }}>
          ⏱️ Tempo: {mm}:{ss}
        </span>
        <button onClick={()=>setShowConsole(s=>!s)} style={btnAlt}>{showConsole ? "Ocultar Console" : "Mostrar Console"}</button>
        <button onClick={()=>setLog([])} style={btnAlt}>Limpar Console</button>
        {pendingTarget && <button onClick={cancelTargeting} style={{...btnAlt, borderColor:"#ef4444"}}>Cancelar Seleção de Alvo</button>}
      </div>

      {state && picks && (
        <>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start"}}>
            <BattleTeamPanel
              title="Time A"
              team="A"
              canAct={canActA}
              state={state}
              picks={picks}
              pendingTarget={pendingTarget}
              onAction={(slot, skill)=> startAction("A", slot, skill)}
              onPickTarget={(slot)=> chooseTarget(slot, "A")}
            />
            <BattleTeamPanel
              title="Time B"
              team="B"
              canAct={canActB}
              state={state}
              picks={picks}
              pendingTarget={pendingTarget}
              onAction={(slot, skill)=> startAction("B", slot, skill)}
              onPickTarget={(slot)=> chooseTarget(slot, "B")}
            />

            <div style={{ gridColumn:"1 / span 2", ...card, borderStyle:"dashed" }}>
              <div><strong>Turno:</strong> {state.turnNumber} • <strong>Ativo:</strong> {state.activeTeamId}</div>
              <div style={{ marginTop:6 }}><strong>HP A:</strong> {hpA}</div>
              <div><strong>HP B:</strong> {hpB}</div>
            </div>

            <div style={{ gridColumn:"1 / span 2", ...card }}>
              <h3 style={{ marginTop:0 }}>Fila de Ações (turno {state.activeTeamId})</h3>
              {queue.length===0 ? <div style={{opacity:.6}}>— vazia —</div> :
                <ol>{queue.map((q,i)=> <li key={i}>{q.actorTeam}:{q.actorId} • {(lookup[q.skillId]?.name ?? q.skillId)}{q.target?.id?` → ${q.target.team}:${q.target.id}`:""}</li>)}</ol>}
              <small>Regras: até 3 ações por turno; máx. 1 por personagem.</small>
            </div>
          </div>

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
        </>
      )}
    </div>
  )
}

/** ---------- Componentes ---------- */

function TeamPickPanel(props:{
  title:string
  team: TeamId
  slots: Record<"A1"|"A2"|"A3"|"B1"|"B2"|"B3", CharacterId|null>
  pickSlot: string
  onPickSlot: (slot:string)=>void
}){
  const ids = props.team==="A" ? (["A1","A2","A3"] as const) : (["B1","B2","B3"] as const)
  return (
    <div style={formationWrap}>
      <div style={formationHeader}>
        <strong>{props.title}</strong>
      </div>
      <div style={{padding:12, display:"grid", gap:10}}>
        {ids.map((slot)=>{
          const isSel = props.pickSlot===slot
          const cid = props.slots[slot as keyof typeof props.slots]
          return (
            <div key={slot} style={rowLine}>
              <button onClick={()=>props.onPickSlot(slot)} style={{
                ...slotBtn, width:"100%", justifyContent:"space-between",
                borderColor: isSel ? "#4f46e5" : "#d1d5db",
                outline: isSel ? "2px solid #c7d2fe" : "none",
              }}>
                <div style={{display:"flex", gap:8, alignItems:"center"}}>
                  <div style={{fontWeight:800}}>{slot}</div>
                  <div style={{opacity:.6}}>•</div>
                  <div>{cid ? `${cid} — ${CHAR_KITS[cid].name}` : "vazio"}</div>
                </div>
                <div style={{display:"flex", gap:6}}>
                  {cid ? CHAR_KITS[cid].kit.map(k=><span key={k.id} style={pill}>{k.name}</span>) : null}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Painel vertical por time para a TELA DE BATALHA */
function BattleTeamPanel(props:{
  title:string
  team: TeamId
  canAct: boolean
  state: BattleState
  picks: { A: Record<SlotIdA, CharacterId>, B: Record<SlotIdB, CharacterId> }
  pendingTarget: { actorTeam:TeamId; actorId:string; skillId:string; targetTeam:TeamId } | null
  onAction: (slotId: string, skill: ActiveSkill)=>void
  onPickTarget: (slotId: string)=>void
}){
  const ids = props.team==="A" ? (["A1","A2","A3"] as const) : (["B1","B2","B3"] as const)
  const isTargetingThisTeam = props.pendingTarget?.targetTeam === props.team
  return (
    <div style={{...formationWrap, borderColor: props.canAct ? "#16a34a" : "#e5e7eb"}}>
      <div style={formationHeader}>
        <strong>{props.title}</strong>{" "}
        {props.canAct ? <span style={{ color:"#16a34a", fontWeight:700 }}>• Turno</span> : <span style={{ color:"#64748b" }}>• Aguardando</span>}
        {isTargetingThisTeam && <span style={{ marginLeft:8, color:"#4f46e5" }}>— Selecione um alvo</span>}
      </div>
      <div style={{padding:12, display:"grid", gap:10}}>
        {ids.map((slot)=>{
          const ch = props.state.teams[props.team].characters.find(c=>c.id===slot)!
          const cid = props.team==="A" ? props.picks.A[slot as SlotIdA] : props.picks.B[slot as SlotIdB]
          const kit = CHAR_KITS[cid].kit
          const targetHighlight = isTargetingThisTeam ? { borderColor:"#4f46e5", outline:"2px solid #c7d2fe", cursor:"pointer" as const } : {}
          return (
            <div
              key={slot}
              onClick={()=>{ if(isTargetingThisTeam) props.onPickTarget(slot) }}
              style={{
                ...slotBtn, width:"100%", textAlign:"left",
                ...(isTargetingThisTeam ? targetHighlight : {})
              }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
                <div style={{display:"flex", gap:8, alignItems:"center"}}>
                  <div style={{fontWeight:800}}>{props.team}:{slot}</div>
                  <div style={{opacity:.7}}>{cid} — {CHAR_KITS[cid].name}</div>
                </div>
                <div style={{fontSize:12, opacity:.7}}>HP {ch.hp} (+{ch.shield} esc)</div>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
                {kit.map(sk=>
                  <button
                    key={sk.id}
                    onClick={(e)=>{ e.stopPropagation(); props.onAction(slot, sk) }}
                    style={{...btnSmall, opacity: props.canAct ? 1 : .6}}
                    disabled={!props.canAct}
                  >
                    {sk.name}
                  </button>
                )}
              </div>
              {isTargetingThisTeam && <div style={{marginTop:6, fontSize:12, color:"#4f46e5"}}>Clique para escolher este alvo</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** ---------- Estilos ---------- */
const catalogWrap: React.CSSProperties = {
  border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden", background:"#fff"
}
const catalogHeader: React.CSSProperties = {
  padding:"8px 12px", borderBottom:"1px solid #e5e7eb", background:"linear-gradient(180deg,#fafafa,#f3f4f6)"
}
const catalogGrid: React.CSSProperties = {
  padding:12, display:"grid", gridTemplateColumns:"1fr", gap:10
}
const cardBtn: React.CSSProperties = {
  border:"1px solid #d1d5db", borderRadius:12, background:"linear-gradient(180deg,#ffffff,#f8fafc)",
  padding:10, display:"grid", gap:4, cursor:"pointer", color:"#111", textAlign:"center"
}
const pill: React.CSSProperties = {
  display:"inline-block", padding:"2px 6px", border:"1px solid #e5e7eb", borderRadius:999, marginRight:4, marginBottom:4, fontSize:10, background:"#fff"
}

const formationWrap: React.CSSProperties = {
  border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden", background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.04)"
}
const formationHeader: React.CSSProperties = {
  padding:"8px 12px", borderBottom:"1px solid #e5e7eb", background:"linear-gradient(180deg,#fafafa,#f3f4f6)"
}
const rowLine: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr", alignItems:"center", gap:8 }
const slotBtn: React.CSSProperties = {
  border:"1px solid #d1d5db", borderRadius:12, background:"linear-gradient(180deg,#ffffff,#f8fafc)", color:"#111", padding:"8px 10px"
}

const card: React.CSSProperties = { border:"1px solid #ddd", borderRadius:12, padding:12, background:"#fff", color:"#111" }
const btn: React.CSSProperties = { padding:"9px 14px", borderRadius:12, border:"1px solid #bdbdbd", cursor:"pointer", background:"linear-gradient(180deg,#ffffff,#f3f3f3)", color:"#111", fontWeight:700 }
const btnPrimary: React.CSSProperties = { ...btn, background:"linear-gradient(180deg,#eef6ff,#dbeafe)", border:"1px solid #93c5fd" }
const btnAlt: React.CSSProperties = { ...btn, background:"linear-gradient(180deg,#f9fafb,#ececec)" }
const btnSmall: React.CSSProperties = { ...btn, padding:"6px 8px", fontSize:12 }
const consoleWrap: React.CSSProperties = { marginTop:16, border:"1px solid #d1d5db", borderRadius:12, overflow:"hidden", background:"#111", color:"#e5e7eb", boxShadow:"0 1px 3px rgba(0,0,0,.1)" }
const consoleHeader: React.CSSProperties = { padding:"8px 12px", fontWeight:700, background:"#0b0b0b", borderBottom:"1px solid #222" }
const consoleBody: React.CSSProperties = { maxHeight:260, overflow:"auto", padding:"10px 12px", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize:13, lineHeight:1.5 }


