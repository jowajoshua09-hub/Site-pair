import { NextRequest, NextResponse } from "next/server";
import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";
export const dynamic='force-dynamic';export const runtime='nodejs';export const maxDuration=60;
export async function GET(req:NextRequest){
const number=req.nextUrl.searchParams.get("number")?.replace(/\D/g,"");
if(!number) return NextResponse.json({error:"Number required"},{status:400});
const tempDir=path.join("/tmp",`peak-${Date.now()}`);fs.mkdirSync(tempDir,{recursive:true});let sock:any=null;
try{
const{version}=await fetchLatestBaileysVersion();const{state,saveCreds}=await useMultiFileAuthState(tempDir);
sock=makeWASocket({version,auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:"silent"})as any)},logger:pino({level:"silent"})as any,printQRInTerminal:false,browser:["PEAK-MD","Chrome","1.0.0"]});
sock.ev.on("creds.update",saveCreds);
await new Promise<void>(r=>{const t=setTimeout(()=>r(),3500);sock.ev.on("connection.update",(u:any)=>{if(u.connection==="connecting"||u.qr){clearTimeout(t);r();}})});
await delay(1000);
const code=await sock.requestPairingCode(number);
return NextResponse.json({code:code?.match(/.{1,4}/g)?.join("-")||code});
}catch(err:any){return NextResponse.json({error:"Retry - "+(err?.message||"closed")},{status:500});}
finally{try{sock?.end(undefined);}catch{}try{fs.rmSync(tempDir,{recursive:true,force:true});}catch{}}
  }
