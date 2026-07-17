import { NextRequest, NextResponse } from "next/server";
import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const number = req.nextUrl.searchParams.get("number")?.replace(/\D/g,"");
  if (!number) return NextResponse.json({ error: "Number required" }, { status: 400 });

  const tempDir = path.join("/tmp", `peak-${number}-${Date.now()}`);
  if(!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  let sock: any = null;
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(tempDir);
    
    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }) as any),
      },
      logger: pino({ level: "silent" }) as any,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "22.04"],
      syncFullHistory: false,
    });

    sock.ev.on("creds.update", saveCreds);

    await delay(2000);

    if (sock.authState.creds.registered) {
      return NextResponse.json({ error: "Number already linked. Delete session first." }, { status: 400 });
    }

    const code = await sock.requestPairingCode(number);
    const formatted = code?.match(/.{1,4}/g)?.join("-") || code;

    setTimeout(()=>{ try{ fs.rmSync(tempDir, { recursive: true, force: true }) }catch{} }, 60000);

    return NextResponse.json({ code: formatted });

  } catch (err: any) {
    console.error("PAIR ERROR:", err);
    return NextResponse.json({ error: err?.message || "Connection Closed - Retry" }, { status: 500 });
  } finally {
    try{ if(sock) sock.end(undefined); } catch{}
  }
  }
