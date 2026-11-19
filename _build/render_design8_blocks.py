#!/usr/bin/env python3
"""Render the block pictures for the Year 8 Design lesson pages.

Reads PROGRAMS from build_design8_lessons.py, sends each program to MakeCode's own block
renderer (makecode.microbit.org/--docs?render=1) inside headless Chrome, and saves
    myp/design/y8-robotics/blocks/<id>.png
plus _build/design8_blocks.json (size and code hash of every picture).

HOST ONLY: needs node (22+) and Google Chrome. Not an injector; Tim never runs it.
Run it after editing any program:   python3 _build/render_design8_blocks.py
    --all   render every picture again, not only the new or changed ones
Chrome runs muted. DESIGN8_ROOT redirects the output, as in the injector.
Added 2026-11-19.
"""
import base64, json, os, subprocess, sys, tempfile

import build_design8_lessons as B

OUT = os.path.join(B.ROOT, B.UNIT, "blocks")

HARNESS = """<!doctype html><meta charset="utf-8"><title>WAIT</title><pre id="out"></pre>
<script>
const JOBS = __JOBS__;
let i = 0; const res = {};
const f = document.createElement("iframe");
f.src = "https://makecode.microbit.org/--docs?render=1&lang=en";
f.style = "position:absolute;width:1px;height:1px;border:0";
document.body.appendChild(f);
function next() {
  if (i >= JOBS.length) { document.getElementById("out").textContent = JSON.stringify(res); document.title = "DONE"; return; }
  const j = JOBS[i];
  f.contentWindow.postMessage({ type: "renderblocks", id: j.id, code: j.code, options: j.pkg ? { package: j.pkg } : {} }, "*");
}
window.addEventListener("message", ev => {
  const m = ev.data; if (!m || m.source != "makecode") return;
  if (m.type == "renderready") next();
  else if (m.type == "renderblocks") { res[m.id] = { w: m.width, h: m.height, uri: m.uri || "", err: m.error || null }; i++; next(); }
});
</script>"""


def main():
    man = {}
    if os.path.exists(B.MANIFEST):
        with open(B.MANIFEST, encoding="utf-8") as f:
            man = json.load(f)
    todo = [p for p in B.PROGRAMS
            if "--all" in sys.argv or man.get(p, {}).get("hash") != B.code_hash(p)
            or not os.path.exists(os.path.join(OUT, p + ".png"))]
    if not todo:
        print("all block pictures are current")
        return
    jobs = [dict(id=p, code=B.PROGRAMS[p], pkg=B.TPBOT_PKG if p.startswith("t") else "") for p in todo]
    tmp = tempfile.mkdtemp(prefix="design8-")
    harness, out = os.path.join(tmp, "harness.html"), os.path.join(tmp, "out.json")
    with open(harness, "w", encoding="utf-8") as f:
        f.write(HARNESS.replace("__JOBS__", json.dumps(jobs)))
    subprocess.run(["node", os.path.join(B.HERE, "render_makecode_blocks.mjs"), harness, out], check=True)
    with open(out, encoding="utf-8") as f:
        res = json.load(f)
    os.makedirs(OUT, exist_ok=True)
    bad = []
    for p in todo:
        r = res.get(p) or {}
        uri = r.get("uri", "")
        if not uri.startswith("data:image/png;base64,") or not r.get("w"):
            bad.append(f"{p}: {r.get('err') or 'no picture returned'}")
            continue
        with open(os.path.join(OUT, p + ".png"), "wb") as f:
            f.write(base64.b64decode(uri.split(",", 1)[1]))
        # MakeCode returns 4x pixels; 2x is sharp on any screen at a third of the bytes.
        subprocess.run(["sips", "--resampleWidth", str(round(r["w"] * 2)), os.path.join(OUT, p + ".png")],
                       check=True, stdout=subprocess.DEVNULL)
        man[p] = dict(w=r["w"], h=r["h"], hash=B.code_hash(p))
        print(f"rendered {p}  {r['w']} x {r['h']}")
    man = {k: man[k] for k in sorted(man) if k in B.PROGRAMS}
    with open(B.MANIFEST, "w", encoding="utf-8") as f:
        json.dump(man, f, indent=1)
        f.write("\n")
    if bad:
        raise SystemExit("FAILED:\n  " + "\n  ".join(bad))


if __name__ == "__main__":
    main()
