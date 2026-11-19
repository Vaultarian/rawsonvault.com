// Usage: node render_makecode_blocks.mjs <harness.html> <out.json> [timeoutSeconds]
// Opens the harness page in muted headless Chrome, waits until it sets
// document.title to "DONE", then writes the text of #out to out.json.
// Used by render_design8_blocks.py. Needs Node 22+ (built-in WebSocket) and Chrome.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [harness, outFile, tmo = "240"] = process.argv.slice(2);
const port = 9400 + Math.floor(Math.random() * 400);
const prof = mkdtempSync(join(tmpdir(), "mcrender-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--mute-audio", "--disable-gpu", `--remote-debugging-port=${port}`,
  `--user-data-dir=${prof}`, "--window-size=1400,1000", "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, n = 0, title = ""; const pending = new Map();
const send = (method, params = {}) => new Promise(res => {
  const id = ++n; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
});
try {
  let targets;
  for (let k = 0; k < 50; k++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); }
  }
  const page = targets.find(t => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  await sleep(3000); // a freshly started Chrome fails some TLS checks in its first seconds
  await send("Page.navigate", { url: "file://" + resolve(harness) });
  const end = Date.now() + Number(tmo) * 1000;
  while (Date.now() < end) {
    await sleep(1000);
    const r = await send("Runtime.evaluate", { expression: "document.title" });
    title = r?.result?.value || "";
    if (title.startsWith("DONE")) break;
  }
  const r = await send("Runtime.evaluate", { expression: "document.getElementById('out').textContent" });
  writeFileSync(outFile, r?.result?.value || "{}");
} finally { chrome.kill(); }
console.log("state:", title);
process.exit(title.startsWith("DONE") ? 0 : 1);
