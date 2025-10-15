import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

/**
 * ===============================
 *  PLACEHOLDERS DE IMAGENS
 *  Substitua as constantes abaixo pelos seus links de imagem quando quiser.
 *  Usei o texto solicitado para facilitar a busca: "> site da sua imagem aqui <"
 * ===============================
 */
const IMG_BG = "> site da sua imagem aqui <";                 // plano de fundo grande da arena
const IMG_FRAME_AVATAR = "> site da sua imagem aqui <";       // moldura quadrada do avatar
const IMG_FRAME_HEALTH = "> site da sua imagem aqui <";       // moldura/barra decorativa do HP
const IMG_ICON_ENERGY = "> site da sua imagem aqui <";        // ícone genérico de energia/habilidade
const IMG_TOPBAR_FRAME = "> site da sua imagem aqui <";       // moldura/ornamento do topo (opcional)

const roleIcon: Record<string, string> = {
  tank: "🛡️",
  mago: "🪄",
  assassino: "🗡️",
  adc: "🏹",
};

export default function BattleUI() {
  const [battle, setBattle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const bgStyle =
    typeof IMG_BG === "string" && IMG_BG.startsWith(">")
      ? {}
      : { backgroundImage: `url(${IMG_BG})`, backgroundSize: "cover", backgroundPosition: "center" };

  async function startBattle() {
    setLoading(true);
    try {
      const res = await axios.post("/api/start");
      setBattle(res.data.battle);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        <p className="mt-3 text-xs opacity-70">
          Substitua as imagens depois: &quot;&gt; site da sua imagem aqui &lt;&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-gray-900" style={bgStyle}>
      <div className="backdrop-blur-sm bg-black/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-wide">Arena Multiverso — Clássico</span>
          </div>
          <div className="text-sm opacity-80">
            Turno <span className="font-semibold">{battle.turn}</span> • Atual:{" "}
            <span className="font-semibold">{battle.currentPlayerId}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 gap-6">
        {battle.state.players.map((p: any, pIndex: number) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: pIndex * 0.2 }}
            className="rounded-2xl bg-black/35 border border-white/10 shadow-xl overflow-hidden"
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded bg-white/10 grid place-items-center text-xs opacity-80">
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold tracking-wide">
                    {p.name} {p.id === battle.currentPlayerId && "👑"}
                  </div>
                  <div className="text-[10px] uppercase opacity-60">Rank — Provisório</div>
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-3 gap-3">
              {p.characters.map((c: any, i: number) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="relative rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                >
                  <div className="relative h-28 grid place-items-center">
                    <div className="w-[72px] h-[72px] rounded bg-black/30 border border-white/10 grid place-items-center text-xs text-white/70">
                      {roleIcon[c.role] ?? "❔"}
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur border border-white/10">
                        {c.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur border border-white/10">
                        {c.role}
                      </span>
                    </div>
                  </div>

                  <div className="relative px-2 pt-2 pb-3">
                    <div className="h-2.5 bg-black/50 rounded overflow-hidden border border-white/10">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-green-500 to-lime-400"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] opacity-80">
                      <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                        {c.hp}/{c.maxHp}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                        {roleIcon[c.role] ?? "❔"}
                      </span>
                    </div>
                  </div>

                  <div className="px-2 pb-2 grid grid-cols-4 gap-1.5">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div
                        key={j}
                        className="relative h-10 rounded bg-black/40 border border-white/10 overflow-hidden grid place-items-center text-[10px] text-white/70"
                      >
                        Skill
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
