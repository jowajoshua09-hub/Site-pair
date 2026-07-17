import { NextRequest, NextResponse } from "next/server";
import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, delay } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const number = req.nextUrl.searchParams.get("number")?.replace(/\D/g,"");
  if (!number) return NextResponse.json({ error: "Number required" }, { status: 400 });

  const tempDir = path.join("/tmp", `peak-${number}-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(tempDir);
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, console as any),
      },
      printQRInTerminal: false,
      browser: ["PEAK-MD", "Chrome", "1.0"],
      syncFullHistory: false,
    });

    sock.ev.on("creds.update", saveCreds);

    await delay(1500);

    if (!sock.authState.creds.registered) {
      const pairingCode = await sock.requestPairingCode(number);
      const formatted = pairingCode?.match(/.{1,4}/g)?.join("-") || pairingCode;

      // cleanup after 2 min
      setTimeout(()=>{ try{ fs.rmSync(tempDir, { recursive: true, force: true }) }catch{} }, 120000);

      return NextResponse.json({ code: formatted });
    } else {
      return NextResponse.json({ error: "Already registered" }, { status: 400 });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to generate code" }, { status: 500 });
  }
    }
