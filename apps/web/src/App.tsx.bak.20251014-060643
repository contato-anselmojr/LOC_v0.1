import React, { useEffect, useMemo, useRef, useState } from "react";
import { RuleEngine, type BattleState, type ActiveSkill, emptyEnergy } from "@arena/engine";

// ==== Tipos auxiliares ====
type CharacterId = "A"|"B"|"C"|"D"|"E"|"F";
type SlotId = "A1"|"A2"|"A3"|"B1"|"B2"|"B3";
type TeamId = "A"|"B";
type TargetTeam = "ALLY"|"ENEMY"|"SELF"|"ALLY_TEAM";

// ==== Helpers UI ====
const pageWrap: React.CSSProperties = { fontFamily:"system-ui,Segoe UI,Roboto,Arial", padding:16, lineHeight:1.4, color:"#0f172a" };
const h1: React.CSSProperties = { marginBottom:8, fontSize:24 };
const bar: React.CSSProperties = { display:"flex", gap:8, alignItems:"center", margin:"8px 0 16px" };
const btn: React.CSSProperties = { padding:"8px 12px", borderRadius:10, border:"1px solid #cbd5e1", cursor:"pointer", background:"#fff", color:"#111827" };
const btnPrimary: React.CSSProperties = { ...btn, background:"#111827", color:"#fff", border:"1px solid #111827" };
const grid2: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 };
const panel: React.CSSProperties = { border:"1px solid #e5e7eb", borderRadius:14, background:"#fff" };
const header: React.CSSProperties = { padding:"10px 12px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center", borderTopLeftRadius:14, borderTopRightRadius:14, background:"#f8fafc" };
const bodyPad: React.CSSProperties = { padding:12 };
const slotBtn: React.CSSProperties = { border:"1px solid #e5e7eb", borderRadius:12, padding:10, background:"#fff" };
const small: React.CSSProperties = { fontSize:12, opacity:.7 };

// ==== Catálogo mínimo de skills/char ====
function mkSkill(id:string, name:string, target:TargetTeam, effects:ActiveSkill["effects"], cost:ActiveSkill["cost"]): ActiveSkill {
  return { id, name, cooldown:1, target, effects, cost };
}
const KIT_A: ActiveSkill[] = [
  mkSkill("a_1", "Raio", "ENEMY", [{kind:"DANO", value:250}], { AZUL:1 }),
  mkSkill("a_2", "Barreira", "SELF", [{kind:"ESCUDO", value:250}], { VERDE:1 }),
  mkSkill("a_3", "Atordoar", "ENEMY", [{kind:"STUN", duration:1}], { BRANCO:1 }),
  mkSkill("a_4", "Marca", "ENEMY", [{kind:"MARCACAO", duration:2}], { PRETA:1 }),
];
const KIT_B: ActiveSkill[] = [
  mkSkill("b_1", "Golpe", "ENEMY", [{kind:"DANO", value:250}], { VERMELHO:1 }),
  mkSkill("b_2", "Guarda", "SELF", [{kind:"ESCUDO", value:300}], { VERDE:1 }),
  mkSkill("b_3", "Silenciar", "ENEMY", [{kind:"SILENCE", duration:1}], { BRANCO:1 }),
  mkSkill("b_4", "Sangrar", "ENEMY", [{kind:"DOT", value:80, duration:2}], { PRETA:1 }),
];
const KIT_C: ActiveSkill[] = [
  mkSkill("c_1", "Flecha", "ENEMY", [{kind:"DANO", value:250}], { VERMELHO:1 }),
  mkSkill("c_2", "Cura", "ALLY", [{kind:"HOT", value:80, duration:2}], { VERDE:1 }),
  mkSkill("c_3", "Atordoar", "ENEMY", [{kind:"STUN", duration:1}], { BRANCO:1 }),
  mkSkill("c_4", "Dreno", "ENEMY", [{kind:"DANO", value:200}], { PRETA:1 }),
];
const KIT_D = KIT_A, KIT_E = KIT_B, KIT_F = KIT_C;

const CHAR_KITS: Record<CharacterId, { name:string; kit:ActiveSkill[] }> = {
  A:{ name:"Arcana", kit:KIT_A }, B:{ name:"Brutus", kit:KIT_B }, C:{ name:"Crystal", kit:KIT_C },
  D:{ name:"Dysis", kit:KIT_D }, E:{ name:"Eris", kit:KIT_E }, F:{ name:"Flux", kit:KIT_F },
};
// Disponibiliza para debugging no console
// @ts-ignore
(window).CHAR_KITS = CHAR_KITS;

// ==== Tela de Seleção ====
function SelectScreen(props:{
  onConfirm: (picksA:Record<"A1"|"A2"|"A3",CharacterId>, picksB:Record<"B1"|"B2"|"B3",CharacterId>)=>void
}){
  const [A1,setA1]=useState<CharacterId>("A"); const [A2,setA2]=useState<CharacterId>("B"); const [A3,setA3]=useState<CharacterId>("C");
  const [B1,setB1]=useState<CharacterId>("A"); const [B2,setB2]=useState<CharacterId>("B"); const [B3,setB3]=useState<CharacterId>("C");

  const options = Object.keys(CHAR_KITS) as CharacterId[];

  const unique = (vals: CharacterId[]) => new Set(vals).size === vals.length;
  const validA = unique([A1,A2,A3]);
  const validB = unique([B1,B2,B3]);

  return (
    <div style={pageWrap}>
      <h1 style={h1}>Arena Multiverso — Seleção</h1>
      <div style={grid2}>
        <div style={panel}>
          <div style={header}><strong>Time A</strong></div>
          <div style={{...bodyPad, display:"grid", gap:10}}>
            {[["A1",A1,setA1],["A2",A2,setA2],["A3",A3,setA3]].map(([label,val,setter]: any)=>(
              <div key={label} style={slotBtn}>
                <div style={{marginBottom:6}}>{label}</div>
                <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                  {options.map(o=>(
                    <button
                      key={o}
                      onClick={()=> (setter as any)(o)}
                      disabled={val===o}
                      style={{...btn, background: val===o?"#111827":"#fff", color: val===o?"#fff":"#111827"}}
                    >{o} • {CHAR_KITS[o].name}</button>
                  ))}
                </div>
              </div>
            ))}
            {!validA && <div style={{...small, color:"#b91c1c"}}>Não repita o mesmo personagem no mesmo time.</div>}
          </div>
        </div>

        <div style={panel}>
          <div style={header}><strong>Time B</strong></div>
          <div style={{...bodyPad, display:"grid", gap:10}}>
            {[["B1",B1,setB1],["B2",B2,setB2],["B3",B3,setB3]].map(([label,val,setter]: any)=>(
              <div key={label} style={slotBtn}>
                <div style={{marginBottom:6}}>{label}</div>
                <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                  {options.map(o=>(
                    <button
                      key={o}
                      onClick={()=> (setter as any)(o)}
                      disabled={val===o}
                      style={{...btn, background: val===o?"#111827":"#fff", color: val===o?"#fff":"#111827"}}
                    >{o} • {CHAR_KITS[o].name}</button>
                  ))}
                </div>
              </div>
            ))}
            {!validB && <div style={{...small, color:"#b91c1c"}}>Não repita o mesmo personagem no mesmo time.</div>}
          </div>
        </div>
      </div>

      <div style={bar}>
        <button
          style={{...btnPrimary, opacity: (validA && validB)?1:.5, pointerEvents:(validA && validB)?"auto":"none"}}
          onClick={()=>{
            props.onConfirm(
              { A1, A2, A3 },
              { B1, B2, B3 },
            )
          }}
        >Confirmar seleção</button>
        <span style={small}>Cada time deve ter 3 personagens distintos.</span>
      </div>
    </div>
  );
}

// ==== Batalha ====
type Pending = { actorTeam:TeamId; actorId:SlotId; skill:ActiveSkill; targetTeam:TeamId } | null;

export default function App(){
  const engine = useMemo(()=> new RuleEngine(777), []);
  const [state, setState] = useState<BattleState|null>(null);
  const [picksA, setPicksA] = useState<Record<"A1"|"A2"|"A3",CharacterId>|null>(null);
  const [picksB, setPicksB] = useState<Record<"B1"|"B2"|"B3",CharacterId>|null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [queue, setQueue] = useState<{ actorTeam:TeamId; actorId:SlotId; skillId:string; target?:{team:TeamId; id?:SlotId} }[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [turnTimer, setTurnTimer] = useState<number>(60);
  const timerRef = useRef<any>(null);

  // inicia batalha quando seleção feita
  const startBattle = (A:Record<"A1"|"A2"|"A3",CharacterId>, B:Record<"B1"|"B2"|"B3",CharacterId>)=>{
    setPicksA(A); setPicksB(B);
    const toRuntime = (slot:SlotId, hp:number)=>({ id:slot, hp, shield:0, cooldowns:{}, effects:[] as any[]});
    const s: BattleState = {
      turnNumber: 0,
      activeTeamId: "A",
      teams: {
        A: { id:"A", characters:[toRuntime("A1",1000), toRuntime("A2",1000), toRuntime("A3",1000)], items:[], energy: emptyEnergy() },
        B: { id:"B", characters:[toRuntime("B1",1200), toRuntime("B2",1100), toRuntime("B3",1100)], items:[], energy: emptyEnergy() },
      },
      settings: { turnDurationSec:60, maxActionsPerTurn:3, maxPerCharacterPerTurn:1 },
    };
    engine.startMatch(s);
    setState(s);
    setTurnTimer(60);
    resetTimer();
    pushLog("Match start: +1 energia para A");
  };

  // timer de turno
  function resetTimer(){
    clearInterval(timerRef.current);
    timerRef.current = setInterval(()=>{
      setTurnTimer((t)=>{
        if (t <= 1) {
          clearInterval(timerRef.current);
          // timeout: descarta fila e passa turno
          pushLog("⏲️ Timeout: fila descartada. Passando a vez...");
          doEndTurn(false); // não executar fila
          return 60;
        }
        return t-1;
      });
    }, 1000);
  }

  function pushLog(s:string){ setLog(l=>[...l, `[${new Date().toLocaleTimeString()}] ${s}`]); }

  function lookup(skillId:string): ActiveSkill | undefined {
    // busca no catálogo do personagem que está atuando
    if (!pending) return undefined;
    const cid = (pending.actorTeam==="A" ? picksA! : picksB!) [pending.actorId] as CharacterId;
    return CHAR_KITS[cid].kit.find(k=>k.id===skillId);
  }

  function enqueue(slot:SlotId, sk:ActiveSkill){
    if (!state) return;
    const actorTeam = (slot.startsWith("A") ? "A" : "B") as TeamId;
    if (actorTeam !== state.activeTeamId) return;

    // abre seleção de alvo conforme target
    if (sk.target === "SELF") {
      setQueue(q=>[...q, { actorTeam, actorId:slot, skillId:sk.id, target:{ team: actorTeam, id: slot } }]);
      pushLog(`${slot} preparou ${sk.name} (SELF)`);
      return;
    }
    if (sk.target === "ALLY_TEAM") {
      setQueue(q=>[...q, { actorTeam, actorId:slot, skillId:sk.id, target:{ team: actorTeam } }]);
      pushLog(`${slot} preparou ${sk.name} (ALLY_TEAM)`);
      return;
    }
    // precisa escolher alvo em time aliado ou inimigo
    const targetTeam = (sk.target === "ALLY") ? actorTeam : (actorTeam==="A"?"B":"A");
    setPending({ actorTeam, actorId:slot, skill:sk, targetTeam });
    pushLog(`${slot} selecionando alvo para ${sk.name} (${sk.target})`);
  }

  function pickTarget(targetSlot:SlotId){
    if (!pending || !state) return;
    const actorTeam = pending.actorTeam;
    const targetTeam = pending.targetTeam;
    setQueue(q=>[...q, { actorTeam, actorId:pending.actorId, skillId:pending.skill.id, target:{ team: targetTeam, id: targetSlot } }]);
    pushLog(`${pending.actorId} definiu alvo ${targetSlot} para ${pending.skill.name}`);
    setPending(null);
  }

  function confirmTurn(){
    if (!state) return;
    // valida (engine já revalida, mas aqui deixamos UX)
    if (queue.length === 0) {
      pushLog("Nada na fila. Passe a vez ou adicione ações.");
      return;
    }
    // executa e passa a vez
    const mapSkill = (id:string)=>{
      // procura no catálogo A e B
      const all: ActiveSkill[] = ([] as ActiveSkill[]).concat(
        ((Object.values(picksA??{}) as CharacterId[]).flatMap(cid => CHAR_KITS[cid].kit)),
        ((Object.values(picksB??{}) as CharacterId[]).flatMap(cid => CHAR_KITS[cid].kit)),
      );
      return all.find(s=>s.id===id);
    };

    engine.resolveQueue(state, queue, mapSkill as any);
    pushLog("Fila executada.");
    doEndTurn(true);
  }

  function doEndTurn(reset:boolean){
    if (!state) return;
    setQueue([]);
    engine.endTurn(state);
    engine.startTurn(state);
    pushLog(`Vez do time ${state.activeTeamId}: +3 energias aleatórias`);
    setState({ ...state });
    if (reset) { setTurnTimer(60); resetTimer(); }
  }

  if (!picksA || !picksB) {
    return <SelectScreen onConfirm={(A,B)=>startBattle(A,B)} />;
  }

  if (!state) return <div style={pageWrap}>Carregando…</div>;

  const canA = state.activeTeamId==="A";
  const canB = state.activeTeamId==="B";
  const idsA: SlotId[] = ["A1","A2","A3"];
  const idsB: SlotId[] = ["B1","B2","B3"];

  const renderTeam = (team:"A"|"B", title:string) => {
    const ids = team==="A"?idsA:idsB;
    const picks = team==="A"?picksA!:picksB!;
    const canAct = state.activeTeamId===team;

    return (
      <div style={{...panel, borderColor: canAct?"#16a34a":"#e5e7eb"}}>
        <div style={header}>
          <strong>{title}</strong>
          <span style={small}>{canAct?"Seu turno":"Aguardando"}</span>
        </div>
        <div style={{...bodyPad, display:"grid", gap:10}}>
          {ids.map((slot)=>{
            const ch = state.teams[team].characters.find(c=>c.id===slot)!;
            const cid = picks[slot];
            const kit = CHAR_KITS[cid].kit;
            const isTargetingThisTeam = !!pending && pending.targetTeam===team;

            const badges = ch.effects?.length
              ? <div style={{display:"flex", gap:6, flexWrap:"wrap", marginTop:6}}>
                  {ch.effects.map((e:any,idx:number)=>(
                    <span key={idx} style={{border:"1px solid #e5e7eb", borderRadius:999, padding:"2px 6px", fontSize:11, background:"#fff"}}>
                      {e.kind}{e.value?`(${e.value})`:""} · {e.duration}T
                    </span>
                  ))}
                </div>
              : null;

            return (
              <div
                key={slot}
                style={{
                  ...slotBtn,
                  outline: isTargetingThisTeam ? "2px solid #c7d2fe" : undefined,
                  cursor: isTargetingThisTeam ? "pointer" : "default"
                }}
                onClick={()=> { if(isTargetingThisTeam) pickTarget(slot); }}
              >
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                  <div style={{display:"flex", gap:8, alignItems:"center"}}>
                    <strong>{team}:{slot}</strong>
                    <span style={small}>{cid} • {CHAR_KITS[cid].name}</span>
                  </div>
                  <div style={small}>HP {ch.hp} (+{ch.shield} esc)</div>
                </div>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                  {kit.map(sk=>{
                    const stunned = ch.effects?.some((e:any)=>e.kind==="STUN" && e.duration>0);
                    const silenced = ch.effects?.some((e:any)=>e.kind==="SILENCE" && e.duration>0);
                    const blockedBySilence = silenced && sk.effects.some(e=>!["DANO","ESCUDO"].includes(e.kind));
                    const disabled = !canAct || stunned || blockedBySilence || !!pending;

                    return (
                      <button
                        key={sk.id}
                        disabled={disabled}
                        onClick={(e)=>{ e.stopPropagation(); enqueue(slot, sk); }}
                        style={{
                          ...btn,
                          background: disabled ? "#f1f5f9" : "#fff",
                          color: disabled ? "#9ca3af" : "#111827",
                          borderColor: disabled ? "#e5e7eb" : "#cbd5e1"
                        }}
                      >
                        {sk.name}
                      </button>
                    );
                  })}
                </div>
                {badges}
                {isTargetingThisTeam && <div style={{marginTop:6, fontSize:12, color:"#4f46e5"}}>Clique para escolher o alvo</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={pageWrap}>
      <h1 style={h1}>Arena Multiverso — MVP</h1>
      <div style={{...bar, justifyContent:"space-between"}}>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <button style={btn} onClick={()=>{ setLog([]); }}>Limpar Log</button>
          <div style={{...small}}>Turno de: <strong>{state.activeTeamId}</strong></div>
          <div style={{...small}}>Timer: <strong>{turnTimer}s</strong></div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button style={btn} onClick={()=>{ setQueue([]); setPending(null); pushLog("Fila limpa."); }}>Limpar Fila</button>
          <button style={btnPrimary} onClick={confirmTurn}>Confirmar Turno</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px 1fr", gap:16 }}>
        {renderTeam("A","Time A")}
        <div>
          <div style={{...panel, marginBottom:16}}>
            <div style={header}><strong>Fila de ações</strong></div>
            <div style={bodyPad}>
              {queue.length===0 ? <div style={small}>Vazia</div> :
                <ol style={{margin:0, paddingLeft:18}}>
                  {queue.map((a,i)=>(
                    <li key={i} style={{marginBottom:4, fontSize:14}}>
                      {a.actorId} → {a.skillId} {a.target?.id?`em ${a.target.id}`:`(${a.target?.team==="A"?"time A": "time B"})`}
                    </li>
                  ))}
                </ol>
              }
            </div>
          </div>
          <div style={panel}>
            <div style={header}><strong>Energia</strong></div>
            <div style={{...bodyPad, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:13}}>
              <div>
                <div style={{fontWeight:700, marginBottom:6}}>A</div>
                <pre style={{margin:0, background:"#f8fafc", padding:8, borderRadius:8, border:"1px solid #e5e7eb"}}>
{JSON.stringify(state.teams.A.energy, null, 2)}
                </pre>
              </div>
              <div>
                <div style={{fontWeight:700, marginBottom:6}}>B</div>
                <pre style={{margin:0, background:"#f8fafc", padding:8, borderRadius:8, border:"1px solid #e5e7eb"}}>
{JSON.stringify(state.teams.B.energy, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
        {renderTeam("B","Time B")}
      </div>

      <div style={{...panel, marginTop:16}}>
        <div style={header}><strong>Log</strong></div>
        <div style={bodyPad}>
          {log.length===0 ? <div style={small}>Sem eventos</div> :
            <ul style={{margin:0, paddingLeft:18}}>
              {log.map((l,i)=>(<li key={i} style={{marginBottom:2}}>{l}</li>))}
            </ul>
          }
        </div>
      </div>
    </div>
  );
}
