import { NextRequest, NextResponse } from "next/server";
import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const number = req.nextUrl.searchParams.get("number")?.replace(/\D/g,"");
  if (!number) return NextResponse.json({ error: "Number required" }, { status: 400 });

  const tempDir = path.join("/tmp", `peak-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  let sock: any = null;
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(tempDir);

    sock = makeWASocket({
      version,
      auth: { 
        creds: state.creds, 
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }) as any) 
      },
      logger: pino({ level: "silent" }) as any,
      printQRInTerminal: false,
      browser: ["Chrome (Linux)", "", ""],
      markOnlineOnConnect: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
    });

    sock.ev.on("creds.update", saveCreds);
    await delay(3500);

    const code = await sock.requestPairingCode(number);
    await delay(500);
    const formatted = code?.match(/.{1,4}/g)?.join("-") || code;
    return NextResponse.json({ code: formatted });

  } catch (err: any) {
    console.log("PAIR ERROR:", err?.message);
    return NextResponse.json({ error: "Connection Closed - Try Again" }, { status: 500 });
  } finally {
    try { if(sock) sock.end(undefined); } catch {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}
