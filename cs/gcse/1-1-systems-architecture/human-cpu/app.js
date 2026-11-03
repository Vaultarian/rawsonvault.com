/* Human CPU — app.js
   Part 1 (pure, no DOM): the step generator and the beat engine.
   Part 2 (DOM): the whiteboard screen. Runs only when #app exists,
   so tests.html can load this file and test Part 1 on its own.

   Golden rule: everything on screen is derived from (run, beat index, modes).
   Animations only decorate a transition; they never hold state. */

(function (root) {
  "use strict";
  var D = root.HCPU_DATA;

  /* ------------------------------------------------------------------ *
   *  Part 1a — words and labels                                         *
   * ------------------------------------------------------------------ */

  var ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
    "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  var TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty",
    "seventy", "eighty", "ninety"];

  function words(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
    return String(n);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* How a memory cell is written on a card / board: "LOAD 5", "12", "empty". */
  function cellText(c) {
    if (c === null || c === undefined) return "empty";
    if (typeof c === "number") return String(c);
    return c.op + (c.n !== undefined ? " " + c.n : "");
  }
  /* How a memory cell is said out loud: "Load five", "Twelve". */
  function cellSpoken(c) {
    if (typeof c === "number") return cap(words(c));
    return cap(c.op.toLowerCase()) + (c.n !== undefined ? " " + words(c.n) : "");
  }
  function isInstr(c) { return c !== null && typeof c === "object"; }
  /* Memory seats are M0..M7. (MAR and MDR also start with M.) */
  function isMem(id) { return /^M\d$/.test(id); }

  var MEANING = {
    LOAD: function (n) { return "put the number at address " + n + " into the accumulator"; },
    ADD: function (n) { return "add the number at address " + n + " to the accumulator"; },
    STORE: function (n) { return "write the accumulator's total into address " + n; },
    STOP: function () { return "the program is finished"; }
  };

  var ROLE_NAMES = {
    PC: "PC", MAR: "MAR", MDR: "MDR", CU: "CU", ALU: "ALU", ACC: "ACC"
  };
  function roleLabel(id, envelope) {
    if (ROLE_NAMES[id]) return ROLE_NAMES[id];
    if (isMem(id)) return "Memory " + id.slice(1);
    if (id.charAt(0) === "X") return (envelope ? "Runner " : "Recorder ") + id.slice(1);
    return id;
  }

  /* ------------------------------------------------------------------ *
   *  Part 1b — the step generator                                       *
   * ------------------------------------------------------------------ */

  function snapshot(s) {
    return { PC: s.PC, MAR: s.MAR, MDR: s.MDR, ACC: s.ACC, mem: s.mem.slice() };
  }

  /* generateRun(runNo, opts) -> { steps, cycles, initial, trips }
     opts.envelope: wording for Envelope mode (same steps, same values). */
  function generateRun(runNo, opts) {
    opts = opts || {};
    var env = !!opts.envelope;
    var prog = D.programs[runNo];
    var s = { PC: 0, MAR: null, MDR: null, ACC: null, mem: prog.memory.slice() };
    var initial = snapshot(s);
    var steps = [];
    var cycles = [];
    var trip = 0;            // memory trips so far (Envelope mode runners rotate on this)
    var reads = [];          // addresses read, in order
    var firstMemRead = true, firstExecMar = true, firstAlu = true;
    var addr5Reads = 0;

    function runnerFor(t) { return "X" + ((t % 4) + 1); }

    function push(step) {
      var before = steps.length ? steps[steps.length - 1].after : initial;
      step.after = snapshot(s);
      step.changed = [];
      ["PC", "MAR", "MDR", "ACC"].forEach(function (k) {
        if (before[k] !== step.after[k]) step.changed.push(k);
      });
      for (var a = 0; a < 8; a++) {
        if (before.mem[a] !== step.after.mem[a]) step.changed.push("mem" + a);
      }
      step.index = steps.length;          // 0-based
      step.number = steps.length + 1;      // 1-based, as shown on screen
      steps.push(step);
      return step;
    }

    var halted = false, cycleNo = 0;
    while (!halted && cycleNo < 20) {
      cycleNo++;
      var pc = s.PC;
      var instr = s.mem[pc];
      var cyc = { number: cycleNo, address: pc, instr: instr, label: cellText(instr), firstStep: steps.length };
      cycles.push(cyc);
      var base = { cycle: cycleNo, instr: cellText(instr) };

      function mk(stage, code, actor, fields) {
        var st = { stage: stage, code: code, actor: actor };
        for (var k in base) st[k] = base[k];
        for (var f in fields) st[f] = fields[f];
        return st;
      }

      /* Steps follow the Kitchen CPU play script (v1.2), told with the CPU's
         own names. Each cycle: fetch F1-F7, decode D1-D2, then execute. */

      /* ---------- FETCH ---------- */
      push(mk("fetch", "F1", "CU", {
        say: (cycleNo === 1 ? "OK, team, let's get started." : "OK, team, let's continue.") + " PC, call out our address!",
        does: "Starts the fetch.",
        lib: "Every cycle starts with the CU asking for the address of the next instruction.",
        anim: [{ type: "pulse", from: "CU", to: "PC", token: "order", text: "" }]
      }));
      push(mk("fetch", "F2", "PC", {
        say: "We're on address " + words(pc) + "!", does: "Tells the MAR its address.",
        lib: "The PC holds the address of the next instruction. It does not know what is stored there.",
        anim: [{ type: "move", from: "PC", to: "MAR", token: "num", text: String(pc) }]
      }));
      var rF = runnerFor(trip);
      s.MAR = pc;
      push(mk("fetch", "F3", "MAR", {
        say: "Got it! Memory, get address " + words(pc) + " ready for reading. Wait for the command.",
        does: env ? "Wipes the board, writes " + pc + " and hands a slip with " + pc + " on it to " + roleLabel(rF, true) + ", who walks to Memory " + pc + "."
                  : "Wipes the board and writes " + pc + ".",
        lib: "The address travels from the MAR to memory on the address bus, one way only.",
        runner: env ? rF : null, memAddr: pc, route: "out",
        anim: env ? [{ type: "move", from: "MAR", via: rF, to: "M" + pc, token: "slip", text: String(pc) }]
                  : [{ type: "pulse", from: "MAR", to: "M" + pc, token: "addr", text: String(pc) }]
      }));
      push(mk("fetch", "F4", "CU", {
        say: "Approved! Read!", does: "Sends the read signal to memory.",
        lib: "The read signal goes from the CU to memory on the control bus. Memory acts only on the CU's signal.",
        memAddr: pc,
        callout: cycleNo === 1 ? "The MAR says where. The CU says what to do: read or write." : null,
        anim: [{ type: "pulse", from: "CU", to: "M" + pc, token: "order", text: "" }]
      }));
      reads.push(pc);
      push(mk("fetch", "F5", "M" + pc, {
        say: env ? null : cellText(instr) + ".",
        act: env ? "Gives " + roleLabel(rF, true) + " a sealed copy envelope." : null,
        does: env ? "Checks the slip says " + pc + " and keeps its original. It says nothing: the contents are inside."
                  : "Reads its contents out. It keeps them.",
        lib: "Memory sends a copy of what is stored at address " + pc + " back on the data bus.",
        runner: env ? rF : null, memAddr: pc, reading: pc, route: "at",
        callout: firstMemRead ? "Reading memory copies it. Address " + pc + " still holds " + cellText(instr) + "." : null,
        anim: [{ type: "glow", at: "M" + pc }]
      }));
      firstMemRead = false;
      s.MDR = cellText(instr);
      push(mk("fetch", "F6", "MDR", {
        say: null,
        act: env ? "Opens the envelope and writes " + cellText(instr) + "." : null,
        does: env ? "Takes it from " + roleLabel(rF, true) + " and wipes the board first."
                  : "Writes " + cellText(instr) + " down.",
        lib: "The MDR holds whatever has just come from memory: here, an instruction.",
        runner: env ? rF : null, memAddr: pc, route: "back",
        anim: env ? [{ type: "move", from: "M" + pc, via: rF, to: "MDR", token: isInstr(instr) ? "env-instr" : "env-data", text: cellText(instr) }]
                  : [{ type: "pulse", from: "M" + pc, to: "MDR", token: isInstr(instr) ? "instr" : "data", text: cellText(instr) }]
      }));
      trip++;
      s.PC = pc + 1;
      push(mk("fetch", "F7", "PC", {
        say: null,
        does: "In the meantime, adds 1 and writes " + (pc + 1) + ", ready for the next fetch.",
        lib: "The PC goes up by 1 during the fetch, before the instruction is even decoded.",
        callout: "The PC is exactly 1 more than the MAR. Check it.",
        anim: [{ type: "glow", at: "PC" }]
      }));

      /* ---------- DECODE ---------- */
      push(mk("decode", "D1", "MDR", {
        say: cellText(instr) + ".", does: "Passes the instruction to the CU.",
        lib: "The instruction goes from the MDR to the CU.",
        anim: [{ type: "move", from: "MDR", to: "CU", token: isInstr(instr) ? "instr" : "data", text: cellText(instr) }]
      }));
      var meaning = isInstr(instr) && MEANING[instr.op] ? MEANING[instr.op](instr.n) : "this is not an instruction";
      push(mk("decode", "D2", "CU", {
        say: cellText(instr) + " means: " + meaning + ".",
        does: "Decodes the instruction.",
        lib: "The CU matches the instruction against the instruction set and works out who has to act.",
        anim: [{ type: "glow", at: "CU" }]
      }));

      /* ---------- EXECUTE ---------- */
      var op = isInstr(instr) ? instr.op : "STOP";
      var n = instr && instr.n;

      if (op === "LOAD" || op === "ADD") {
        push(mk("execute", "E1", "CU", {
          say: "MAR, I need address " + n + ".", does: "Gives the MAR an address from the instruction.",
          lib: "This time the address comes from the instruction, not from the PC.",
          anim: [{ type: "pulse", from: "CU", to: "MAR", token: "order", text: "" }]
        }));
        var rE = runnerFor(trip);
        s.MAR = n;
        push(mk("execute", "E2", "MAR", {
          say: "Got it! Memory, get address " + n + " ready for reading. Wait for the command.",
          does: env ? "Wipes the board, writes " + n + " and hands a slip with " + n + " on it to " + roleLabel(rE, true) + ", who walks to Memory " + n + "."
                    : "Wipes the board and writes " + n + ".",
          lib: "The address goes to memory on the address bus.",
          runner: env ? rE : null, memAddr: n, route: "out",
          callout: firstExecMar ? "The MAR and MDR work twice in one cycle: once in fetch and again in execute." : null,
          anim: env ? [{ type: "move", from: "MAR", via: rE, to: "M" + n, token: "slip", text: String(n) }]
                    : [{ type: "pulse", from: "MAR", to: "M" + n, token: "addr", text: String(n) }]
        }));
        firstExecMar = false;
        push(mk("execute", "E3", "CU", {
          say: "Read!", does: "Sends the read signal to memory.",
          lib: "The read signal goes on the control bus.",
          memAddr: n,
          anim: [{ type: "pulse", from: "CU", to: "M" + n, token: "order", text: "" }]
        }));
        var val = s.mem[n];
        reads.push(n);
        if (n === 5) addr5Reads++;
        push(mk("execute", "E4", "M" + n, {
          say: env ? null : val + ".",
          act: env ? "Gives " + roleLabel(rE, true) + " a sealed copy envelope." : null,
          does: env ? "Checks the slip says " + n + " and keeps its original. It says nothing: the contents are inside."
                    : "Reads its contents out. It keeps them.",
          lib: "Memory sends a copy of " + val + " back on the data bus.",
          runner: env ? rE : null, memAddr: n, reading: n, route: "at",
          callout: (runNo === 2 && n === 5 && addr5Reads === 2) ? "Address 5 has been read twice and still says 12." : null,
          anim: [{ type: "glow", at: "M" + n }]
        }));
        s.MDR = String(val);
        push(mk("execute", "E5", "MDR", {
          say: null,
          act: env ? "Opens the envelope and writes " + val + "." : null,
          does: env ? "Takes it from " + roleLabel(rE, true) + " and wipes the board first."
                    : "Writes " + val + " down.",
          lib: "The MDR now holds data, not an instruction.",
          runner: env ? rE : null, memAddr: n, route: "back",
          anim: env ? [{ type: "move", from: "M" + n, via: rE, to: "MDR", token: "env-data", text: String(val) }]
                    : [{ type: "pulse", from: "M" + n, to: "MDR", token: "data", text: String(val) }]
        }));
        trip++;

        if (op === "LOAD") {
          push(mk("execute", "E6", "CU", {
            say: "Accumulator, you are asked to hold " + val + ".", does: "Gives the ACC its order.",
            lib: "LOAD copies the MDR's number into the accumulator.",
            anim: [{ type: "pulse", from: "CU", to: "ACC", token: "order", text: "" }]
          }));
          s.ACC = val;
          push(mk("execute", "E7", "ACC", {
            say: val + "! Got it!", does: "Now holds " + val + ".",
            lib: "The accumulator holds " + val + ".",
            anim: [{ type: "move", from: "MDR", to: "ACC", token: "data", text: String(val) }]
          }));
        } else {
          push(mk("execute", "E6", "CU", {
            say: "ALU, take what is in the accumulator now and add the number in the MDR. How much is that?",
            does: "Gives the ALU its order.",
            lib: "The CU gives the order. It does no arithmetic itself.",
            anim: [{ type: "pulse", from: "CU", to: "ALU", token: "order", text: "" }]
          }));
          var a = s.ACC, b = val, sum = a + b;
          push(mk("execute", "E7", "ALU", {
            say: "The accumulator had " + a + ", and adding " + b + " more makes " + sum + ". Accumulator, you now have " + sum + "!",
            does: "Takes the ACC's number and the MDR's number, adds them, and gives the answer to the ACC.",
            lib: "The ALU does the sum: " + a + " + " + b + " = " + sum + ".",
            callout: firstAlu ? "The CU gives the orders. The ALU does the sums." : null,
            sum: { a: a, b: b, sum: sum },
            anim: [{ type: "move", from: "ACC", to: "ALU", token: "data", text: String(a) },
                   { type: "move", from: "MDR", to: "ALU", token: "data", text: String(b) },
                   { type: "move", from: "ALU", to: "ACC", token: "data", text: String(sum) }]
          }));
          firstAlu = false;
          s.ACC = sum;
          push(mk("execute", "E8", "ACC", {
            say: sum + "! Got it!", does: "Now holds " + sum + " in place of " + a + ".",
            lib: "The accumulator's old value is replaced by the answer.",
            anim: [{ type: "glow", at: "ACC" }]
          }));
        }
      } else if (op === "STORE") {
        push(mk("execute", "E1", "CU", {
          say: "MAR, please get memory ready for address " + n + ".",
          does: "Gives the MAR an address from the instruction.",
          lib: "STORE needs an address too: the place the answer will be written.",
          anim: [{ type: "pulse", from: "CU", to: "MAR", token: "order", text: "" }]
        }));
        var rS = runnerFor(trip);
        s.MAR = n;
        push(mk("execute", "E2", "MAR", {
          say: "Memory, get address " + n + " ready for writing. Wait for the command.",
          does: env ? "Wipes the board, writes " + n + " and hands a slip with " + n + " on it to " + roleLabel(rS, true) + ". No command from the CU yet: Memory " + n + " waits."
                    : "Wipes the board and writes " + n + ". No command from the CU yet: Memory " + n + " waits.",
          lib: "The address goes to memory on the address bus. Nothing is written until the CU signals.",
          runner: env ? rS : null, memAddr: n,
          callout: firstExecMar ? "The MAR and MDR work twice in one cycle: once in fetch and again in execute." : null,
          anim: env ? [{ type: "move", from: "MAR", to: rS, token: "slip", text: String(n) }]
                    : [{ type: "pulse", from: "MAR", to: "M" + n, token: "addr", text: String(n) }]
        }));
        firstExecMar = false;
        push(mk("execute", "E3", "CU", {
          say: "Accumulator, show the MDR your total.", does: "Gives the ACC its order.",
          lib: "The value to be stored comes from the accumulator.",
          anim: [{ type: "pulse", from: "CU", to: "ACC", token: "order", text: "" }]
        }));
        var accVal = s.ACC;
        push(mk("execute", "E4", "ACC", {
          say: null, does: "Shows " + accVal + " to the MDR and keeps its number.",
          lib: "The accumulator keeps its number. STORE copies it; it does not move it.",
          anim: [{ type: "move", from: "ACC", to: "MDR", token: "data", text: String(accVal) }]
        }));
        s.MDR = String(accVal);
        push(mk("execute", "E5", "MDR", {
          say: null, does: "Copies " + accVal + " down.",
          lib: "The MDR holds the value on its way to memory.",
          anim: [{ type: "glow", at: "MDR" }]
        }));
        push(mk("execute", "E6", "MDR", {
          say: env ? null : accVal + ".",
          act: env ? "Seals " + accVal + " in an envelope marked " + n + "." : null,
          does: env ? "Writes " + accVal + " on a new slip, seals it and hands it to " + roleLabel(rS, true) + ", who carries it to Memory " + n + "."
                    : "Walks over and hands the number to Memory " + n + ".",
          lib: "The value travels from the MDR to memory on the data bus. The data bus works both ways.",
          runner: env ? rS : null, memAddr: n, route: "deliver", walk: true,
          anim: env ? [{ type: "walk", from: "MDR", via: rS, to: "M" + n, token: "env-data", text: String(accVal) }]
                    : [{ type: "walk", from: "MDR", to: "M" + n, token: "data", text: String(accVal) }]
        }));
        trip++;
        push(mk("execute", "E7", "CU", {
          say: "Write!", does: "Sends the write signal to memory.",
          lib: "The write signal goes on the control bus.",
          memAddr: n,
          anim: [{ type: "pulse", from: "CU", to: "M" + n, token: "order", text: "" }]
        }));
        s.mem[n] = accVal;
        push(mk("execute", "E8", "M" + n, {
          say: null,
          does: env ? "Opens the envelope and writes " + accVal + " in its box, in pencil."
                    : "Writes " + accVal + " in its box, in pencil.",
          lib: "Address " + n + " now holds " + accVal + ".",
          memAddr: n,
          callout: "The accumulator did not change. STORE copies out; it does not move.",
          anim: [{ type: "glow", at: "M" + n }]
        }));
      } else {
        push(mk("execute", "E1", "CU", {
          say: "OK, everyone, we are done! Memory says STOP, so we stop. Well done, team!",
          does: "Nobody else does anything.",
          lib: "STOP ends the program. The PC only ever held the next address.",
          callout: "The PC does not know the program. It only holds the next address. STOP is what ends it.",
          anim: [{ type: "glow", at: "CU" }]
        }));
        halted = true;
      }
      cyc.lastStep = steps.length - 1;
      cyc.trace = {
        MAR: steps[cyc.firstStep + 2].after.MAR,
        MDR: steps[cyc.firstStep + 5].after.MDR,
        PC: steps[cyc.firstStep + 6].after.PC,
        ACC: steps[cyc.lastStep].after.ACC
      };
    }
    return { run: runNo, steps: steps, cycles: cycles, initial: initial, trips: trip, reads: reads };
  }

  /* ------------------------------------------------------------------ *
   *  Part 1c — check-it questions and teacher notes                     *
   * ------------------------------------------------------------------ */

  function checkQuestion(run, step) {
    var c = run.cycles[step.cycle - 1];
    if (step.stage === "fetch") {
      if (c.number % 2 === 1) {
        return "The PC is " + step.after.PC + " and the MAR is " + step.after.MAR + ". What is the link?";
      }
      return "Which two registers hold an address?";
    }
    if (step.stage === "decode") return "Who decoded the instruction, and who will do any sum?";
    var op = c.label.split(" ")[0];
    if (op === "LOAD" || op === "ADD") return "Which register changed, and why?";
    if (op === "STORE") return "Which register did not change?";
    return "What does address 7 hold, and how did it get there?";
  }

  var STAGE_NOTE = {
    fetch: "By the end of fetch the class should say: the PC's address goes to the MAR, memory sends back what is there, the MDR holds it, and the PC goes up by 1.",
    decode: "By the end of decode the class should say: the CU works out what the instruction means and who has to act.",
    execute: "By the end of execute the class should say: the CU gives the orders, and the instruction is carried out using the MAR, MDR, ALU and ACC."
  };

  /* ------------------------------------------------------------------ *
   *  Part 1d — beats: the click-by-click sequence                       *
   *  kind: start | predict | step | check | end                         *
   * ------------------------------------------------------------------ */

  function buildBeats(run, modes) {
    var beats = [{ kind: "start", step: -1 }];
    var checks = modes.checks || modes.predict;
    run.steps.forEach(function (st, i) {
      if (modes.predict) beats.push({ kind: "predict", step: i });
      beats.push({ kind: "step", step: i });
      var next = run.steps[i + 1];
      var stageEnds = !next || next.stage !== st.stage || next.cycle !== st.cycle;
      if (checks && stageEnds) beats.push({ kind: "check", step: i, question: checkQuestion(run, st) });
    });
    beats.push({ kind: "end", step: run.steps.length - 1 });
    return beats;
  }

  /* The register state a beat shows. Pure: depends only on (run, beat). */
  function stateAt(run, beat) {
    if (beat.kind === "start") return run.initial;
    if (beat.kind === "predict") return beat.step === 0 ? run.initial : run.steps[beat.step - 1].after;
    return run.steps[beat.step].after;
  }

  /* Map a step index to its "revealed" beat, used when modes change. */
  function beatForStep(beats, stepIdx) {
    if (stepIdx < 0) return 0;
    for (var i = 0; i < beats.length; i++) {
      if (beats[i].kind === "step" && beats[i].step === stepIdx) return i;
    }
    return 0;
  }

  var Engine = {
    words: words, isMem: isMem, cellText: cellText, cellSpoken: cellSpoken, roleLabel: roleLabel,
    generateRun: generateRun, buildBeats: buildBeats, stateAt: stateAt,
    beatForStep: beatForStep, checkQuestion: checkQuestion, STAGE_NOTE: STAGE_NOTE
  };
  root.HCPU = Engine;
  if (typeof module !== "undefined") module.exports = Engine;

  /* ================================================================== *
   *  Part 2 — the screen                                                *
   * ================================================================== */

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("app")) startApp();
  });

  function startApp() {
    var SVGNS = "http://www.w3.org/2000/svg";
    var $ = function (id) { return document.getElementById(id); };
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- storage (names + swaps stay in this browser only) ---------- */
    var STORE_KEY = "human-cpu-v1";
    function load() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
    }
    function save() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({
          names: S.names, seats1: S.seats[1], seats2: S.seats[2],
          theme: S.theme, desk: S.desk
        }));
      } catch (e) { /* private window: carry on without saving */ }
    }
    var stored = load();

    function validSeats(a) {
      return Array.isArray(a) && a.length === 18 &&
        D.roles.every(function (r) { return a.indexOf(r) !== -1; });
    }

    /* ---------- the whole app state: a run, a beat index, and switches ---------- */
    var S = {
      runNo: 1,
      beat: 0,
      modes: { predict: false, checks: false, library: false, callouts: true, notes: false,
               envelope: false, trace: false, sound: false, controlsHidden: false },
      names: Array.isArray(stored.names) && stored.names.length === 18 ? stored.names : new Array(18).fill(""),
      seats: {
        1: validSeats(stored.seats1) ? stored.seats1 : D.run1Seats.slice(),
        2: validSeats(stored.seats2) ? stored.seats2 : D.run2Seats.slice()
      },
      theme: stored.theme === "light" ? "light" : "dark",
      desk: ["left", "centre", "right"].indexOf(stored.desk) !== -1 ? stored.desk : D.teacherDesk
    };
    var RUN = null, BEATS = null;

    function rebuild(keepStep) {
      var stepIdx = keepStep !== undefined ? keepStep : -1;
      RUN = generateRun(S.runNo, { envelope: S.modes.envelope });
      BEATS = buildBeats(RUN, S.modes);
      S.beat = beatForStep(BEATS, stepIdx);
    }
    function currentStepIdx() {
      var b = BEATS[S.beat];
      if (b.kind === "start") return -1;
      if (b.kind === "predict") return b.step - 1;
      return b.step;
    }

    /* ---------- map geometry: the Von Neumann diagram ----------
       Every role has a fixed box, so the picture matches the diagram the
       class drew. Seats still carry names (E), but no longer move boxes. */
    var MAP = { w: 1260, h: 690 };
    var BOX = {
      CU:  { x: 150, y: 128, w: 220, h: 112 },
      ALU: { x: 490, y: 128, w: 220, h: 112 },
      ACC: { x: 150, y: 368, w: 230, h: 112 },
      MAR: { x: 490, y: 368, w: 230, h: 112 },
      PC:  { x: 150, y: 498, w: 230, h: 112 },
      MDR: { x: 490, y: 498, w: 230, h: 112 },
      X1:  { x: 785, y: 300, w: 96, h: 58 }, X2: { x: 785, y: 370, w: 96, h: 58 },
      X3:  { x: 785, y: 440, w: 96, h: 58 }, X4: { x: 785, y: 510, w: 96, h: 58 }
    };
    for (var mi = 0; mi < 8; mi++) BOX["M" + mi] = { x: 1062, y: 148 + mi * 66, w: 340, h: 60, mem: mi };
    var FULL = { PC: "Program Counter", MAR: "Memory Address Reg.", MDR: "Memory Data Reg.",
                 CU: "Control Unit", ALU: "Arithmetic Logic Unit", ACC: "Accumulator" };
    function seatOf(roleId) { return S.seats[S.runNo].indexOf(roleId); }
    function posOf(roleId) { var b = BOX[roleId]; return b ? { x: b.x, y: b.y } : { x: MAP.w / 2, y: 60 }; }

    /* ---------- build the static SVG once; update classes per render ---------- */
    var svg = $("map");
    svg.setAttribute("viewBox", "0 0 " + MAP.w + " " + MAP.h);
    function el(tag, attrs, parent) {
      var e = document.createElementNS(SVGNS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    var gRoom = el("g", { "class": "room" }, svg);
    var gRoutes = el("g", { "class": "routes" }, svg);
    var gSeats = el("g", { "class": "seats" }, svg);
    var gFx = el("g", { "class": "fx" }, svg);

    function txt(x, y, cls, t, anchor, parent) {
      var e = el("text", { x: x, y: y, "class": cls, "text-anchor": anchor || "middle" }, parent || gRoom);
      e.textContent = t; return e;
    }
    /* CPU: outer box, register box, cache */
    el("rect", { x: 14, y: 14, width: 832, height: 662, rx: 14, "class": "vn-outer" }, gRoom);
    el("rect", { x: 30, y: 44, width: 696, height: 616, rx: 10, "class": "vn-cpu" }, gRoom);
    txt(378, 66, "vn-title", "Central Processing Unit (CPU)");
    el("rect", { x: 46, y: 272, width: 664, height: 300, rx: 10, "class": "vn-regs" }, gRoom);
    txt(62, 300, "vn-label", "Registers", "start");
    el("rect", { x: 46, y: 592, width: 664, height: 52, rx: 8, "class": "vn-cache" }, gRoom);
    txt(378, 627, "vn-label", "Cache");
    /* RAM */
    el("rect", { x: 878, y: 14, width: 368, height: 662, rx: 14, "class": "vn-outer" }, gRoom);
    txt(1062, 62, "vn-title vn-title-big", "Main Memory (RAM)");
    el("rect", { x: 892, y: 84, width: 340, height: 30, rx: 4, "class": "vn-head" }, gRoom);
    txt(942, 107, "vn-head-text", "Address");
    txt(1112, 107, "vn-head-text", "Data");
    /* buses: drawn once, static, labelled */
    function arrowHead(x, y, dir) {
      var d = dir > 0 ? "M" + x + "," + y + " l-18,-11 l0,22 z" : "M" + x + "," + y + " l18,-11 l0,22 z";
      el("path", { d: d, "class": "vn-arrowhead" }, gRoom);
    }
    el("line", { x1: 260, y1: 128, x2: 380, y2: 128, "class": "vn-bus" }, gRoom);
    arrowHead(380, 128, 1); arrowHead(260, 128, -1);
    el("line", { x1: 150, y1: 184, x2: 150, y2: 312, "class": "vn-bus vn-bus-short" }, gRoom);
    el("line", { x1: 490, y1: 184, x2: 490, y2: 312, "class": "vn-bus vn-bus-short" }, gRoom);
    el("line", { x1: 605, y1: 368, x2: 872, y2: 368, "class": "vn-bus vn-bus-addr" }, gRoom);
    arrowHead(890, 368, 1);
    txt(737, 356, "vn-bus-label", "address bus");
    el("line", { x1: 623, y1: 498, x2: 872, y2: 498, "class": "vn-bus vn-bus-data" }, gRoom);
    arrowHead(890, 498, 1); arrowHead(605, 498, -1);
    txt(737, 486, "vn-bus-label", "data bus");
    el("path", { d: "M150,72 L150,30 L860,30 L860,170 L872,170", "class": "vn-bus vn-bus-ctrl" }, gRoom);
    arrowHead(890, 170, 1);
    txt(737, 24, "vn-bus-label", "control bus (read / write)");

    /* one box per role */
    var boxEls = {};
    Object.keys(BOX).forEach(function (roleId) {
      var b = BOX[roleId];
      var g = el("g", { "class": "seat", "data-role": roleId, transform: "translate(" + b.x + "," + b.y + ")", tabindex: 0, role: "button" }, gSeats);
      el("rect", { x: -b.w / 2 - 6, y: -b.h / 2 - 6, width: b.w + 12, height: b.h + 12, rx: 16, "class": "seat-halo" }, g);
      el("rect", { x: -b.w / 2, y: -b.h / 2, width: b.w, height: b.h, rx: 10, "class": "seat-box" }, g);
      var t1, t2, t3, ic;
      if (b.mem !== undefined) {
        el("line", { x1: -b.w / 2 + 100, y1: -b.h / 2, x2: -b.w / 2 + 100, y2: b.h / 2, "class": "vn-col" }, g);
        t1 = el("text", { x: -b.w / 2 + 50, y: 12, "text-anchor": "middle", "class": "seat-role" }, g);
        t2 = el("text", { x: 50, y: 12, "text-anchor": "middle", "class": "seat-sub vn-mem-val" }, g);
        t3 = el("text", { x: 0, y: 0, "class": "seat-name" }, g);
      } else if (roleId.charAt(0) === "X") {
        t1 = el("text", { x: 0, y: -2, "text-anchor": "middle", "class": "seat-role vn-small" }, g);
        t2 = el("text", { x: 0, y: 22, "text-anchor": "middle", "class": "seat-sub vn-small" }, g);
        t3 = el("text", { x: 0, y: 0, "class": "seat-name" }, g);
      } else {
        var reg = ["PC", "MAR", "MDR", "ACC"].indexOf(roleId) !== -1;
        t1 = el("text", { x: 0, y: -b.h / 2 + 34, "text-anchor": "middle", "class": "seat-role" }, g);
        t2 = el("text", { x: 0, y: b.h / 2 - (reg ? 12 : 18), "text-anchor": "middle", "class": "seat-sub " + (reg ? "vn-reg-val" : "vn-full") }, g);
        t3 = el("text", { x: 0, y: -b.h / 2 + 58, "text-anchor": "middle", "class": "seat-name vn-full" }, g);
      }
      ic = el("g", { "class": "seat-icon", transform: "translate(" + (b.w / 2 - 22) + "," + (-b.h / 2 + 20) + ")" }, g);
      boxEls[roleId] = { g: g, role: t1, sub: t2, name: t3, icon: ic };
    });

    /* ---------- tokens and paths ---------- */
    function tokenNode(kind, text) {
      var g = el("g", { "class": "token token-" + kind });
      if (kind === "slip") {
        el("rect", { x: -34, y: -24, width: 68, height: 48, rx: 4, "class": "tk-slip" }, g);
      } else if (kind === "env-instr" || kind === "env-data") {
        el("rect", { x: -46, y: -30, width: 92, height: 60, rx: 5, "class": "tk-env" }, g);
        el("path", { d: "M-46,-30 L0,4 L46,-30", "class": "tk-env-flap" }, g);
      } else if (kind === "order") {
        el("circle", { r: 18, "class": "tk-order" }, g);
      } else {
        el("rect", { x: -54, y: -26, width: 108, height: 52, rx: 26, "class": "tk-pill" }, g);
      }
      if (text) {
        var t = el("text", { x: 0, y: (kind.indexOf("env") === 0 ? 24 : 10), "text-anchor": "middle", "class": "tk-text" }, g);
        t.textContent = text;
      }
      return g;
    }
    /* A hop between the CPU and memory travels along its bus:
       MAR -> address bus, MDR <-> data bus, CU -> control bus. */
    function busPts(from, to) {
      var mFrom = isMem(from), mTo = isMem(to);
      if (mFrom === mTo) return [posOf(from), posOf(to)];
      var cpu = mFrom ? to : from, mem = mFrom ? from : to;
      var m = BOX[mem], edge = { x: m.x - m.w / 2, y: m.y };
      var pts;
      if (cpu === "MAR") pts = [posOf("MAR"), { x: 605, y: 368 }, { x: 860, y: 368 }, { x: 860, y: m.y }, edge];
      else if (cpu === "MDR") pts = [posOf("MDR"), { x: 623, y: 498 }, { x: 860, y: 498 }, { x: 860, y: m.y }, edge];
      else if (cpu === "CU") pts = [posOf("CU"), { x: 150, y: 30 }, { x: 860, y: 30 }, { x: 860, y: m.y }, edge];
      else pts = [posOf(cpu), edge];
      if (mFrom) pts.reverse();
      pts[mFrom ? 0 : pts.length - 1] = posOf(mem);
      return pts;
    }
    function routePoints(a) {
      if (a.via) return busPts(a.from, a.via).concat(busPts(a.via, a.to).slice(1));
      return busPts(a.from, a.to);
    }
    /* Paths between seats. A hop along one row bows up over the row,
       so it never runs through the words on the seats in between. */
    function segs(pts) {
      var out = [];
      for (var k = 1; k < pts.length; k++) {
        var a = pts[k - 1], b = pts[k];
        var c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        out.push({ a: a, c: c, b: b, len: Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(c.y - (a.y + b.y) / 2) });
      }
      return out;
    }
    function polyD(pts) {
      return segs(pts).map(function (s, k) {
        return (k ? "" : "M" + s.a.x.toFixed(1) + "," + s.a.y.toFixed(1)) +
          " Q" + s.c.x.toFixed(1) + "," + s.c.y.toFixed(1) + " " + s.b.x.toFixed(1) + "," + s.b.y.toFixed(1);
      }).join("");
    }
    function along(pts, t) {
      var ss = segs(pts), total = 0;
      ss.forEach(function (s) { total += s.len; });
      var d = t * total;
      for (var k = 0; k < ss.length; k++) {
        var s = ss[k];
        if (d <= s.len || k === ss.length - 1) {
          var u = s.len ? Math.min(1, d / s.len) : 1, v = 1 - u;
          return { x: v * v * s.a.x + 2 * v * u * s.c.x + u * u * s.b.x,
                   y: v * v * s.a.y + 2 * v * u * s.c.y + u * u * s.b.y };
        }
        d -= s.len;
      }
      return pts[pts.length - 1];
    }

    var animToken = 0;
    function playAnims(step, instant) {
      animToken++;
      var my = animToken;
      while (gFx.firstChild) gFx.removeChild(gFx.firstChild);
      if (!step || !step.anim) return;
      var moves = step.anim.filter(function (a) { return a.type !== "glow"; });
      if (step.route === "at" && step.memAddr !== undefined) {
        var outAt = routePoints({ from: "MAR", via: step.runner || null, to: "M" + step.memAddr });
        el("path", { d: polyD(outAt), "class": "route route-ghost route-addr" }, gFx);
      }
      if (!moves.length) return;
      /* the dotted route stays drawn for the whole step, so the out-and-back is visible */
      /* the out-and-back: while memory answers or the MDR receives, keep the outward route drawn too */
      if ((step.route === "back") && step.memAddr !== undefined) {
        var outFrom = routePoints({ from: "MAR", via: step.runner || null, to: "M" + step.memAddr });
        el("path", { d: polyD(outFrom), "class": "route route-ghost route-addr" }, gFx);
      }
      moves.forEach(function (a) {
        el("path", { d: polyD(routePoints(a)), "class": "route route-" + a.type + " route-" + a.token }, gFx);
      });
      if (reduceMotion || instant) return;   /* the route and the highlights carry it */
      var per = Math.min(760 / moves.length, 520);
      moves.forEach(function (a, k) {
        var pts = routePoints(a);
        var tk = tokenNode(a.token, a.text);
        tk.style.opacity = "0";
        gFx.appendChild(tk);
        var t0 = performance.now() + k * per;
        (function frame(now) {
          if (my !== animToken) return;
          var t = (now - t0) / per;
          if (t < 0) { requestAnimationFrame(frame); return; }
          if (t > 1) t = 1;
          var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          var p = along(pts, e);
          tk.style.opacity = "1";
          tk.setAttribute("transform", "translate(" + p.x + "," + p.y + ")");
          if (t < 1) requestAnimationFrame(frame);
          else setTimeout(function () { if (my === animToken) tk.style.opacity = "0"; }, 350);
        })(performance.now());
      });
    }

    /* ---------- sound (muted by default) ---------- */
    var audio = null;
    function tone(stage) {
      if (!S.modes.sound) return;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        var f = { fetch: 523.25, decode: 659.25, execute: 783.99 }[stage];
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, audio.currentTime);
        g.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.35);
        o.connect(g); g.connect(audio.destination);
        o.start(); o.stop(audio.currentTime + 0.4);
      } catch (e) { /* no audio: fine */ }
    }

    /* ---------- render: everything from (run, beat, modes) ---------- */
    var lastRendered = { run: null, beat: null };
    function render(opts) {
      opts = opts || {};
      var beat = BEATS[S.beat];
      var st = beat.step >= 0 ? RUN.steps[beat.step] : null;
      var revealed = beat.kind === "step";
      var state = stateAt(RUN, beat);
      var env = S.modes.envelope;
      var body = document.body;

      body.dataset.theme = S.theme;
      body.classList.toggle("controls-hidden", S.modes.controlsHidden);
      body.classList.toggle("envelope", env);

      /* stage strip */
      var stage = beat.kind === "start" ? null : beat.kind === "end" ? "execute" :
        (beat.kind === "predict" ? RUN.steps[beat.step].stage : st.stage);
      ["fetch", "decode", "execute"].forEach(function (sg) {
        $("chip-" + sg).classList.toggle("lit", stage === sg);
      });
      body.dataset.stage = stage || "none";
      var stepNo = beat.kind === "predict" ? RUN.steps[beat.step].number : (st ? st.number : 0);
      $("step-count").textContent = beat.kind === "start" ? "Ready · " + RUN.steps.length + " steps" :
        "Step " + stepNo + " of " + RUN.steps.length;
      var cycNo = beat.kind === "start" ? 1 : RUN.steps[beat.step].cycle;
      var cyc = RUN.cycles[cycNo - 1];
      $("cycle-count").textContent = "Cycle " + cycNo + " of " + RUN.cycles.length + ": " + cyc.label;
      $("run-name").textContent = "Run " + S.runNo + (env ? " · Envelopes" : "");

      /* who acts */
      var actor = (revealed && st) ? st.actor : null;
      var runner = (revealed && st && env) ? st.runner : null;

      /* map */
      Object.keys(boxEls).forEach(function (roleId) {
        var se = boxEls[roleId];
        var nm = S.names[seatOf(roleId)] || "";
        var isMemRole = isMem(roleId), spare = roleId.charAt(0) === "X";
        se.role.textContent = isMemRole ? roleId.slice(1) : roleLabel(roleId, env);
        se.sub.textContent = seatSub(roleId, state, env);
        se.name.textContent = (isMemRole || spare) ? "" : (nm || FULL[roleId] || "");
        var cls = "seat role-" + roleClass(roleId);
        if (spare && !env) cls += " vn-hidden";
        if (actor) cls += (roleId === actor) ? " actor" : " dim";
        if (runner && roleId === runner) cls += " runner-walking";
        if (st && revealed && st.memAddr !== undefined && st.memAddr !== null && roleId === "M" + st.memAddr && roleId !== actor) cls += " target";
        if (revealed && opts.forward && st.changed.indexOf(isMemRole ? "mem" + roleId.slice(1) : roleId) !== -1) cls += " vn-flash";
        se.g.setAttribute("class", cls);
        se.g.setAttribute("aria-label", roleLabel(roleId, env) + (nm ? ", " + nm : ""));
        drawSeatIcon(se.icon, roleId, env);
      });

      /* instruction panel */
      var who = $("who"), say = $("say"), does = $("does"), lib = $("lib");
      $("panel").dataset.kind = beat.kind;
      if (beat.kind === "start") {
        who.textContent = RUN.steps.length + " steps · " + RUN.cycles.length + " cycles";
        say.textContent = "Ready. PC = 0. The accumulator is empty.";
        say.className = "say action";
        does.textContent = "Click, tap or press Space to start the first fetch.";
        lib.textContent = S.modes.library ? "The PC starts at 0: the first instruction is at address 0." : "";
      } else if (beat.kind === "predict") {
        var ps = RUN.steps[beat.step];
        who.textContent = cap(ps.stage) + " · " + ps.code;
        say.textContent = "Who acts next?";
        say.className = "say ask";
        does.textContent = "Say it before the next click.";
        lib.textContent = "";
      } else if (beat.kind === "check") {
        who.textContent = "Check it · end of " + st.stage;
        say.textContent = beat.question;
        say.className = "say ask";
        does.textContent = "Talk to the person next to you, then click.";
        lib.textContent = "";
      } else if (beat.kind === "end") {
        who.textContent = "The program has ended";
        say.textContent = "Address 7 holds " + state.mem[7] + ".";
        say.className = "say action";
        does.textContent = RUN.steps.length + " steps · " + RUN.cycles.length + " cycles · " + RUN.trips + " memory trips";
        lib.textContent = S.modes.library ? "Address 7 now holds the answer." : "";
      } else {
        who.textContent = roleLabel(st.actor, env) + (S.names[seatOf(st.actor)] ? " · " + S.names[seatOf(st.actor)] : "");
        if (st.say) {
          say.textContent = "“" + st.say + "”";
          say.className = "say";
        } else {
          say.textContent = st.act || st.does;
          say.className = "say action";
        }
        does.textContent = (st.say || st.act) ? st.does : "";
        lib.textContent = S.modes.library ? st.lib : "";
      }
      $("panel").classList.toggle("has-lib", !!lib.textContent);

      /* callout banner */
      var co = (revealed && S.modes.callouts && st.callout) ? st.callout : "";
      $("callout").textContent = co ? "Notice this: " + co : "";
      $("callout").hidden = !co;

      /* register board */
      ["PC", "MAR", "MDR", "ACC"].forEach(function (k) {
        var v = state[k];
        $("reg-" + k).querySelector(".reg-val").textContent = (v === null || v === undefined) ? "empty" : String(v);
        $("reg-" + k).classList.toggle("is-empty", v === null || v === undefined);
        $("reg-" + k).classList.toggle("is-long", v !== null && v !== undefined && String(v).length > 3);
      });
      for (var a = 0; a < 8; a++) {
        var cell = $("mem-" + a);
        var c = state.mem[a];
        cell.querySelector(".mem-val").textContent = cellText(c);
        cell.dataset.kind = c === null ? "empty" : (typeof c === "number" ? "data" : "instr");
        cell.classList.toggle("reading", !!(revealed && st && st.reading === a));
        cell.classList.toggle("called", !!(revealed && st && st.memAddr === a && st.reading !== a));
      }
      /* flashes only when stepping forward onto a step */
      if (revealed && opts.forward) {
        st.changed.forEach(function (k) {
          var node = k.indexOf("mem") === 0 ? $("mem-" + k.slice(3)) : $("reg-" + k);
          if (!node) return;
          node.classList.remove("flash"); void node.offsetWidth; node.classList.add("flash");
        });
      } else {
        document.querySelectorAll(".flash").forEach(function (n) { n.classList.remove("flash"); });
      }

      /* end overlay */
      $("end").hidden = beat.kind !== "end";
      if (beat.kind === "end") {
        $("end-val").textContent = state.mem[7];
        $("end-sub").textContent = "Run " + S.runNo + ": " + RUN.steps.length + " steps, " + RUN.cycles.length + " cycles, " + RUN.trips + " memory trips.";
      }

      /* teacher notes */
      $("notes").hidden = !S.modes.notes;
      if (S.modes.notes) {
        var ns = beat.kind === "predict" ? RUN.steps[beat.step] : st;
        var txt = ns ? STAGE_NOTE[ns.stage] : "Run " + S.runNo + ". Hand out roles, then start. Recorders fill in the trace table.";
        if (ns && ns.callout) txt = ns.callout + "  ·  " + txt;
        $("notes-text").textContent = txt;
      }

      /* trace table */
      $("trace").hidden = !S.modes.trace;
      if (S.modes.trace) renderTrace();

      /* envelope tools */
      $("envtools").hidden = !env;
      if (env) {
        var tripsDone = tripsSoFar();
        $("trips").textContent = "Trips: " + tripsDone + " of " + RUN.trips;
        $("skipwalk").disabled = !walkEnd();
      }

      /* toggles reflect state */
      document.querySelectorAll("[data-toggle]").forEach(function (b) {
        b.setAttribute("aria-pressed", S.modes[b.dataset.toggle] ? "true" : "false");
      });
      document.querySelectorAll("[data-run]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(+b.dataset.run === S.runNo));
      });
      $("btn-back").disabled = S.beat === 0;
      $("btn-next").disabled = S.beat === BEATS.length - 1;

      /* live region: one sentence per beat */
      $("live").textContent = beat.kind === "step"
        ? cap(st.stage) + ". " + roleLabel(st.actor, env) + ": " + (st.say || st.does)
        : $("say").textContent;

      /* motion */
      if (revealed && opts.forward) {
        playAnims(st, false);
        if (st.number === 1 || RUN.steps[st.index - 1].stage !== st.stage) tone(st.stage);
      } else if (revealed) {
        playAnims(st, true);
      } else {
        playAnims(null);
      }
      closeCard();
      fitSay();
    }

    /* Long lines shrink to fit the panel, never below 1.3rem. */
    function fitSay() {
      var pm = $("panel").querySelector(".panel-main"), say = $("say");
      say.style.fontSize = "";
      var fs = parseFloat(getComputedStyle(say).fontSize);
      var min = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.6;
      var guard = 0;
      while (pm.scrollHeight > pm.clientHeight + 1 && fs > min && guard++ < 60) {
        fs -= 1.5; say.style.fontSize = fs + "px";
      }
    }

    function roleClass(id) {
      if (isMem(id)) return "mem";
      if (id.charAt(0) === "X") return "spare";
      return id.toLowerCase();
    }
    function seatSub(roleId, state, env) {
      if (isMem(roleId)) return cellText(state.mem[+roleId.slice(1)]);
      if (state[roleId] !== undefined) return state[roleId] === null ? "empty" : String(state[roleId]);
      if (roleId === "CU") return "gives orders";
      if (roleId === "ALU") return "does sums";
      if (roleId.charAt(0) === "X") return env ? "carries" : "trace table";
      return "";
    }
    function drawSeatIcon(g, roleId, env) {
      while (g.firstChild) g.removeChild(g.firstChild);
      if (!env) return;
      if (roleId === "PC" || roleId === "MAR") {
        el("rect", { x: -14, y: -10, width: 28, height: 20, rx: 2, "class": "ico-slip" }, g);
      } else if (roleId === "MDR" || roleId === "ACC") {
        el("rect", { x: -16, y: -11, width: 32, height: 22, rx: 2, "class": "ico-env" }, g);
        el("path", { d: "M-16,-11 L0,2 L16,-11", "class": "ico-env-flap" }, g);
      }
    }

    function renderTrace() {
      var body = $("trace-body");
      body.innerHTML = "";
      var cur = currentStepIdx();
      RUN.cycles.forEach(function (c) {
        var tr = document.createElement("tr");
        var f = c.firstStep;
        var cells = [
          c.number,
          cur >= f + 2 ? c.trace.MAR : "",
          cur >= f + 4 ? c.trace.MDR : "",
          cur >= f + 5 ? c.trace.PC : "",
          cur >= c.lastStep ? (c.trace.ACC === null ? "empty" : c.trace.ACC) : ""
        ];
        cells.forEach(function (v) { var td = document.createElement("td"); td.textContent = v; tr.appendChild(td); });
        if (cur >= f && cur <= c.lastStep) tr.className = "current";
        body.appendChild(tr);
      });
    }

    function tripsSoFar() {
      var cur = currentStepIdx(), n = 0;
      for (var i = 0; i <= cur; i++) {
        var s = RUN.steps[i];
        if ((s.route === "back") || s.route === "deliver") n++;
      }
      return n;
    }
    /* "Skip the walk": from the start of a trip, jump to where the trip ends. */
    function walkEnd() {
      var cur = currentStepIdx();
      var s = RUN.steps[cur];
      var nx = RUN.steps[cur + 1];
      if (s && (s.route === "out" || s.route === "at")) {
        for (var i = cur + 1; i < RUN.steps.length; i++) if (RUN.steps[i].route === "back") return i;
      }
      if (nx && nx.walk) return nx.index;
      if (s && s.route === "deliver") return cur + 1;
      return null;
    }

    /* ---------- navigation ---------- */
    function next() {
      if (S.beat < BEATS.length - 1) { S.beat++; render({ forward: true }); }
    }
    function back() {
      if (S.beat > 0) { S.beat--; render({ forward: false }); }
    }
    function gotoStep(idx) {
      S.beat = beatForStep(BEATS, idx);
      if (S.modes.predict && idx >= 0) S.beat -= 1;   /* land on the question, not the answer */
      render({ forward: true });
    }
    function restart() { S.beat = 0; render(); }
    function setRun(n) { S.runNo = n; S.modes.trace = (n === 2); rebuild(-1); render(); }
    function setMode(m, val) {
      var keep = currentStepIdx();
      S.modes[m] = val === undefined ? !S.modes[m] : val;
      if (m === "predict" || m === "checks" || m === "envelope") rebuild(keep);
      render();
    }
    function replayCycle() {
      var b = BEATS[S.beat]; if (b.step < 0) return;
      gotoStep(RUN.cycles[RUN.steps[b.step].cycle - 1].firstStep);
    }
    function nextCycle() {
      var b = BEATS[S.beat];
      var c = b.step < 0 ? 0 : RUN.steps[b.step].cycle;
      if (c < RUN.cycles.length) gotoStep(RUN.cycles[c].firstStep);
    }
    function nextStage() {
      var cur = Math.max(0, BEATS[S.beat].step);
      var stg = RUN.steps[cur].stage, cyc = RUN.steps[cur].cycle;
      if (BEATS[S.beat].kind === "start") { gotoStep(0); return; }
      for (var i = cur + 1; i < RUN.steps.length; i++) {
        if (RUN.steps[i].stage !== stg || RUN.steps[i].cycle !== cyc) { gotoStep(i); return; }
      }
    }
    function skipWalk() {
      var target = walkEnd();
      if (target === null) return;
      S.beat = beatForStep(BEATS, target);
      render({ forward: false });
    }

    /* ---------- info cards (register or seat click: never advances) ---------- */
    var INFO = {
      PC: ["ADDRESS", "Program Counter. Holds the address of the next instruction to fetch."],
      MAR: ["ADDRESS", "Memory Address Register. Holds the address the CPU is about to read from or write to."],
      MDR: ["DATA", "Memory Data Register. Holds the instruction or data that has just come from memory, or is about to go to it."],
      ACC: ["DATA", "Accumulator. Holds the result of the latest calculation."],
      CU: ["", "Control Unit. Decodes each instruction and gives every order."],
      ALU: ["", "Arithmetic Logic Unit. Does every sum and comparison."]
    };
    var cardFor = null;
    function openCard(key, anchor) {
      var card = $("card");
      if (cardFor === key) { closeCard(); return; }
      cardFor = key;
      var state = stateAt(RUN, BEATS[S.beat]);
      var env = S.modes.envelope;
      var title, tag = "", holds = "", job = "";
      if (key.indexOf("mem") === 0 || isMem(key)) {
        var a = +(key.replace("mem", "").replace("M", ""));
        title = "Memory " + a;
        var c = state.mem[a];
        holds = cellText(c);
        tag = c === null ? "" : (typeof c === "number" ? "DATA" : "INSTRUCTION");
        job = "A numbered location in main memory. Reading it copies what it holds; it keeps its card.";
      } else if (key.charAt(0) === "X") {
        title = roleLabel(key, env);
        job = env ? "Carries request slips out to memory and envelopes back, and takes the new number to address 7 for STORE."
                  : "Fills in the trace table and checks the registers match the screen.";
      } else {
        title = INFO[key] ? key : key;
        tag = INFO[key][0];
        holds = state[key] !== undefined ? (state[key] === null ? "empty" : String(state[key])) : "";
        job = INFO[key][1];
      }
      card.querySelector(".card-title").textContent = title;
      card.querySelector(".card-tag").textContent = tag;
      card.querySelector(".card-tag").dataset.tag = tag;
      card.querySelector(".card-holds").textContent = holds ? "Holds: " + holds : "";
      card.querySelector(".card-job").textContent = job;
      card.hidden = false;
      var r = anchor.getBoundingClientRect();
      var cw = card.offsetWidth, ch = card.offsetHeight;
      var x = Math.min(window.innerWidth - cw - 12, Math.max(12, r.left + r.width / 2 - cw / 2));
      var y = r.top - ch - 12; if (y < 12) y = r.bottom + 12;
      card.style.left = x + "px"; card.style.top = y + "px";
    }
    function closeCard() { cardFor = null; $("card").hidden = true; }

    /* ---------- seat editor ---------- */
    function buildEditor() {
      var list = $("seat-list");
      list.innerHTML = "";
      var seats = S.seats[S.runNo];
      $("ed-run").textContent = "Run " + S.runNo;
      for (var i = 0; i < 18; i++) {
        var row = document.createElement("label");
        row.className = "ed-row";
        var lab = document.createElement("span");
        lab.className = "ed-seat";
        lab.textContent = "R" + (Math.floor(i / 6) + 1) + " S" + (i % 6 + 1) + " · " + roleLabel(seats[i], S.modes.envelope);
        var inp = document.createElement("input");
        inp.type = "text"; inp.maxLength = 18; inp.value = S.names[i] || ""; inp.dataset.seat = i;
        inp.setAttribute("autocomplete", "off"); inp.setAttribute("aria-label", "Name for seat " + (i + 1));
        inp.addEventListener("input", function (e) {
          S.names[+e.target.dataset.seat] = e.target.value; save(); render();
        });
        row.appendChild(lab); row.appendChild(inp);
        list.appendChild(row);
      }
      ["swap-a", "swap-b"].forEach(function (id) {
        var sel = $(id); sel.innerHTML = "";
        seats.forEach(function (r, k) {
          var o = document.createElement("option"); o.value = k;
          o.textContent = roleLabel(r, S.modes.envelope) + " (row " + (Math.floor(k / 6) + 1) + ", seat " + (k % 6 + 1) + ")";
          sel.appendChild(o);
        });
      });
      $("swap-b").selectedIndex = 1;
      $("desk-pos").value = S.desk;
    }
    function toggleEditor(force) {
      var ed = $("editor");
      var open = force !== undefined ? force : ed.hidden;
      ed.hidden = !open;
      if (open) buildEditor();
    }

    /* ---------- wire up ---------- */
    $("btn-next").addEventListener("click", function (e) { e.stopPropagation(); next(); });
    $("btn-back").addEventListener("click", function (e) { e.stopPropagation(); back(); });
    document.querySelectorAll("[data-toggle]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); setMode(b.dataset.toggle); });
    });
    document.querySelectorAll("[data-run]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); setRun(+b.dataset.run); });
    });
    $("btn-restart").addEventListener("click", function (e) { e.stopPropagation(); restart(); });
    $("btn-replay").addEventListener("click", function (e) { e.stopPropagation(); replayCycle(); });
    $("btn-nextcycle").addEventListener("click", function (e) { e.stopPropagation(); nextCycle(); });
    $("btn-nextstage").addEventListener("click", function (e) { e.stopPropagation(); nextStage(); });
    $("btn-seats").addEventListener("click", function (e) { e.stopPropagation(); toggleEditor(); });
    $("btn-full").addEventListener("click", function (e) { e.stopPropagation(); fullscreen(); });
    $("btn-theme").addEventListener("click", function (e) { e.stopPropagation(); toggleTheme(); });
    $("btn-hide").addEventListener("click", function (e) { e.stopPropagation(); setMode("controlsHidden"); });
    $("skipwalk").addEventListener("click", function (e) { e.stopPropagation(); skipWalk(); });

    /* timer for Envelope mode */
    var timer = { start: 0, acc: 0, running: false, h: null };
    function fmt(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function tick() { $("timer").textContent = fmt(timer.acc + (timer.running ? performance.now() - timer.start : 0)); }
    $("timer-go").addEventListener("click", function (e) {
      e.stopPropagation();
      if (timer.running) { timer.acc += performance.now() - timer.start; timer.running = false; clearInterval(timer.h); $("timer-go").textContent = "Start"; }
      else { timer.start = performance.now(); timer.running = true; timer.h = setInterval(tick, 250); $("timer-go").textContent = "Pause"; }
      tick();
    });
    $("timer-reset").addEventListener("click", function (e) {
      e.stopPropagation(); timer.acc = 0; timer.start = performance.now(); tick();
    });

    /* editor */
    $("editor").addEventListener("click", function (e) { e.stopPropagation(); });
    $("ed-close").addEventListener("click", function () { toggleEditor(false); });
    $("ed-swap").addEventListener("click", function () {
      var a = +$("swap-a").value, b = +$("swap-b").value;
      if (a === b) return;
      var seats = S.seats[S.runNo], t = seats[a]; seats[a] = seats[b]; seats[b] = t;
      save(); buildEditor(); render();
    });
    $("ed-reset").addEventListener("click", function () {
      S.seats[1] = D.run1Seats.slice(); S.seats[2] = D.run2Seats.slice();
      S.desk = D.teacherDesk;
      save(); buildEditor(); render();
    });
    $("ed-clear").addEventListener("click", function () {
      S.names = new Array(18).fill(""); save(); buildEditor(); render();
    });
    $("desk-pos").addEventListener("change", function (e) { S.desk = e.target.value; save(); render(); });

    /* seat + register clicks open a card */
    gSeats.addEventListener("click", function (e) {
      var g = e.target.closest(".seat"); if (!g) return;
      e.stopPropagation();
      openCard(g.dataset.role, g);
    });
    document.querySelectorAll(".reg, .mem").forEach(function (n) {
      n.addEventListener("click", function (e) { e.stopPropagation(); openCard(n.dataset.key, n); });
    });
    $("card").addEventListener("click", function (e) { e.stopPropagation(); closeCard(); });

    /* click on empty background = Next */
    document.addEventListener("click", function (e) {
      if (e.target.closest("button, input, select, label, a, .panelbox, #editor, #card, #trace")) return;
      if (!$("card").hidden) { closeCard(); return; }
      next();
    });

    function fullscreen() {
      if (!document.fullscreenElement) { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(function () {}); }
      else document.exitFullscreen && document.exitFullscreen();
    }
    function toggleTheme() { S.theme = S.theme === "dark" ? "light" : "dark"; save(); render(); }

    document.addEventListener("keydown", function (e) {
      if (e.target.closest && e.target.closest("input, select, textarea")) {
        if (e.key === "Escape") { e.target.blur(); toggleEditor(false); }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      var handled = true;
      if (k === " " || k === "ArrowRight" || k === "PageDown" || k === "Enter") {
        if (k === "Enter" && e.target.closest && e.target.closest(".seat")) {
          var g = e.target.closest(".seat"); openCard(g.dataset.role, g);
        } else next();
      }
      else if (k === "ArrowLeft" || k === "Backspace" || k === "PageUp") back();
      else switch (k.toLowerCase()) {
        case "r": restart(); break;
        case "1": setRun(1); break;
        case "2": setRun(2); break;
        case "e": toggleEditor(); break;
        case "f": fullscreen(); break;
        case "h": setMode("controlsHidden"); break;
        case "d": toggleTheme(); break;
        case "p": setMode("predict"); break;
        case "q": setMode("checks"); break;
        case "t": setMode("trace"); break;
        case "m": setMode("sound"); break;
        case "l": setMode("library"); break;
        case "c": setMode("callouts"); break;
        case "n": setMode("notes"); break;
        case "v": setMode("envelope"); break;
        case "escape": closeCard(); toggleEditor(false); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });

    /* resizable: nothing to do, everything is rem + viewBox */
    /* Deep links, e.g. index.html#run=2&step=20&modes=library,envelope */
    var startStep = -1;
    (location.hash || "").replace(/^#/, "").split("&").forEach(function (kv) {
      var p = kv.split("="); if (p.length !== 2) return;
      if (p[0] === "run" && (p[1] === "1" || p[1] === "2")) S.runNo = +p[1];
      if (p[0] === "step") startStep = Math.max(-1, (+p[1] || 0) - 1);
      if (p[0] === "theme" && (p[1] === "light" || p[1] === "dark")) S.theme = p[1];
      if (p[0] === "modes") p[1].split(",").forEach(function (m) {
        if (m.charAt(0) === "-") { if (m.slice(1) in S.modes) S.modes[m.slice(1)] = false; }
        else if (m in S.modes) S.modes[m] = true;
      });
    });
    if (S.runNo === 2 && !/trace/.test(location.hash)) S.modes.trace = true;
    rebuild(startStep);
    render();
    window.addEventListener("resize", function () { fitSay(); });
    window.addEventListener("hashchange", function () { location.reload(); });
    root.HCPU_APP = { S: S, next: next, back: back, setRun: setRun, setMode: setMode, gotoStep: gotoStep,
      get beats() { return BEATS; }, get run() { return RUN; } };
  }
})(typeof window !== "undefined" ? window : globalThis);
