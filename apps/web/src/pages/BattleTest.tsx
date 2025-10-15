import React, { useState } from "react";

export default function BattleTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/test");
      if (!res.ok) throw new Error("Erro ao chamar /api/test");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-400">
        Simulador de Batalha
      </h1>

      <button
        onClick={handleRunTest}
        disabled={loading}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-semibold disabled:opacity-50 transition"
      >
        {loading ? "Executando..." : "Iniciar Teste"}
      </button>

      {error && (
        <p className="text-red-400 mt-4 font-medium">❌ {error}</p>
      )}

      {result && (
        <pre className="bg-gray-800 p-4 rounded-lg text-sm mt-6 w-full max-w-2xl overflow-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
