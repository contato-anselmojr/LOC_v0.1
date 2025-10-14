import React, { useEffect, useMemo, useRef, useState } from "react";
import { RuleEngine, type BattleState, type ActiveSkill, emptyEnergy } from "@arena/engine";

/* ===================== Tipos ===================== */
type CharacterId = "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I";
type SlotId = "A1"|"A2"|"A3"|"B1"|"B2"|"B3";
type TeamId = "A"|"B";
type TargetTeam = "ALLY"|"ENEMY"|"SELF"|"ALLY_TEAM";

/* ===================== Estilos ===================== */
const pageWrap: React.CSSProperties = { fontFamily:"system-ui, Segoe UI, Roboto, Arial", padding:16, lineHeight:1.4, color:"#0f172a", background:"#f8fafc" };
const h1: React.CSSProperties = { marginBottom:8, fontSize:24 };
const bar: React.CSSProperties = { display:"flex", gap:8, alignItems:"center", margin:"8px 0 16px" };
const btn: React.CSSProperties = { padding:"8px 12px", borderRadius:10, border:"1px solid #cbd5e1", cursor:"pointer", background:"#fff", color:"#111827" };
const btnPrimary: React.CSSProperties = { ...btn, background:"#111827", color:"#fff", border:"1px solid #111827" };
const panel: React.CSSProperties = { border:"1px solid #e5e7eb", borderRadius:14, background:"#fff" };
const header: React.CSSProperties = { padding:"10px 12px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center", borderTopLeftRadius:14, borderTopRightRadius:14, background:"#ffffff" };
const bodyPad: React.CSSProperties = { padding:12 };
const slotBtn: React.CSSProperties = { border:"1px solid #e5e7eb", borderRadius:12, padding:10, background:"#fff" };
const hpBarOuter: React.CSSProperties = { position:"relative", height:10, background:"#e5e7eb", borderRadius:999, overflow:"hidden" };
const hpBarInner: React.CSSProperties = { position:"absolute", left:0, top:0, bottom:0, width:"0%", background:"#22c55e" };
const hpBarText: React.CSSProperties  = { fontSize:12, marginTop:4 };const small: React.CSSProperties = { fontSize:12, opacity:.7 };

/* ===================== Catálogo ===================== */
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
  mkSkill("b_4", "Bênção", "ALLY", [{kind:"HOT", value:80, duration:2}], { VERDE:1 }),
];
const KIT_C: ActiveSkill[] = [
  mkSkill("c_1", "Flecha", "ENEMY", [{kind:"DANO", value:250}], { VERMELHO:1 }),
  mkSkill("c_2", "Cura", "ALLY", [{kind:"HOT", value:80, duration:2}], { VERDE:1 }),
  mkSkill("c_3", "Atordoar", "ENEMY", [{kind:"STUN", duration:1}], { BRANCO:1 }),
  mkSkill("c_4", "Dreno", "ENEMY", [{kind:"DANO", value:200}], { PRETA:1 }),
];
const KIT_F = KIT_A, KIT_G = KIT_B, KIT_H = KIT_C, KIT_I = KIT_A;
const KIT_D: ActiveSkill[] = [
  mkSkill("d_1", "Impacto",    "ENEMY", [{kind:"DANO",   value:250}], { VERMELHO:1 }),
  mkSkill("d_2", "Proteção",   "SELF",  [{kind:"ESCUDO", value:300}], { AZUL:1 }),
  mkSkill("d_3", "Calar Voz",  "ENEMY", [{kind:"SILENCE",duration:1}], { BRANCO:1 }),
  mkSkill("d_4", "Chama",      "ENEMY", [{kind:"DOT",    value:80, duration:2}], { VERMELHO:1 }),
];
const KIT_E: ActiveSkill[] = [
  mkSkill("e_1", "Lâmina",     "ENEMY", [{kind:"DANO",   value:250}], { VERDE:1 }),
  mkSkill("e_2", "Bênção",     "ALLY",  [{kind:"HOT",    value:80, duration:2}], { VERDE:1 }),
  mkSkill("e_3", "Atordoar",   "ENEMY", [{kind:"STUN",   duration:1}], { BRANCO:1 }),
  mkSkill("e_4", "Barreira",   "ALLY",  [{kind:"ESCUDO", value:250}], { AZUL:1 }),
];
const CHAR_KITS: Record<CharacterId, { name: string; kit: ActiveSkill[] }> = {
  A:{name:"A",kit:KIT_A}, B:{name:"B",kit:KIT_B}, C:{name:"C",kit:KIT_C},
  D:{name:"D",kit:KIT_D?KIT_D:KIT_A}, E:{name:"E",kit:KIT_E?KIT_E:KIT_B},
  F:{name:"F",kit:KIT_F}, G:{name:"G",kit:KIT_G}, H:{name:"H",kit:KIT_H}, I:{name:"I",kit:KIT_I},
};
// @ts-ignore
(window as any).CHAR_KITS = CHAR_KITS;

/* ===================== Seleção ===================== */
function SelectScreen(props:{
  onConfirm: (picksA:Record<"A1"|"A2"|"A3",CharacterId>, picksB:Record<"B1"|"B2"|"B3",CharacterId>)=>void
}){
  const all = Object.keys(CHAR_KITS) as CharacterId[];
  const [aSlots, setASlots] = useState<Array<CharacterId|null>>([null,null,null]);
  const [bSlots, setBSlots] = useState<Array<CharacterId|null>>([null,null,null]);

  const put = (team:"A"|"B", id:CharacterId)=>{
    if (team==="A"){
      if (aSlots.includes(id)) {
  const j = aSlots.findIndex(x=>x===id); if (j>=0) { const nx=[...aSlots]; nx[j]=null; setASlots(nx); }
  return;
}
const i=aSlots.findIndex(x=>x===null); if(i<0) return;
const nx=[...aSlots]; nx[i]=id; setASlots(nx);
    } else {
      if (bSlots.includes(id)) {
  const j = bSlots.findIndex(x=>x===id); if (j>=0) { const nx=[...bSlots]; nx[j]=null; setBSlots(nx); }
  return;
}
const i=bSlots.findIndex(x=>x===null); if(i<0) return;
const nx=[...bSlots]; nx[i]=id; setBSlots(nx);
    }
  };
  const rem = (team:"A"|"B", idx:number)=>{
    if (team==="A"){ const nx=[...aSlots]; nx[idx]=null; setASlots(nx); }
    else { const nx=[...bSlots]; nx[idx]=null; setBSlots(nx); }
  };

  const fullA = aSlots.every(x=>x!==null);
  const fullB = bSlots.every(x=>x!==null);

  const barSlotStyle: React.CSSProperties = { border:"1px solid #e5e7eb", borderRadius:12, minHeight:72, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background:"#fff" };
  const faceBtn: React.CSSProperties = { padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", cursor:"pointer" };

  return (
    <div style={pageWrap}>
      <h1 style={h1}>Arena Multiverso — Seleção</h1>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
        <div style={panel}>
          <div style={header}><strong>Time A</strong><span style={small}>Clique no catálogo para preencher 3 slots</span></div>
          <div style={{padding:12, display:"grid", gap:12}}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
              {aSlots.map((cid,idx)=>(
                <div key={idx} style={barSlotStyle}>
                  <div style={{display:"flex",flexDirection:"column"}}>
                    <strong>A{idx+1}</strong>
                    <span style={small}>{cid?`${cid} • ${CHAR_KITS[cid].name}`:"— vazio —"}</span>
                  </div>
                  {cid && <button style={{...faceBtn, color:"#ef4444"}} onClick={()=>rem("A",idx)}>Remover</button>}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {all.map(id=>(
                <button key={id}
                        style={{...faceBtn, background: aSlots.includes(id)?"#111827":"#fff", color:aSlots.includes(id)?"#fff":"#111827"}}
                        
                        onClick={()=>put("A",id)}>
                  {id} • {CHAR_KITS[id].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={panel}>
          <div style={header}><strong>Time B</strong><span style={small}>Clique no catálogo para preencher 3 slots</span></div>
          <div style={{padding:12, display:"grid", gap:12}}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
              {bSlots.map((cid,idx)=>(
                <div key={idx} style={barSlotStyle}>
                  <div style={{display:"flex",flexDirection:"column"}}>
                    <strong>B{idx+1}</strong>
                    <span style={small}>{cid?`${cid} • ${CHAR_KITS[cid].name}`:"— vazio —"}</span>
                  </div>
                  {cid && <button style={{...faceBtn, color:"#ef4444"}} onClick={()=>rem("B",idx)}>Remover</button>}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {all.map(id=>(
                <button key={id}
                        style={{...faceBtn, background: bSlots.includes(id)?"#111827":"#fff", color:bSlots.includes(id)?"#fff":"#111827"}}
                        
                        onClick={()=>put("B",id)}>
                  {id} • {CHAR_KITS[id].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{...bar, justifyContent:"space-between"}}>
        <div style={small}>Oponente pode repetir os mesmos personagens (sem restrição entre times).</div>
        <button
          style={{...btnPrimary, opacity:(fullA&&fullB)?1:.5, pointerEvents:(fullA&&fullB)?"auto":"none"}}
          onClick={()=>{
            const pickA = { A1:aSlots[0]!, A2:aSlots[1]!, A3:aSlots[2]! };
            const pickB = { B1:bSlots[0]!, B2:bSlots[1]!, B3:bSlots[2]! };
            props.onConfirm(pickA, pickB);
          }}>
          Confirmar seleção
        </button>
      </div>
    </div>
  );
}

/* ===================== Batalha ===================== */
type Pending = { actorTeam:TeamId; actorId:SlotId; skill:ActiveSkill; targetTeam:TeamId } | null;

/* ===================== UI: EnergyChips ===================== */
const ENERGY_META: Record<string,{label:string; icon:string; grad:string; border:string}> = {
  AZUL:{label:"Azul",icon:"??",grad:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"#93c5fd"},
  VERMELHO:{label:"Vermelho",icon:"??",grad:"linear-gradient(135deg,#fef2f2,#fee2e2)",border:"#fca5a5"},
  VERDE:{label:"Verde",icon:"??",grad:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"#6ee7b7"},
  BRANCO:{label:"Branco",icon:"?",grad:"linear-gradient(135deg,#f8fafc,#f1f5f9)",border:"#cbd5e1"},
  PRETA:{label:"Preta",icon:"?",grad:"linear-gradient(135deg,#e5e7eb,#cbd5e1)",border:"#94a3b8"},
};
function EnergyChips({pool}:{pool:Record<string,number>}) {
  const stack: React.CSSProperties = { display:"grid", gap:10 };
  const wrap: React.CSSProperties  = { display:"grid", gridTemplateColumns:"repeat(1,minmax(0,1fr))", gap:10 }; // 1 coluna => mais alto
  const chip: React.CSSProperties  = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:12, fontWeight:700, border:"1px solid #e5e7eb", boxShadow:"0 1px 2px rgba(0,0,0,.06)" };
  const nameStyle: React.CSSProperties = { display:"flex", alignItems:"center", gap:8, fontWeight:700 };
  const total = Object.values(pool as any).reduce((a:number,b:any)=>a + (Number(b)||0), 0);
  return (
    <div style={stack}>
      <div style={wrap}>
        {Object.entries(ENERGY_META).map(([k,m])=>(
          <div key={k} style={{...chip, background:m.grad, borderColor:m.border}}>
            <span style={nameStyle}><span aria-hidden>{m.icon}</span>{m.label}</span>
            <span style={{fontVariantNumeric:"tabular-nums"}}>{(pool as any)[k] ?? 0}</span>
          </div>
        ))}
      </div>
      <div style={{...chip, background:"linear-gradient(135deg,#fafaf9,#f5f5f4)", borderColor:"#d6d3d1"}}>
        <span style={nameStyle}><span aria-hidden>S</span>Total</span>
        <span style={{fontVariantNumeric:"tabular-nums"}}>{total}</span>
      </div>
    </div>
  );
}export default function App(){
  // === Ícones por personagem ===
  const CHAR_ICON: Record<CharacterId, string> = {
    A:"???", B:"???", C:"??", D:"??", E:"??", F:"?"
  };
  const charIcon = (id: CharacterId) => CHAR_ICON[id] ?? "??";

  // === helpers visuais mínimos (não alteram layout) ===
  const ENERGY_COLORS = { AZUL:"#3b82f6", VERMELHO:"#ef4444", VERDE:"#22c55e", BRANCO:"#e5e7eb", PRETA:"#111827" } as const;

  const icon = (sk: ActiveSkill) => {
    const k = sk.effects?.[0]?.kind;
    return k==="DANO"?"\u2694\uFE0F":k==="ESCUDO"?"\uD83D\uDEE1\uFE0F":k==="STUN"?"\uD83D\uDCAB":k==="SILENCE"?"\uD83E\uDD10":k==="DOT"?"\uD83D\uDD25":k==="HOT"?"\u2728":k==="MARCACAO"?"\uD83C\uDFAF":"\uD83E\uDDE9";
  };

  const EnergyView = (pool: Record<"AZUL"|"VERMELHO"|"VERDE"|"BRANCO"|"PRETA", number>) => (
    <div style={{display:"grid", gap:6}}>
      {(["AZUL","VERMELHO","VERDE","BRANCO","PRETA"] as const).map(k=>(
        <div key={k} style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{display:"inline-block", width:10, height:10, borderRadius:999, background:ENERGY_COLORS[k], boxShadow:"inset 0 0 0 1px rgba(0,0,0,.06)"}} />
          <span style={{minWidth:80, fontSize:13, color:"#334155"}}>{k}</span>
          <strong style={{fontSize:13}}>{pool[k]}</strong>
        </div>
      ))}
    </div>
  );

  const engine = useMemo(()=> new RuleEngine(777), []);
  const [state, setState] = useState<BattleState|null>(null);
  const [picksA, setPicksA] = useState<Record<"A1"|"A2"|"A3",CharacterId>|null>(null);
  const [picksB, setPicksB] = useState<Record<"B1"|"B2"|"B3",CharacterId>|null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [queue, setQueue] = useState<{ actorTeam:TeamId; actorId:SlotId; skillId:string; target?:{team:TeamId; id?:SlotId} }[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [turnTimer, setTurnTimer] = useState<number>(60);
  const timerRef = useRef<any>(null);

  const startBattle = (A:Record<"A1"|"A2"|"A3",CharacterId>, B:Record<"B1"|"B2"|"B3",CharacterId>)=>{
    setPicksA(A); setPicksB(B);
    const toRuntime = (slot:SlotId, hp:number)=>({ id:slot, hp, shield:0, cooldowns:{}, effects:[] as any[]});
    const s: BattleState = {
      turnNumber: 0,
      activeTeamId: "A",
      teams: {
        A: { id:"A", characters:[toRuntime("A1",1000),toRuntime("A2",1000),toRuntime("A3",1000)], items:[], energy: emptyEnergy() },
        B: { id:"B", characters:[toRuntime("B1",1200),toRuntime("B2",1100),toRuntime("B3",1100)], items:[], energy: emptyEnergy() },
      },
      settings: { turnDurationSec:60, maxActionsPerTurn:3, maxPerCharacterPerTurn:1 },
    };
    engine.startMatch(s);
    setState(s);
    setTurnTimer(60);
    resetTimer();
    pushLog("Match start: +1 energia para A");
  };

  function resetTimer(){
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTurnTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setQueue([]);
          setPending(null);
          pushLog("?? Timeout: fila descartada. Passando a vez...");
          doEndTurn(true); // reinicia timer próximo turno
          return 60;
        }
        return t - 1;
      });
    }, 1000);
  }

  function pushLog(s:string){ setLog(l=>[...l, `[${new Date().toLocaleTimeString()}] ${s}`]); }

  // === Enfileirar ação: toggle para cancelar a mesma skill; buffs (ALLY) escolhem aliado ===
  function enqueue(slot:SlotId, sk:ActiveSkill){
    if (!state) return;
    const actorTeam = (slot.startsWith("A") ? "A" : "B") as TeamId;
    if (actorTeam !== state.activeTeamId) return;

    // Limites: 3 por turno / 1 por personagem
    if (queue.length >= 3) { pushLog("?? Limite atingido: no máximo 3 ações por turno."); return; }
    const actsByThis = queue.filter(a=>a.actorId===slot).length;
const existingByThisIdx = queue.findIndex(a=>a.actorId===slot && a.skillId===sk.id);
if (actsByThis >= 1 && existingByThisIdx < 0) { pushLog(`?? ${slot} já tem 1 ação na fila.`); return; }

    // Toggle: clicar de novo na mesma skill cancela seleção
    if (pending && pending.actorId===slot && pending.skill.id===sk.id) {
      setPending(null);
      pushLog(`? ${slot} cancelou ${sk.name}`);
      return;
    }

    // Alvos imediatos
    if (sk.target === "SELF") {
  const existing = queue.findIndex(a=>a.actorId===slot && a.skillId===sk.id);
  if (existing >= 0) {
    setQueue(q=> q.filter((_,i)=> i!==existing));
    setPending(null);
    pushLog(`? ${slot} cancelou ${sk.name}`);
  } else {
    setPending(null);
    setQueue(q=>[...q, { actorTeam, actorId:slot, skillId:sk.id, target:{ team: actorTeam, id: slot } }]);
    pushLog(`${slot} preparou ${sk.name} (SELF)`);
  }
  return;
}
    if (sk.target === "ALLY_TEAM") {
  const existing = queue.findIndex(a=>a.actorId===slot && a.skillId===sk.id);
  if (existing >= 0) {
    setQueue(q=> q.filter((_,i)=> i!==existing));
    setPending(null);
    pushLog(`? ${slot} cancelou ${sk.name}`);
  } else {
    setPending(null);
    setQueue(q=>[...q, { actorTeam, actorId:slot, skillId:sk.id, target:{ team: actorTeam } }]);
    pushLog(`${slot} preparou ${sk.name} (ALLY_TEAM)`);
  }
  return;
}

    // Seleção de alvo (ALLY => aliados; ENEMY => inimigos)
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
    if (queue.length === 0) { pushLog("Nada na fila. Passe a vez ou adicione ações."); return; }

    const allA: ActiveSkill[] = (Object.values(picksA??{}) as CharacterId[]).flatMap(cid=>CHAR_KITS[cid].kit);
    const allB: ActiveSkill[] = (Object.values(picksB??{}) as CharacterId[]).flatMap(cid=>CHAR_KITS[cid].kit);
    const mapSkill = (id:string)=> [...allA,...allB].find(s=>s.id===id);

    engine.resolveQueue(state, queue, mapSkill as any);
    pushLog("Fila executada."); setPending(null);
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
                    <strong>{CHAR_KITS[cid]?.name ?? slot}</strong>
                    <span style={small}>{charIcon(cid)} {charIcon(cid)} {cid} • {CHAR_KITS[cid].name}</span>
                  </div>
                  <div style={small}>HP {ch.hp} (+{ch.shield} esc)</div>
                </div>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                  {kit.map(sk=>{
                    const stunned = ch.effects?.some((e:any)=>e.kind==="STUN" && e.duration>0);
                    const silenced = ch.effects?.some((e:any)=>e.kind==="SILENCE" && e.duration>0);
                    const blockedBySilence = silenced && sk.effects.some(e=>!["DANO","ESCUDO"].includes(e.kind));
                    const isPendingThis = !!pending && pending.actorId===slot && pending.skill.id===sk.id;
const queuedThis = queue.some(a=>a.actorId===slot && a.skillId===sk.id);
const active = isPendingThis || queuedThis;
const disabled = !canAct || stunned || blockedBySilence || (!!pending && !isPendingThis);

                    return (
                      <button
                        key={sk.id}
                        disabled={disabled}
                        onClick={(e)=>{ e.stopPropagation(); enqueue(slot, sk); }}
                        style={{
                          ...btn,
                          background: active ? "#eef2ff" : (disabled ? "#f1f5f9" : "#fff"),
                          color: active ? "#3730a3" : (disabled ? "#9ca3af" : "#111827"),
                          borderColor: active ? "#6366f1" : (disabled ? "#e5e7eb" : "#cbd5e1")
                        }}
                      >{icon(sk)} {sk.name}</button>
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
                      {a.actorId} ? {a.skillId} {a.target?.id?`em ${a.target.id}`:`(${a.target?.team==="A"?"time A": "time B"})`}
                    </li>
                  ))}
                </ol>
              }
            </div>
          </div>
          <div style={panel}>
            <div style={header}><strong>Energia</strong></div>
            <div style={{...bodyPad, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:14}}>
              <div>
                <div style={{fontWeight:700, marginBottom:6}}>A</div>
                <EnergyChips pool={state.teams.A.energy} />
              </div>
              <div>
                <div style={{fontWeight:700, marginBottom:6}}>B</div>
                <EnergyChips pool={state.teams.B.energy} />
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










