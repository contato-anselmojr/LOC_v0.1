import React, { useState } from "react";
import { motion } from "framer-motion";

interface Character {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
}

export default function BattleUI() {
  const [battle, setBattle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startBattle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/start", { method: "POST" });
      const data = await res.json();
      // compatibilidade com JSON vindo do backend
      setBattle(data.battle || data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (battleId: string, actorId: string, targetId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId, actorId, targetId }),
      });
      const data = await res.json();
      setBattle(data.battle || data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const players = battle?.state?.players ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold mb-8 text-green-400 tracking-wide">
        ‚öîÔ∏è Arena Multiverso
      </h1>

      {!battle && (
        <button
          onClick={startBattle}
          disabled={loading}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl text-xl font-semibold shadow-lg transition"
        >
          {loading ? "Iniciando..." : "ÌµπÔ∏è Iniciar Batalha"}
        </button>
      )}

      {error && <p className="text-red-400 mt-4">‚ùå {error}</p>}

      {battle && (
        <div className="flex justify-between w-full max-w-5xl mt-6">
          {players.map((p: any, idx: number) => (
            <div
              key={p.id}
              className={`flex-1 bg-gray-800/80 rounded-2xl p-6 mx-3 shadow-lg ${
                idx === 0 ? "text-left" : "text-right"
              }`}
            >
              <h2 className={`text-2xl font-bold mb-4 ${idx === 0 ? "text-blue-400" : "text-red-400"}`}>
                {idx === 0 ? "Ì±ë Jogador 1" : "‚öîÔ∏è Jogador 2"}
              </h2>
              {p.characters && p.characters.length > 0 ? (
                <div className="space-y-4">
                  {p.characters.map((c: Character) => (
                    <motion.div
                      key={c.id}
                      className="bg-gray-700/80 rounded-lg p-3 shadow-inner"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex justify-between mb-1">
                        <span>{c.name}</span>
                        <span>
                          {c.hp}/{c.maxHp}
                        </span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            idx === 0 ? "bg-blue-500" : "bg-red-500"
                          }`}
                          style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                        />
                      </div>
                      {idx === 0 && (
                        <button
                          onClick={() => performAction(battle.id, c.id, "p2c1")}
                          className="mt-2 w-full bg-green-600 hover:bg-green-700 rounded-md py-1"
                        >
                          Ì∑°Ô∏è Atacar
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="opacity-50 italic">Sem personagens</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
