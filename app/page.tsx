"use client";
import { useState } from "react";

export default function Home() {
  const [number, setNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const clean = (v: string) => {
    let x = v.replace(/\D/g, "");
    if (x.startsWith("00")) x = x.slice(2);
    if (x.startsWith("0") && x.length >= 10) x = "263" + x.slice(1);
    return x;
  };

  const getCode = async () => {
    setErr(""); setCode("");
    const num = clean(number);
    if (!num || num.length < 10) { setErr("Enter valid number e.g. 26378..."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/pair?number=${num}`);
      const data = await res.json();
      if (data.code) setCode(data.code);
      else setErr(data.error || "Failed to get code");
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-[-200px] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-200px] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3"><span>⚡</span> PEAK-MD PAIR</h1>
        <p className="text-white/60 mt-2 mb-8 text-sm">Link your WhatsApp in 20s • Public</p>

        <div className="flex gap-2">
          <input value={number} onChange={e=>setNumber(e.target.value)} placeholder="26378363309" className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition text-white" />
          <button onClick={getCode} disabled={loading} className="bg-white text-black font-bold px-5 py-3 rounded-xl hover:bg-white/90 disabled:opacity-50 transition">
            {loading? "..." : "Get Pair Code"}
          </button>
        </div>

        {err && <p className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{err}</p>}
        {code && <div className="mt-6 bg-black/70 border border-white/10 rounded-2xl p-6 text-center"><p className="text-xs text-white/50 uppercase tracking-widest">Your Code</p><p className="text-3xl font-mono font-bold tracking-[0.3em] mt-2">{code}</p><p className="text-xs text-white/40 mt-3">Go to WhatsApp - Linked Devices - Link with phone number</p></div>}

        <div className="mt-8 flex flex-col gap-2 text-xs text-white/30">
          <a href="#" className="text-purple-400 hover:underline">Telegram BotAPI Docs</a>
          <p>Built by StarDev-il • Powered by BlackNode</p>
        </div>
      </div>
    </main>
  );
    }
