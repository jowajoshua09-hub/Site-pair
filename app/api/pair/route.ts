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

  for (let attempt = 1; attempt <= 3; attempt++) {
    const tempDir = path.join("/tmp", `peak-${Date.now()}-${attempt}`);
    fs.mkdirSync(tempDir, { recursive: true });
    let sock: any = null;
    try {
      const { version } = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMultiFileAuthState(tempDir);
      sock = makeWASocket({
        version,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }) as any) },
        logger: pino({ level: "silent" }) as any,
        printQRInTerminal: false,
        browser: ["PEAK-MD","Chrome","122.0.0.0"],
      });
      sock.ev.on("creds.update", saveCreds);
      await delay(2000 + attempt * 1000);
      if (!sock.authState.creds.registered) {
        const code = await sock.requestPairingCode(number);
        const formatted = code?.match(/.{1,4}/g)?.join("-") || code;
        try { sock.end(); } catch {}
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
        return NextResponse.json({ code: formatted });
      }
    } catch (e: any) {
      console.log(`Attempt ${attempt} failed:`, e?.message);
      if (attempt === 3) {
        return NextResponse.json({ error: "Retry - Connection Closed" }, { status: 500 });
      }
      await delay(1500);
    } finally {
      try { if (sock) sock.end(undefined); } catch {}
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
  }
  return NextResponse.json({ error: "Retry" }, { status: 500 });
}
