"use client";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [number, setNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"web"|"tg">("web");
  const [expire, setExpire] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(()=>{
    if(!code || expire===0) return;
    const id = setInterval(()=> setExpire(s=> s>0? s-1 : 0), 1000);
    return ()=> clearInterval(id);
  },[code, expire]);

  const toggleMusic = async () => {
    if(!audioRef.current) return;
    try{
      if(playing){ audioRef.current.pause(); setPlaying(false); }
      else { await audioRef.current.play(); setPlaying(true); }
    }catch{}
  }

  const getCode = async () => {
    const clean = number.replace(/\D/g,"");
    if(clean.length < 10){ alert("Enter full number with country code, ex: 26378363339"); return; }

    setLoading(true);
    setCode("");
    try{
      const res = await fetch(`/api/pair?number=${clean}`);
      const data = await res.json();
      if(data.code){ setCode(data.code); setExpire(40); if(!playing) toggleMusic(); }
      else { alert(data.error || "Failed to get code"); }
    }catch(e){ alert("Server error"); }
    finally{ setLoading(false); }
  };

  return (
    <main onClick={()=>{ if(!playing && audioRef.current){ audioRef.current.play().then(()=>setPlaying(true)).catch(()=>{}) } }} className="min-h-screen bg-[#050a14] flex justify-center p-4">
      <audio ref={audioRef} src="/bg.mp3" loop preload="auto" />
      <button onClick={(e)=>{e.stopPropagation(); toggleMusic()}} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center">{playing? "🔊" : "🔇"}</button>
      <div className="w-full max-w-[420px]">
        <div className="flex justify-between items-center py-3 text-sm"><div className="font-bold tracking-wider text-white">PEAK—<span className="text-[#6a7bff]">MD</span></div><div className="flex items-center gap-2 text-[11px] text-emerald-400"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> ONLINE</div></div>
        <div className="bg-[#0c1222]/80 backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-5 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a233f] border border-white/5 text-[11px] text-[#8b9eff] mb-4">⚡ PEAK-MD PAIR</div>
          <h1 className="text-[38px] font-extrabold leading-[0.95] text-white">Link<br/><span className="bg-gradient-to-r from-[#8b7dff] to-[#6aa8ff] bg-clip-text text-transparent">WhatsApp</span></h1>
          <p className="text-white/40 text-[13px] mt-2 mb-5">Enter number with country code.</p>
          <div className="grid grid-cols-2 bg-black/40 rounded-xl p-1 mb-4 border border-white/5">
            <button onClick={()=>setTab("web")} className={`py-2.5 rounded-lg text-[13px] font-bold ${tab==="web"? "bg-gradient-to-r from-[#6d5cff] to-[#3b82f6] text-white" : "text-white/30"}`}>🌐 Website</button>
            <button onClick={()=>setTab("tg")} className={`py-2.5 rounded-lg text-[13px] font-bold ${tab==="tg"? "bg-white/10 text-white" : "text-white/30"}`}>✈ Telegram</button>
          </div>
          <div className="relative mb-2"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">📱</span><input value={number} onChange={e=>setNumber(e.target.value)} placeholder="26378363339" className="w-full bg-[#0a0f1e] border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-[15px] outline-none text-white" /></div>
          <button onClick={getCode} disabled={loading} className="w-full bg-gradient-to-r from-[#6d5cff] to-[#3b82f6] py-3.5 rounded-xl font-bold text-[14px] mt-3 text-white disabled:opacity-50">{loading? "Generating..." : "✓ GET PAIR CODE"}</button>
          {code && (<div className="mt-4 bg-[#0a0f1e] border border-white/10 rounded-2xl p-5 text-center"><div className="text-[32px] font-mono font-black tracking-[0.15em] bg-gradient-to-b from-[#a5b8ff] to-[#5a7dff] bg-clip-text text-transparent">{code}</div><div className="text-[12px] text-white/40 mt-1">{expire>0? `Expires in ${expire}s` : "Code expired, refresh"}</div><p className="text-[11px] text-white/30 mt-2">WhatsApp → Settings → Linked Devices → Link with phone number</p><div className="grid grid-cols-2 gap-3 mt-4"><button onClick={()=>navigator.clipboard.writeText(code.replace("-",""))} className="bg-gradient-to-r from-[#6d5cff] to-[#3b82f6] py-2.5 rounded-xl font-bold text-[13px] text-white">Copy</button><button onClick={getCode} className="bg-white/5 border border-white/5 py-2.5 rounded-xl font-bold text-[13px] text-white/80">Refresh</button></div></div>)}
        </div>
      </div>
    </main>
  );
}
