import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

// === Corrige estado inicial de batalha ===
function normalizeBattle(b: any) {
  if (!b) return b;
  const state = typeof b?.state === "string" ? JSON.parse(b.state) : b?.state;
  return {
    ...b,
    players: b.players ?? state?.players ?? [],
    energy: b.energy ?? state?.energy ?? {},
  };
}

// === Conversão de custos antigos para novos ===
// (B,R,G,Y) → (WHITE, RED, GREEN, BLUE)

function normalizeCost(cost: any) {
  if (!cost) return {};
  const hasOld =
    ("B" in cost) || ("R" in cost) || ("G" in cost) || ("Y" in cost);

  if (hasOld) {
    return {
      WHITE: cost.B ?? 0,
      RED: cost.R ?? 0,
      GREEN: cost.G ?? 0,
      BLUE: cost.Y ?? 0,
    };
  }

  // formato novo
  return {
    RED: cost.RED ?? 0,
    BLUE: cost.BLUE ?? 0,
    WHITE: cost.WHITE ?? 0,
    GREEN: cost.GREEN ?? 0,
  };
}

// === Ícones de classe ===
const roleIcon: Record<string, string> = {
  tank: "🛡️",
  mago: "🪄",
  assassino: "🗡️",
  adc: "🏹",
};

// === Tipos de energia ===
type Color = "RED" | "BLUE" | "WHITE" | "GREEN";


export default function BattleUI() {
  const [battle, setBattle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [sel, setSel] = useState<null | { playerId: string; charId: string; skillId: string }>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [logConsole, setLogConsole] = useState<string[]>([]);

async function startBattle() {
  setLoading(true);
  try {
    const res = await axios.post("/api/start", {
      player1Id: "player1",
      player2Id: "player2",
    });
    setBattle(normalizeBattle(res.data));
    setLogConsole((prev) => [
      ...prev,
      "🕹️ Nova batalha iniciada!",
      `Turno ${res.data.turn}`,
    ]);
    setQueue([]);
    setSel(null);
  } catch (err) {
    console.error(err);
    setLogConsole((prev) => [...prev, "⚠️ Erro ao iniciar batalha"]);
  } finally {
    setLoading(false);
  }
}


  const currentPlayerId: string | null = battle?.currentPlayerId ?? null;
  const energy = (pid: string) => battle?.energy?.[pid] ?? {};

 // Verifica se o jogador tem energia suficiente
 function canPay(pid: string, rawCost: any) {
  const pool = battle?.energy?.[pid] ?? {};
  const cost = normalizeCost(rawCost);
  const keys: Array<"RED" | "BLUE" | "WHITE" | "GREEN"> = ["RED", "BLUE", "WHITE", "GREEN"];
  return keys.every((k) => (pool?.[k] ?? 0) >= (cost?.[k] ?? 0));
}
  // Seleciona ou desmarca uma skill
  function toggleSkill(pId: string, cId: string, skill: any) {
    // Só pode agir no próprio turno
    if (pId !== currentPlayerId) return;

    // Verifica custo e energia
    const cost = normalizeCost(skill?.cost);
    if (!canPay(pId, cost)) return; // sem energia, não seleciona

    // Cada personagem pode agir apenas uma vez por turno
    if (queue.some(a => a.source?.charId === cId)) return;

    // Alterna seleção
    if (sel && sel.playerId === pId && sel.charId === cId && sel.skillId === skill.id) {
      setSel(null); // desfaz seleção
    } else {
      setSel({ playerId: pId, charId: cId, skillId: skill.id });
    }
  }



  // Clique em um alvo (quando existe uma skill selecionada)
  function clickTarget(pId: string, cId: string) {
    if (!sel) return;
    // Não permite alvo aliado para skills ofensivas / ou inimigo para skills de cura/buff/shield
    // (regra final fica no backend; aqui só impedimos alvo do mesmo time para simplificar a UX)
    if (pId === sel.playerId) return;

    const action = { 
      source: { playerId: sel.playerId, charId: sel.charId },
      target: { playerId: pId, charId: cId },
      skillId: sel.skillId,
    };
    setQueue((q) => [...q, action]);
    setSel(null);
  }

  async function passTurn() {
    if (!battle || queue.length === 0) return;
    setSubmitting(true);
    try {
      const res = await axios.post("/api/turn", { battleId: battle.id, actions: queue });
      setBattle(normalizeBattle(res.data.battle));
      setQueue([]);
      setSel(null);

      const lines = (res.data.results ?? []).map((r: any) => {
        if (!r.ok) return `❌ Falha: ${r.reason}`;
        if (r.type === "damage") return `⚔️ ${r.skill} causou ${r.amount} em ${r.target}`;
        if (r.type === "heal")   return `💚 ${r.skill} curou ${r.amount} em ${r.target}`;
        return JSON.stringify(r);
      });
      setLogConsole((prev) => [...prev.slice(-30), `--- TURNO ${res.data.battle.turn - 1} ---`, ...lines]);
    } catch (err) {
      console.error(err);
      setLogConsole((prev) => [...prev, "⚠️ Erro no turno"]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!battle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-gray-900">
        <h1 className="text-3xl font-bold mb-6">Arena Multiverso ⚔️</h1>
        <button
          onClick={startBattle}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-semibold transition-all"
        >
          {loading ? "Iniciando..." : "🕹️ Iniciar Batalha"}
        </button>
        <p className="mt-3 text-xs opacity-70">Clique em “Iniciar” para gerar a batalha.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-gray-900">
      {/* Energy HUD (RED/BLUE/WHITE/GREEN) */}
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-2 text-xs">
        {Array.isArray(battle?.players) && (
          <div className="grid grid-cols-2 gap-3">
            {battle.players.map((p:any) => {
              const e = (battle?.energy?.[p.id]) ?? {};
              const RED   = e.RED   ?? 0;
              const BLUE  = e.BLUE  ?? 0;
              const WHITE = e.WHITE ?? 0;
              const GREEN = e.GREEN ?? 0;
              return (
                <div key={p.id} className="rounded-lg bg-black/30 border border-white/10 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold opacity-90">{p.name}</div>
                    <div className="text-[10px] opacity-60">ID: {p.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-red-600/50 border border-white/10">RED: {RED}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-600/50 border border-white/10">BLUE: {BLUE}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/70 text-black border border-white/10">WHITE: {WHITE}</span>
                    <span className="px-1.5 py-0.5 rounded bg-green-600/50 border border-white/10">GREEN: {GREEN}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Topbar */}
      <div className="backdrop-blur-sm bg-black/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-wide">Arena Multiverso — Clássico</span>
          </div>
          <div className="text-sm opacity-80 flex items-center gap-3">
  <div>
    Turno <span className="font-semibold">{battle.turn}</span> • Atual:{" "}
    <span className="font-semibold">{battle.currentPlayerId}</span>
  </div>

  {/* Wallet (jogador atual) */}
  <div className="flex items-center gap-1">
    {(() => {
      const e = battle?.energy?.[battle?.currentPlayerId] ?? {};
      const RED   = e.RED   ?? 0;
      const BLUE  = e.BLUE  ?? 0;
      const WHITE = e.WHITE ?? 0;
      const GREEN = e.GREEN ?? 0;
      return (
        <>
          <span className="px-1.5 py-0.5 rounded bg-red-600/60 border border-white/10">RED: {RED}</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-600/60 border border-white/10">BLUE: {BLUE}</span>
          <span className="px-1.5 py-0.5 rounded bg-white text-black border border-white/10">WHITE: {WHITE}</span>
          <span className="px-1.5 py-0.5 rounded bg-green-600/60 border border-white/10">GREEN: {GREEN}</span>
        </>
      );
    })()}
  </div>
</div>
        </div>
      </div>

      {/* Grid de jogadores */}
      {Array.isArray(battle?.players) && (
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 gap-6">
          {battle.players.map((p: any, pIndex: number) => (
            <motion.div
              key={p.id ?? pIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: pIndex * 0.2 }}
              className="rounded-2xl bg-black/35 border border-white/10 shadow-xl overflow-hidden p-4"
            >
              {/* Cabeçalho do jogador */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded bg-white/10 grid place-items-center text-xs opacity-80">
                    {(p.name?.slice?.(0, 1)?.toUpperCase?.() ?? p.id?.slice?.(0, 1) ?? "?")}
                  </div>
                  <div>
                    <div className="font-semibold tracking-wide">
                      {p.name ?? `Jogador ${pIndex + 1}`} {p.id === battle.currentPlayerId && "👑"}
                    </div>
                    <div className="text-[10px] uppercase opacity-60">Rank — Provisório</div>
                  </div>
                </div>
                {/* Energia do jogador */}
                <div className="flex items-center gap-2 text-[11px] opacity-80">
                  {(["RED","BLUE","WHITE","GREEN"] as Color[]).map((c) => (
                    <span key={c} className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                      {c}:{battle?.energy?.[p.id]?.[c] ?? 0}
                    </span>
                  ))}
                </div>
              </div>

              {/* Personagens desse jogador */}
              {Array.isArray(p.characters) && (
                <div className="grid grid-cols-3 gap-3">
                  {p.characters.map((c: any, i: number) => {
                    const charUsed = queue.some(a => a.source?.charId === c.id); // 1 skill por personagem/turno
                    return (
                      <motion.div
                        key={c.id ?? i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                        className="relative rounded-xl bg-white/5 border border-white/10 overflow-hidden p-2"
                        onClick={() => sel && sel.playerId !== p.id && clickTarget(p.id, c.id)}
                      >
                        <div className="relative h-20 grid place-items-center">
                          <div className="w-[60px] h-[60px] rounded bg-black/30 border border-white/10 grid place-items-center text-xl">
                            {roleIcon[c.role] ?? "❔"}
                          </div>
                          <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between text-[10px]">
                            <span className="px-1 rounded bg-black/60">{c.name}</span>
                            <span className="px-1 rounded bg-black/60">{c.role}</span>
                          </div>
                        </div>

                        {/* HP */}
                        <div className="h-2.5 bg-black/50 rounded overflow-hidden border border-white/10 mt-2">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: `${Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100))}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-green-500 to-lime-400"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] opacity-80">
                          <span className="px-1 rounded bg-black/40 border border-white/10">
                            {c.hp}/{c.maxHp}
                          </span>
                          <span className="px-1 rounded bg-black/40 border border-white/10">
                            {roleIcon[c.role] ?? "❔"}
                          </span>
                        </div>

                        {/* Skills (até 4) */}
                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                          {(c.skills ?? []).slice(0, 4).map((s: any) => {
                            const selected =
                              sel && sel.playerId === p.id && sel.charId === c.id && sel.skillId === s.id;
                            const disabled =
                              p.id !== currentPlayerId || !canPay(p.id, s.cost || {}) || charUsed;
                            return (
                              <button
                                key={s.id}
                                onClick={(e) => { e.stopPropagation(); toggleSkill(p.id, c.id, s); }}
                                disabled={disabled}
                                className={
                                  "text-[10px] px-1.5 py-1 rounded border transition-all " +
                                  (selected
                                    ? "border-amber-400 ring-2 ring-amber-400/60 bg-amber-500/20"
                                    : "border-white/10 bg-black/40 hover:bg-black/50") +
                                  (disabled ? " opacity-50 cursor-not-allowed" : "")
                                }
                                title={Object.entries(s.cost || {}).map(([k,v]) => `${k}:${v}`).join(" ")}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>

                        {/* Passiva */}
                        <div className="text-[11px] text-amber-300 mt-2">
                          🌀 Passiva: <span className="text-white/90">Em desenvolvimento</span>
                        </div>

                        {/* Slots de item */}
                        <div className="flex gap-2 justify-center mt-2">
                          <div className="w-6 h-6 border border-white/20 bg-black/30 rounded-md" />
                          <div className="w-6 h-6 border border-white/20 bg-black/30 rounded-md" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Ações / Passar turno */}
      <div className="max-w-6xl mx-auto px-4 -mt-2 mb-4 flex items-center gap-3">
        <button
          onClick={passTurn}
          disabled={submitting || currentPlayerId == null}
          className="px-4 py-2 rounded-xl bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 transition-all"
        >
          ▶️ Passar turno ({queue.length})
        </button>
        {sel && (
          <span className="text-xs opacity-80">
            Selecione um <b>alvo inimigo</b> clicando no card do personagem.
          </span>
        )}
      </div>

      {/* Console de log */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3 h-48 overflow-y-auto text-xs font-mono">
          {logConsole.slice().reverse().map((line, i) => (
            <div key={i} className="opacity-80">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}











