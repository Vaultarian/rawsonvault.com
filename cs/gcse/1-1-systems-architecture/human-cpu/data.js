/* Human CPU — data.js
   The two programs and the default seating. Plain data only:
   every step on screen is GENERATED from this by app.js (see generateRun).
   Memory cells are either an instruction {op, n} or a number, or null (empty). */

var HCPU_DATA = {
  programs: {
    1: {
      name: "Run 1",
      memory: [
        { op: "LOAD", n: 5 },
        { op: "ADD", n: 6 },
        { op: "STORE", n: 7 },
        { op: "STOP" },
        null,
        12,
        30,
        null
      ],
      expectAddress7: 42
    },
    2: {
      name: "Run 2",
      memory: [
        { op: "LOAD", n: 6 },
        { op: "ADD", n: 5 },
        { op: "ADD", n: 5 },
        { op: "STORE", n: 7 },
        { op: "STOP" },
        12,
        30,
        null
      ],
      expectAddress7: 54
    }
  },

  /* Role ids. X1..X4 are the four spare students:
     recorders normally, runners in Envelope mode. */
  roles: ["PC", "MAR", "MDR", "CU", "ALU", "ACC",
          "M0", "M1", "M2", "M3", "M4", "M5", "M6", "M7",
          "X1", "X2", "X3", "X4"],

  /* Room: 3 rows x 6 seats. Row 1 is nearest the teacher desk.
     Seats run left to right as the students see the front. */
  rows: 3,
  seatsPerRow: 6,

  /* Run 1 default seating, seat order = row 1 L->R, row 2 L->R, row 3 L->R. */
  run1Seats: ["PC", "MAR", "MDR", "CU", "ALU", "ACC",
              "M0", "M1", "M2", "M3", "M4", "M5",
              "M6", "M7", "X1", "X2", "X3", "X4"],

  /* Run 2 default: each seat takes the role 6 places further along the Run 1
     list, wrapping round. Computed, not typed, so it can never drift. */
  rotateBy: 6,

  /* Where the teacher desk sits along the front: "left", "centre" or "right". */
  teacherDesk: "centre"
};

HCPU_DATA.run2Seats = HCPU_DATA.run1Seats.map(function (_, i, list) {
  return list[(i + HCPU_DATA.rotateBy) % list.length];
});

if (typeof module !== "undefined") module.exports = HCPU_DATA;
