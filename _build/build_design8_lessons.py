#!/usr/bin/env python3
"""Publish the two Year 8 Design lesson pages. Each lesson is a dropdown holding
instructions and pictures of the blocks.

Pages:  myp/design/y8-robotics/makecode/index.html   the micro:bit lessons taught so far
        myp/design/y8-robotics/tpbot/index.html      eleven TPBot lessons
Images: myp/design/y8-robotics/blocks/<id>.png       one per program in PROGRAMS
Link:   a DESIGN8-LESSONS block on the unit hub page, above the Units table.

Source: PROGRAMS, MAKECODE and TPBOT below. Alex's brief, 19 Nov 2026: a page for what the
        class has done in MakeCode, a page for the TPBot, lessons as dropdowns with images
        and instructions; TPBot lessons 1-11 follow the ELECFREAKS wiki cases 01-11.

BLOCK PICTURES are not drawn here. `render_design8_blocks.py` (host only: needs node and
Chrome) sends each program in PROGRAMS to MakeCode's own renderer and saves the PNG, and
records a hash of the code in design8_blocks.json. This injector refuses to build when a
program's code no longer matches its picture, so a stale picture cannot ship.
    After editing any program:   python3 _build/render_design8_blocks.py

THIRD PARTY: no ELECFREAKS text or picture is copied. Their wiki carries no licence, so the
   page links each case and credits it. Programs were rewritten for the current TPBot
   extension (MIT); the wiki's own samples are pinned to the 2021 version. Block pictures
   come from Microsoft MakeCode (MIT).
STUDENT-FACING: positive instruction. Say what to do, never list mistakes.
No student data.
Added 2026-11-19. Idempotent. Stdlib only. Prints PUBLISH: lines for publisher.py.
"""
import hashlib, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get("DESIGN8_ROOT", os.path.dirname(HERE))
MANIFEST = os.path.join(HERE, "design8_blocks.json")
UNIT = "myp/design/y8-robotics"
HUB = f"{UNIT}/index.html"
M_START, M_END = "<!-- DESIGN8-LESSONS:START -->", "<!-- DESIGN8-LESSONS:END -->"
ANCHOR = "        <!-- UNITS:START -->"
# Which pages are live. Alex, 19 Nov 2026: publish the TPBot page; the MakeCode page is
# built and approved by eye but waits for his word. Add "makecode" to publish it.
LIVE = tuple(os.environ.get("DESIGN8_LIVE", "makecode,tpbot").split(","))  # preview both: DESIGN8_LIVE=makecode,tpbot
TPBOT_PKG = "tpbot=github:elecfreaks/pxt-tpbot#v2.0.7"
WIKI = "https://wiki.elecfreaks.com/en/microbit/microbit-smart-car/microbit-tpbot/"
FILES = "../../../../classes/design-8a/files/"

H = "# . . . #\n# . . . #\n# # # # #\n# . . . #\n# . . . #"
I = "# # # # #\n. . # . .\n. . # . .\n. . # . .\n# # # # #"
BLANK = "\n".join([". . . . ."] * 5)


def leds(p):
    return "basic.showLeds(`\n" + p + "\n`)"


# id -> MakeCode JavaScript. Ids starting "t" need the TPBot extension.
PROGRAMS = {
    # ── MakeCode page ────────────────────────────────────────────────────────────
    "m1-first": leds(H),
    "m1-badge": "input.onButtonPressed(Button.A, function () {\n"
                "for (let index = 0; index < 4; index++) {\n"
                + leds(H) + "\nbasic.pause(100)\n" + leds(I) + "\nbasic.pause(100)\n"
                + leds(BLANK) + "\nbasic.pause(500)\n}\n})",
    "m2-events": """input.onGesture(Gesture.Shake, function () {
    basic.showIcon(IconNames.Happy)
})
input.onButtonPressed(Button.A, function () {
    basic.showIcon(IconNames.Sad)
})""",
    "m2-counter": """let B_Clicks = 0
input.onButtonPressed(Button.B, function () {
    B_Clicks += 1
    if (B_Clicks == 4) {
        basic.showIcon(IconNames.Heart)
        basic.pause(1000)
        basic.clearScreen()
        B_Clicks = 0
    }
})
B_Clicks = 0""",
    "m5-score": """let score = 0
input.onButtonPressed(Button.A, function () {
    score += 1
    basic.showNumber(score)
})
score = 0""",
    "m5-random": """input.onGesture(Gesture.Shake, function () {
    basic.showNumber(randint(1, 6))
})""",
    # ── MakeCode page: games like the ones the class built ──────────────────────
    "g1-8ball": """let answer = 0
input.onGesture(Gesture.Shake, function () {
    answer = randint(0, 4)
    if (answer == 0) {
        basic.showString("YES")
    } else if (answer == 1) {
        basic.showString("NO")
    } else if (answer == 2) {
        basic.showString("MAYBE")
    } else if (answer == 3) {
        basic.showString("ASK AGAIN")
    } else {
        basic.showString("DEFINITELY")
    }
})
basic.showString("ASK")""",
    "g1-list": """let answers: string[] = []
input.onButtonPressed(Button.A, function () {
    basic.showString(answers._pickRandom())
})
answers = ["Yes", "No", "Maybe", "Try again", "Ask a friend"]""",
    "g2-rps": """let hand = 0
input.onGesture(Gesture.Shake, function () {
    hand = randint(1, 3)
    if (hand == 1) {
        basic.showIcon(IconNames.SmallSquare)
    } else if (hand == 2) {
        basic.showIcon(IconNames.Square)
    } else {
        basic.showIcon(IconNames.Scissors)
    }
})""",
    "g4-potato": """let timer = 0
input.onButtonPressed(Button.A, function () {
    timer = randint(5, 15)
    basic.showIcon(IconNames.Chessboard)
    while (timer > 0) {
        timer += -1
        basic.pause(1000)
    }
    basic.showIcon(IconNames.Skull)
})""",
    "g5-score": """let away = 0
let home = 0
input.onButtonPressed(Button.A, function () {
    home += 1
    basic.showNumber(home)
})
input.onButtonPressed(Button.B, function () {
    away += 1
    basic.showNumber(away)
})
input.onButtonPressed(Button.AB, function () {
    home = 0
    away = 0
    basic.clearScreen()
})
home = 0
away = 0""",
    "g6-reaction": """let running = false
let start = 0
input.onButtonPressed(Button.A, function () {
    basic.showNumber(3)
    basic.showNumber(2)
    basic.showNumber(1)
    basic.clearScreen()
    basic.pause(randint(1000, 3000))
    start = input.runningTime()
    running = true
    led.plot(2, 2)
})
input.onButtonPressed(Button.B, function () {
    if (running) {
        running = false
        basic.showNumber(input.runningTime() - start)
    }
})""",
    "g7-catch": """let item: game.LedSprite = null
let player: game.LedSprite = null
input.onButtonPressed(Button.A, function () {
    player.move(-1)
})
input.onButtonPressed(Button.B, function () {
    player.move(1)
})
player = game.createSprite(2, 4)
basic.forever(function () {
    item = game.createSprite(randint(0, 4), 0)
    basic.pause(300)
    for (let index = 0; index < 4; index++) {
        item.change(LedSpriteProperty.Y, 1)
        basic.pause(300)
    }
    if (player.isTouching(item)) {
        game.addScore(1)
    }
    item.delete()
})""",
    "g8-words": """let index = 0
let wordList: string[] = []
input.onGesture(Gesture.LogoUp, function () {
    index = randint(0, wordList.length - 1)
    basic.showString(wordList[index])
})
input.onGesture(Gesture.ScreenDown, function () {
    game.addScore(1)
})
input.onGesture(Gesture.ScreenUp, function () {
    game.removeLife(1)
})
wordList = ["TIGER", "OTTER", "MANGO", "LANTERN", "CRAYON"]
game.startCountdown(30000)""",
    "g9-21": """let card = 0
let score = 0
input.onButtonPressed(Button.A, function () {
    card = randint(1, 10)
    score += card
    if (score > 21) {
        basic.showString("GAME OVER")
        score = 0
    } else {
        basic.showNumber(score)
    }
})
input.onButtonPressed(Button.B, function () {
    score = 0
    basic.showNumber(0)
})
score = 0""",
    # ── TPBot page ───────────────────────────────────────────────────────────────
    "t01-a": "TPBot.setTravelTime(TPBot.DriveDirection.Forward, 50, 2)",
    "t01-b": """input.onButtonPressed(Button.A, function () {
    TPBot.setTravelSpeed(TPBot.DriveDirection.Forward, 50)
    basic.pause(2000)
    TPBot.stopCar()
})""",
    "t01-c": """input.onButtonPressed(Button.B, function () {
    TPBot.setWheels(50, 20)
    basic.pause(2000)
    TPBot.stopCar()
})""",
    "t02-a": """input.onButtonPressed(Button.A, function () {
    TPBot.headlightColor(0xff0000)
})
input.onButtonPressed(Button.B, function () {
    TPBot.headlightColor(0x0000ff)
})
input.onButtonPressed(Button.AB, function () {
    TPBot.headlightColor(0x00ff00)
})
basic.showIcon(IconNames.Heart)""",
    "t02-b": """basic.showIcon(IconNames.Heart)
TPBot.headlightRGB(255, 255, 255)
basic.pause(2000)
TPBot.headlightClose()""",
    "t03": """basic.showIcon(IconNames.Heart)
basic.forever(function () {
    if (TPBot.trackLine(TPBot.TrackingState.L_R_line)) {
        TPBot.setWheels(20, 20)
    }
    if (TPBot.trackLine(TPBot.TrackingState.L_line_R_unline)) {
        TPBot.setWheels(0, 40)
    }
    if (TPBot.trackLine(TPBot.TrackingState.L_unline_R_line)) {
        TPBot.setWheels(40, 0)
    }
})""",
    "t04": """let distance = 0
basic.showIcon(IconNames.Triangle)
TPBot.headlightColor(0x00ff00)
TPBot.setTravelSpeed(TPBot.DriveDirection.Forward, 40)
basic.forever(function () {
    distance = TPBot.sonarReturn(TPBot.SonarUnit.Centimeters)
    if (distance < 15 && distance != 0) {
        TPBot.stopCar()
        TPBot.headlightColor(0xff0000)
        TPBot.setTravelTime(TPBot.DriveDirection.Backward, 30, 1)
        TPBot.setTravelTime(TPBot.DriveDirection.Left, 30, 0.5)
        TPBot.headlightColor(0x00ff00)
        TPBot.setTravelSpeed(TPBot.DriveDirection.Forward, 40)
    }
})""",
    "t05": """TPBot.setTravelSpeed(TPBot.DriveDirection.Forward, 30)
basic.forever(function () {
    if (input.lightLevel() < 30) {
        TPBot.headlightColor(0xffffff)
    } else {
        TPBot.headlightClose()
    }
})""",
    "t06": """let right = 0
let left = 0
basic.showIcon(IconNames.Happy)
basic.forever(function () {
    left = randint(-100, 100)
    right = randint(-100, 100)
    TPBot.setWheels(left, right)
    basic.pause(2000)
})""",
    "t07": """basic.showIcon(IconNames.Happy)
TPBot.setTravelSpeed(TPBot.DriveDirection.Forward, 50)
basic.forever(function () {
    TPBot.headlightColor(0xff0000)
    basic.pause(100)
    TPBot.headlightColor(0x0000ff)
    basic.pause(100)
})""",
    "t08": """basic.showIcon(IconNames.Happy)
TPBot.setTravelSpeed(TPBot.DriveDirection.Forward, 30)
basic.forever(function () {
    if (TPBot.trackLine(TPBot.TrackingState.L_R_line)) {
        TPBot.stopCar()
    }
})""",
    "t09": """TPBot.headlightColor(0xffffff)
basic.forever(function () {
    if (input.lightLevel() > 40) {
        TPBot.setTravelSpeed(TPBot.DriveDirection.Forward, 50)
    } else {
        TPBot.setTravelSpeed(TPBot.DriveDirection.Left, 30)
    }
})""",
    "t10": """basic.showIcon(IconNames.Heart)
TPBot.headlightColor(0xffffff)
basic.forever(function () {
    if (!(TPBot.trackLine(TPBot.TrackingState.L_R_unline))) {
        TPBot.setTravelTime(TPBot.DriveDirection.Backward, 30, 1)
        TPBot.setTravelTime(TPBot.DriveDirection.Left, 30, 0.5)
    } else {
        TPBot.setTravelSpeed(TPBot.DriveDirection.Forward, 30)
    }
})""",
    "t11": """let distance = 0
basic.showIcon(IconNames.Heart)
basic.forever(function () {
    distance = TPBot.sonarReturn(TPBot.SonarUnit.Centimeters)
    if (distance > 10 && distance < 20) {
        TPBot.setWheels(0, 0)
    } else if (distance < 10) {
        TPBot.setWheels(-30, -30)
    } else {
        TPBot.setWheels(30, 30)
    }
})""",
}


def code_hash(pid):
    pkg = TPBOT_PKG if pid.startswith("t") else ""
    return hashlib.sha256((pkg + "\n" + PROGRAMS[pid]).encode()).hexdigest()[:16]


def b(name, kind="tp"):
    """An inline block name, coloured like its MakeCode drawer."""
    return f'<span class="blk blk-{kind}">{name}</span>'


# Each lesson: n, title, line (one-line summary), need, steps, progs [(id, caption)],
# see (what happens), change (things to try), then optional extras:
#   idea  a sentence naming the one idea;  docs [(label, href)];  src  the wiki case page.
MAKECODE = [
    dict(n=1, title="Hello, MakeCode", line="Your first program: a name badge that plays when you press a button.",
         need=["micro:bit", "USB cable", "A laptop with makecode.microbit.org open"],
         steps=[
             "Open <strong>makecode.microbit.org</strong>, choose <strong>New Project</strong> and name it <code>name-badge</code>.",
             f"Drag {b('show leds','basic')} inside {b('on start','basic')}. Click each LED you want lit to draw your first letter.",
             "Plug in the USB cable and press the purple <strong>Download</strong> button. If a file lands in Downloads, drag it onto the <strong>MICROBIT</strong> drive. Your letter appears on the board.",
             f"Add one {b('show leds','basic')} for each letter of your name, with {b('pause (ms) 100','basic')} after each. Finish with a blank {b('show leds','basic')} and {b('pause (ms) 500','basic')}. That is the gap before the name starts again.",
             f"Wrap all of it in {b('repeat 4 times','loops')}. A repeat block is a <strong>loop</strong>: it runs the same blocks again and again.",
             f"Move everything out of {b('on start','basic')} and into {b('on button A pressed','input')}.",
             "Press <strong>Share</strong>, then <strong>Publish project</strong>, and copy the link. Publishing is how you hand work in.",
         ],
         progs=[("m1-first", "Step 2. One letter, shown when the micro:bit starts."),
                ("m1-badge", "Step 6. A two-letter name, played four times when you press A.")],
         see="Press A and your name plays across the LEDs four times, with a short gap between each run.",
         idea="The button is the <strong>input</strong>, the loop is the <strong>process</strong> and the LEDs are the <strong>output</strong>.",
         change=[f"Make {b('on button B pressed','input')} do something different.",
                 "Make the pauses smaller and smaller. Find the fastest speed you can still read.",
                 f"Try {b('show string','basic')} with your name in it. Work out what it is doing for you."],
         docs=[("MakeCode quick reference", FILES + "rc-l01-intro-to-makecode-handout.pdf"),
               ("Homework: make something of your own", FILES + "rc-l01-intro-to-makecode-homework.pdf")]),
    dict(n=2, title="Algorithms 1: making the micro:bit decide", line="Events, a variable and a condition: show a heart on the fourth press of B.",
         need=["micro:bit", "USB cable", "Battery pack"],
         steps=[
             f"Show a happy face when you shake the micro:bit: {b('on shake','input')} with {b('show icon','basic')} inside.",
             f"Show a sad face when you press A: {b('on button A pressed','input')} with {b('show icon','basic')} inside.",
             "Now the challenge: show a heart when B has been pressed <strong>four times</strong>. The micro:bit has to remember how many presses there have been, then ask a question about that number.",
             f"In the <strong>Variables</strong> drawer choose <strong>Make a Variable</strong> and call it <code>B Clicks</code>. A variable is a box with a name on it. In {b('on start','basic')}, put {b('set B Clicks to 0','vars')}.",
             f"Start a new stack: {b('on button B pressed','input')} with {b('change B Clicks by 1','vars')} inside. Every press adds one to the box.",
             f"Under that, add {b('if … then','logic')} from the <strong>Logic</strong> drawer and drop {b('B Clicks = 4','logic')} into its gap. This is a <strong>condition</strong>: a question with only two answers, yes or no.",
             f"Inside the {b('if','logic')}, show the heart, pause, clear the screen and {b('set B Clicks to 0','vars')}. Setting it back to 0 lets the count start again.",
         ],
         progs=[("m2-events", "Steps 1 and 2. Two events, each with its own answer."),
                ("m2-counter", "Steps 4 to 7. The finished counter. MakeCode shows the variable as B_Clicks here; yours reads B Clicks.")],
         see="Three presses of B show nothing. The fourth shows a heart for one second. Four more presses show it again.",
         idea="<strong>Remembering</strong> needs a variable. <strong>Checking</strong> needs a condition.",
         change=["Change the 4 to another number and test it.",
                 "Show a different icon on the fourth press.",
                 "Build the <strong>Shake Counter</strong>: a variable called <code>Shakes</code> that goes up by 1 on every shake, and an icon on the third shake."],
         docs=[("Algorithms 1 handout", FILES + "rc-l02-algorithms-1-handout.pdf")]),
    dict(n=3, title="Choosing your game", line="The Mini Project begins: pick one game from the Games Menu.",
         need=["The Games Menu", "The Criteria A and B sheet"],
         steps=[
             "Read through the <strong>Games Menu</strong>. It holds 23 micro:bit games in three levels.",
             "Pick two games you like and one you will build. For each, write down one strength and one weakness.",
             "Read the <strong>Criteria A and B</strong> sheet. It lists the eight pieces of design work you hand in, one for each strand.",
             "Tell Mr. Rawson which game you have chosen.",
         ],
         progs=[], see="You leave with one game chosen and a reason for choosing it.",
         change=[],
         docs=[("The Games Menu", FILES + "rc-games-menu.pdf"),
               ("Criteria A and B: what you are marked on", FILES + "rc-summative-ab-what-you-are-marked-on.pdf")]),
    dict(n=4, title="My Game Design: the design packet", line="Summative A and B. Explain your game and exactly how it works, on paper.",
         need=["My Game Design packet", "The Games Menu", "A pencil"],
         steps=[
             "Work through the eight parts of the packet in order. Each part is labelled with the strand it earns.",
             "In Part 1, name a real person your game is for.",
             "Write success criteria that you can see or count, such as <em>the score goes up by 1 for each catch</em>.",
             "Plan three versions of <strong>one</strong> game, each using A, B, A+B and shake in a different way.",
             "Fill in the controls table for your final version. Write <em>not used</em> beside any input your game leaves out.",
             "Draw your four 5 × 5 screens and write out one round of the game step by step.",
         ],
         progs=[], see="A finished packet that another person could build your game from.",
         idea="The packet is marked on how clearly it explains your plan.",
         change=[],
         docs=[("My Game Design packet", FILES + "rc-summative-design-packet.pdf"),
               ("Criteria A and B: what you are marked on", FILES + "rc-summative-ab-what-you-are-marked-on.pdf")]),
    dict(n=5, title="Building your game", line="Turn the design packet into a working game in MakeCode.",
         need=["Your finished design packet", "micro:bit", "USB cable"],
         steps=[
             "Open your packet at the controls table and the block list. They are your plan.",
             "Build one input at a time. Start with button A, download, and test it on the micro:bit.",
             "Add the next input and test again. Small steps keep the game working the whole way through.",
             "Most games keep a score or pick something at random. The two patterns below do those jobs.",
             "Press <strong>Share</strong>, then <strong>Publish project</strong>, and post the link in the Google Classroom build thread.",
         ],
         progs=[("m5-score", "Keeping score. A variable goes up by 1 and the micro:bit shows it."),
                ("m5-random", "A random number from 1 to 6 on every shake.")],
         see="Your game runs on a real micro:bit, and its link is in the build thread.",
         change=["Add a sound or an icon for winning.",
                 "Add a way to start a new game without unplugging the micro:bit."],
         docs=[]),
    dict(n=6, title="Carousel Play Day", line="Play each other's games and tell the builder what you noticed.",
         need=["micro:bit", "Your game's sharing link"],
         steps=[
             "Open your own game from its sharing link and download it to your micro:bit.",
             "Move round the room when Mr. Rawson calls. Play each game you reach.",
             "Tell the builder the first thing you did when you picked their game up.",
             "Back at your own game, read what your players noticed and make one change.",
             "If your game changed, publish it again and post the new link.",
         ],
         progs=[], see="Your game has been played by people who did not build it, and you have one idea to borrow from someone else's.",
         change=[], docs=[]),
]

# Sample games. Each is a clean example of a KIND of game the two Year 8 classes built for
# the Mini Project (Alex's two slide decks, 19 Nov 2026). No pupil is named and no pupil's
# program is reproduced: these were written fresh, with neutral words on the screen.
# "how" explains the game; steps are the basic build, not every block.
GAMES = [
    dict(n=1, title="Magic 8 Ball", line="Ask a question, shake, and read your answer.",
         how="You ask a yes-or-no question out loud and shake the micro:bit. It picks a random number, and each number has its own answer. The player sees the answer scroll past and never sees the number.",
         need=["micro:bit", "Battery pack"],
         steps=[
             "Make a variable called <code>answer</code>.",
             f"In {b('on shake','input')}, set <code>answer</code> to {b('pick random 0 to 4','math')}. That gives five possible numbers: 0, 1, 2, 3 and 4.",
             f"Add {b('if … then … else','logic')} and press its <strong>+</strong> until it has a branch for each number. Give each branch a condition such as <code>answer = 0</code>.",
             f"Put a {b('show string','basic')} with a different answer in every branch. The last answer goes in the plain <em>else</em>, which catches whatever number is left.",
             f"Add {b('show string','basic')} to {b('on start','basic')} so the player knows the game is ready.",
         ],
         progs=[("g1-8ball", "Five numbers, five answers. The else at the bottom catches the number 4."),
                ("g1-list", "A shorter way that some of the class found: keep the answers in a list and let MakeCode pick one.")],
         see="Each shake scrolls one of the five answers across the screen.",
         idea="A random number chooses, and <strong>if … else if</strong> turns the number into words.",
         change=["Write your own answers. Short ones are easiest to read on a 5 × 5 screen.",
                 "Add a sixth answer: change the random range to 0 to 5 and add one more branch.",
                 "Show a picture for some answers with show icon."]),
    dict(n=2, title="Rock, Paper, Scissors", line="Shake to throw a random hand.",
         how="Two players count to three and shake their micro:bits together. Each micro:bit picks 1, 2 or 3 at random and shows a picture: a small square for rock, a large square for paper, or scissors. The players decide who won.",
         need=["Two micro:bits", "Two battery packs"],
         steps=[
             "Make a variable called <code>hand</code>.",
             f"In {b('on shake','input')}, set <code>hand</code> to {b('pick random 1 to 3','math')}.",
             f"Add {b('if … then … else','logic')} with one extra branch. Test for <code>hand = 1</code>, then <code>hand = 2</code>, and leave the else for 3.",
             f"Put a {b('show icon','basic')} in each branch: small square, square, scissors.",
         ],
         progs=[("g2-rps", "Three numbers, three pictures.")],
         see="Each shake shows rock, paper or scissors.",
         idea="The same shape as the Magic 8 Ball, with pictures in place of words.",
         change=["Draw your own rock, paper and scissors with show leds.",
                 "Play a different note for each hand.",
                 "Clear the screen after 2 seconds so that the next round starts fresh."]),
    dict(n=3, title="Dice", line="Shake for a number from 1 to 6.",
         how="The whole game is one event. A shake picks a random number from 1 to 6 and shows it, so the micro:bit can stand in for the dice in any board game.",
         need=["micro:bit", "Battery pack"],
         steps=[
             f"Drag out {b('on shake','input')}.",
             f"Put {b('show number','basic')} inside it.",
             f"Drop {b('pick random 1 to 6','math')} into the number gap.",
         ],
         progs=[("m5-random", "The value block sits inside show number, so no variable is needed.")],
         see="Each shake shows a number from 1 to 6.",
         idea="A block that gives a value can go straight into the gap of another block.",
         change=["Make a 20-sided dice.",
                 "Roll two dice: show one number, pause, then show the other.",
                 "Draw the six dice faces with show leds and show the right face for each number."]),
    dict(n=4, title="Hot Potato", line="Pass it on before the hidden timer runs out.",
         how="Press A and pass the micro:bit round the circle. It has secretly chosen a number of seconds between 5 and 15 and is counting down. When the count reaches 0 a skull appears, and whoever is holding it is out.",
         need=["micro:bit", "Battery pack", "Three or more players"],
         steps=[
             "Make a variable called <code>timer</code>.",
             f"In {b('on button A pressed','input')}, set <code>timer</code> to {b('pick random 5 to 15','math')} and show an icon that means the game is running.",
             f"Add {b('while','loops')} with the condition <code>timer &gt; 0</code>. A while loop keeps repeating for as long as its condition is true.",
             f"Inside the loop put {b('change timer by -1','vars')} and {b('pause (ms) 1000','basic')}. Each trip round the loop takes one second off.",
             f"Under the loop, add {b('show icon','basic')} with the skull.",
         ],
         progs=[("g4-potato", "The loop runs once a second until the timer reaches 0.")],
         see="The chessboard icon shows while the potato is hot. After 5 to 15 seconds the skull appears.",
         idea="A <strong>while</strong> loop repeats until something changes, and here the loop itself makes the change.",
         change=["Change the range to make rounds longer or shorter.",
                 "Play a sound when the skull appears.",
                 "Speed up the last three seconds with a shorter pause."]),
    dict(n=5, title="Scorekeeper", line="Keep the score for two teams.",
         how="The micro:bit remembers two numbers, one for each team. Button A adds a point for the home team and button B adds one for the away team. Pressing both together starts a new match.",
         need=["micro:bit", "Battery pack"],
         steps=[
             f"Make two variables, <code>home</code> and <code>away</code>. Set both to 0 in {b('on start','basic')}.",
             f"In {b('on button A pressed','input')}: {b('change home by 1','vars')}, then {b('show number','basic')} with <code>home</code> in the gap.",
             "Build the same for button B with <code>away</code>.",
             f"In {b('on button A+B pressed','input')}, set both variables to 0 and clear the screen.",
         ],
         progs=[("g5-score", "Two variables, one for each team.")],
         see="Each press shows that team's new score. A and B together sets both back to 0.",
         idea="One variable for each thing the game has to remember.",
         change=["Show both scores on shake, one after the other.",
                 "Show a trophy when a team reaches 5.",
                 "Add a way to take a point away after a mistake."]),
    dict(n=6, title="Reaction Timer", line="Press B the moment the dot appears.",
         how="Press A and the micro:bit counts 3, 2, 1, then waits for a random time and lights one dot. Press B as fast as you can. The micro:bit shows how many milliseconds you took: 1000 milliseconds is one second.",
         need=["micro:bit", "Battery pack"],
         steps=[
             "Make two variables, <code>start</code> and <code>running</code>.",
             f"In {b('on button A pressed','input')}: show 3, 2, 1, clear the screen, then pause for {b('pick random 1000 to 3000','math')} milliseconds.",
             f"Straight after the pause, set <code>start</code> to {b('running time (ms)','input')}, set <code>running</code> to true and {b('plot x 2 y 2','led')}. Running time is the micro:bit's own stopwatch.",
             f"In {b('on button B pressed','input')}, add {b('if running then','logic')}. Inside it, set <code>running</code> to false and show {b('running time (ms)','input')} minus <code>start</code>.",
         ],
         progs=[("g6-reaction", "The time now, minus the time the dot appeared, is your reaction time.")],
         see="A dot appears after a wait of 1 to 3 seconds. Pressing B scrolls your time, usually between 200 and 400.",
         idea="<strong>running</strong> is a true-or-false variable. It lets B work only while a round is on.",
         change=["Show a happy face for times under 300.",
                 "Keep the best time in a variable called <code>best</code> and show it on shake.",
                 "Light the dot in a random place with pick random 0 to 4 for x and y."]),
    dict(n=7, title="Catch the Dot", line="Move left and right to catch the falling dots.",
         how="You are a dot on the bottom row, moved left with A and right with B. Another dot appears somewhere on the top row and falls one row at a time. If it lands on you, you score a point.",
         need=["micro:bit", "Battery pack"],
         steps=[
             f"Open <strong>Advanced</strong>, then <strong>Game</strong>. In {b('on start','basic')}, set a variable called <code>player</code> to {b('create sprite at x: 2 y: 4','game')}. A sprite is a dot the game can move and test.",
             f"Button A: {b('player move by -1','game')}. Button B: {b('player move by 1','game')}.",
             f"In {b('forever','basic')}, set <code>item</code> to a new sprite at a random x from 0 to 4, with y 0, and pause.",
             f"Add {b('repeat 4 times','loops')} holding {b('item change y by 1','game')} and a pause. Four steps take the dot from the top row to the bottom.",
             f"After the loop, add {b('if player touching item then','logic')} with {b('change score by 1','game')} inside, then {b('delete item','game')}.",
         ],
         progs=[("g7-catch", "Forever makes one dot fall, checks for a catch, deletes the dot and starts again.")],
         see="Dots fall one after another, and each catch adds a point.",
         idea="The 5 × 5 screen is a grid. x counts across from 0 to 4 and y counts down from 0 to 4.",
         change=["Make the dots fall faster by shortening the pause.",
                 "Take a life for each dot you miss with remove life.",
                 "Show the score when A and B are pressed together."]),
    dict(n=8, title="Heads Up", line="Hold it to your forehead and guess the word from your friends' clues.",
         how="Hold the micro:bit upright on your forehead so that only your friends can read it. They give clues and you guess the word. Tip it face down for a correct guess, which scores a point, or face up to pass, which costs a life. Stand it upright again for the next word. A countdown ends the game after 30 seconds.",
         need=["micro:bit", "Battery pack", "Two or more players"],
         steps=[
             f"In {b('on start','basic')}, set a variable called <code>wordList</code> to an {b('array of','arrays')} words. An array is a list kept in one variable. Then add {b('start countdown (ms) 30000','game')}.",
             f"In {b('on logo up','input')}, set <code>index</code> to a random number from 0 to {b('length of array wordList','arrays')} minus 1. Positions in a list start at 0, so a list of five words has positions 0 to 4.",
             f"Still in logo up, {b('show string','basic')} the word at that position: {b('wordList get value at index','arrays')}.",
             f"{b('on screen down','input')}: {b('change score by 1','game')}. {b('on screen up','input')}: {b('remove life 1','game')}.",
         ],
         progs=[("g8-words", "Three tilts do three jobs: next word, correct, pass.")],
         see="Each time the micro:bit stands upright a word scrolls across. When the 30 seconds are up it shows the score.",
         idea="The micro:bit knows which way up it is, so tilting it works like three more buttons.",
         change=["Write a word list on one theme, such as animals or films.",
                 "Change the countdown to 60000 for a one-minute round.",
                 "Add more words with the + on the array block."]),
    dict(n=9, title="Twenty-One", line="Draw cards and get as close to 21 as you dare.",
         how="Each press of A draws a card worth 1 to 10 and adds it to your total. You choose when to stop. Go over 21 and the game is over. The player who stops closest to 21 wins.",
         need=["micro:bit", "Battery pack"],
         steps=[
             f"Make two variables, <code>score</code> and <code>card</code>. Set <code>score</code> to 0 in {b('on start','basic')}.",
             f"In {b('on button A pressed','input')}, set <code>card</code> to {b('pick random 1 to 10','math')}, then {b('change score by','vars')} <code>card</code>.",
             f"Add {b('if … then … else','logic')} with the condition <code>score &gt; 21</code>. In <em>then</em>, show GAME OVER and set the score back to 0. In <em>else</em>, show the score.",
             f"In {b('on button B pressed','input')}, set <code>score</code> to 0 and show 0, ready for the next player.",
         ],
         progs=[("g9-21", "Every card is added to the total, then the total is checked against 21.")],
         see="The total climbs with each press of A. Above 21 it scrolls GAME OVER and starts again from 0.",
         idea="<strong>change score by card</strong> adds a different amount each time, because the amount is itself a variable.",
         change=["Show the card you drew before showing the total.",
                 "Play a sad sound on GAME OVER.",
                 "Show a star when the total is exactly 21."]),
]


LINE_KEY = ('<table class="key"><tr><th>Block shows</th><th>The sensors see</th></tr>'
            '<tr><td>● ●</td><td>black under both sensors</td></tr>'
            '<tr><td>● ◌</td><td>black on the left, white on the right</td></tr>'
            '<tr><td>◌ ●</td><td>white on the left, black on the right</td></tr>'
            '<tr><td>◌ ◌</td><td>white under both sensors</td></tr></table>')

TPBOT = [
    dict(n=1, title="Running control", line="Make the car drive: for a set time, on a button press, and round a curve.",
         need=["TPBot", "micro:bit", "A clear patch of floor"],
         steps=[
             f"Put {b('Go Forward at speed 50 % for 2 seconds')} inside {b('on start','basic')}. Download it, slot the micro:bit into the car and switch the car on.",
             f"Build the second program. {b('Go Forward at speed 50 %')} starts the wheels and the car keeps going, so the program pauses for 2 seconds and then uses {b('Stop the car immediately')}.",
             f"Build the third program. {b('Set left wheel speed at 50 % right wheel speed at 20 %')} gives each wheel its own speed.",
         ],
         progs=[("t01-a", "Program A. Drive for 2 seconds as soon as the car starts."),
                ("t01-b", "Program B. Drive for 2 seconds when you press A."),
                ("t01-c", "Program C. Two different wheel speeds make a curve.")],
         see="A: the car drives forward for 2 seconds and stops. B: the same, each time you press A. C: the car curves to the right, because the left wheel is turning faster.",
         idea="The car remembers its last order. It keeps doing it until a new block tells it something else.",
         change=["Change 50 % to 25 % in Program A. Measure how far the car goes each time.",
                 "Change Forward to Backward, Left and Right. Left and Right spin the car on the spot.",
                 "Swap the two wheel speeds in Program C and predict the curve before you run it."],
         src="TPBot_tianpeng_case_01"),
    dict(n=2, title="Light control", line="Change the colour of the headlights with the buttons.",
         need=["TPBot", "micro:bit"],
         steps=[
             f"Add three button events. In each one put {b('Set headlight color to')} and click the colour to choose it.",
             f"Put {b('show icon','basic')} in {b('on start','basic')} so you can see the program has started.",
             f"Build the second program. {b('Set headlight color to R: G: B:')} mixes a colour from red, green and blue, each from 0 to 255. {b('Turn off the headlights')} switches them off.",
         ],
         progs=[("t02-a", "Program A. A is red, B is blue, A and B together is green."),
                ("t02-b", "Program B. White for 2 seconds, then off.")],
         see="A: the headlights turn red, blue or green as you press. B: the headlights shine white for 2 seconds and go out.",
         change=["Mix your own colour with the R, G and B numbers. Try 255, 100, 0.",
                 "Make the headlights flash three times using a repeat block.",
                 "Make the headlights turn green while the car drives and red when it stops."],
         src="TPBot_tianpeng_case_02"),
    dict(n=3, title="Line tracking", line="The car follows a black line using the two sensors underneath it.",
         need=["TPBot", "micro:bit", "The TPBot map, or black tape on a pale floor"],
         steps=[
             f"Put {b('show icon','basic')} in {b('on start','basic')}.",
             f"In {b('forever','basic')}, add three {b('if … then','logic')} blocks. Drop {b('Line sensor state is')} into each gap and choose a different pattern for each.",
             f"Inside each {b('if','logic')}, add {b('Set left wheel speed … right wheel speed …')} with the speeds shown.",
             "Place the car with the line between its two sensors and switch it on.",
         ],
         progs=[("t03", "Black on both sides: drive straight. Black on one side only: slow that wheel to steer back.")],
         extra=LINE_KEY,
         see="The car drives along the line and steers itself back each time the line drifts to one side.",
         idea="Stopping one wheel turns the car towards that side.",
         change=["Raise all three speeds by 10. Find the fastest speed that still holds the line.",
                 "Turn the headlights a different colour for each sensor pattern.",
                 "If the car hums and stays still, the batteries are low: raise the speeds until it moves."],
         src="TPBot_tianpeng_case_03"),
    dict(n=4, title="Obstacle-avoidance driving", line="The car measures the distance ahead and turns away from anything close.",
         need=["TPBot", "micro:bit", "A box or a wall"],
         steps=[
             "Make a variable called <code>distance</code>.",
             f"In {b('on start','basic')}: show an icon, set the headlights green and {b('Go Forward at speed 40 %')}.",
             f"In {b('forever','basic')}, set <code>distance</code> to {b('Sonar distance unit cm')}. The two round eyes on the front are the sonar.",
             f"Add {b('if … then','logic')} with the condition <code>distance &lt; 15 and distance ≠ 0</code>. Build it from {b('and','logic')} with a comparison on each side. The sonar sends 0 when it has no reading, so the second half skips those.",
             "Inside the if: stop, headlights red, reverse for 1 second, spin left for half a second, headlights green, drive forward again.",
         ],
         progs=[("t04", "Drive until something is closer than 15 cm, then back away and turn.")],
         see="The car drives with green headlights. Close to a box it stops, turns its lights red, reverses, turns left and drives on.",
         idea="This is <strong>drive until</strong>: the car stops because of what a sensor measures.",
         change=["Change 15 to 30 and watch how much earlier the car reacts.",
                 "Change Left to Right.",
                 "Show the distance on the micro:bit with show number."],
         src="TPBot_tianpeng_case_04"),
    dict(n=5, title="Automatic lamp", line="The headlights switch on by themselves when it gets dark.",
         need=["TPBot", "micro:bit", "Your hand, or a tunnel made from a box"],
         steps=[
             f"In {b('on start','basic')}, put {b('Go Forward at speed 30 %')}.",
             f"In {b('forever','basic')}, add {b('if … then … else','logic')}. The condition is {b('light level','input')} <code>&lt; 30</code>. Light level runs from 0 for dark to 255 for bright.",
             f"In the <em>then</em> gap set the headlights white. In the <em>else</em> gap put {b('Turn off the headlights')}.",
         ],
         progs=[("t05", "Dark: headlights on. Bright: headlights off.")],
         see="The car drives forward. Cover the micro:bit's screen with your hand, or drive into the tunnel, and the headlights come on.",
         idea="The micro:bit measures light with its own LED screen.",
         change=["Show the light level on the micro:bit to find the number for your classroom.",
                 "Change 30 so the lights come on in the tunnel and go off outside it.",
                 "Choose a different headlight colour for the dark."],
         src="TPBot_tianpeng_case_05"),
    dict(n=6, title="Drive at random", line="Each wheel gets a random speed, and the car makes up its own dance.",
         need=["TPBot", "micro:bit", "A wide clear patch of floor"],
         steps=[
             "Make two variables, <code>left</code> and <code>right</code>.",
             f"In {b('forever','basic')}, set each one to {b('pick random -100 to 100','math')}.",
             f"Add {b('Set left wheel speed … right wheel speed …')} and drag the two variables into its gaps, then {b('pause (ms) 2000','basic')}.",
             "To finish, press the car's power button twice quickly.",
         ],
         progs=[("t06", "New random speeds for both wheels every 2 seconds.")],
         see="Every 2 seconds the car changes what it is doing: forward, backward, a curve or a spin.",
         idea="A negative speed turns the wheel backwards.",
         change=["Change the pause to 500 for a jumpier car.",
                 "Change the range to 0 to 100 so the car only goes forwards.",
                 "Give the headlights a random colour on each change, with three more random numbers from 0 to 255."],
         src="TPBot_tianpeng_case_06"),
    dict(n=7, title="Here comes the police", line="A police car: driving forward with red and blue flashing lights.",
         need=["TPBot", "micro:bit"],
         steps=[
             f"In {b('on start','basic')}: show an icon and {b('Go Forward at speed 50 %')}.",
             f"In {b('forever','basic')}: headlights red, {b('pause (ms) 100','basic')}, headlights blue, {b('pause (ms) 100','basic')}.",
         ],
         progs=[("t07", "The wheels are started once. The lights change inside forever.")],
         see="The car drives forward while its headlights flash red and blue.",
         idea="The driving block is in on start because the car remembers it. Only the lights need repeating.",
         change=["Change both pauses to 300 for a slower flash.",
                 "Make the car drive for 3 seconds and stop while the lights carry on flashing.",
                 "Design the lights for an ambulance or a recovery truck."],
         src="TPBot_tianpeng_case_07"),
    dict(n=8, title="Parking at a set point", line="The car drives forward and parks itself on a black line.",
         need=["TPBot", "micro:bit", "A strip of black tape across the car's path"],
         steps=[
             f"In {b('on start','basic')}: show an icon and {b('Go Forward at speed 30 %')}.",
             f"In {b('forever','basic')}, add {b('if … then','logic')} with {b('Line sensor state is ● ●')}. That pattern means black under both sensors.",
             f"Inside the if, put {b('Stop the car immediately')}.",
             "Start the car about a metre back from the tape, pointing straight at it.",
         ],
         progs=[("t08", "Drive until both sensors see black.")],
         extra=LINE_KEY,
         see="The car drives forward and stops on the tape.",
         idea="<strong>Drive until</strong> again, this time with the line sensors.",
         change=["Raise the speed to 60 and measure how far past the tape the car rolls.",
                 "Turn the headlights green while driving and red once parked.",
                 "Make the car wait 2 seconds on the tape and then drive on to a second strip."],
         src="TPBot_tianpeng_case_08"),
    dict(n=9, title="Seeking light", line="The car spins until it finds a bright light, then drives towards it.",
         need=["TPBot", "micro:bit", "A torch, or a phone torch"],
         steps=[
             f"In {b('on start','basic')}, set the headlights white.",
             f"In {b('forever','basic')}, add {b('if … then … else','logic')} with the condition {b('light level','input')} <code>&gt; 40</code>.",
             f"In the <em>then</em> gap put {b('Go Forward at speed 50 %')}. In the <em>else</em> gap put {b('Go Left at speed 30 %')}, which spins the car on the spot.",
             "Put the car on the floor and shine the torch at the micro:bit's screen.",
         ],
         progs=[("t09", "Bright: drive forward. Dim: spin and look for the light.")],
         see="The car spins on the spot. When the torch shines on the micro:bit it drives forward, and it spins again when the light moves away.",
         change=["Show the light level on the micro:bit to find the number that suits your room.",
                 "Change 40 so that only the torch sets the car driving.",
                 "Lead the car round a chair with the torch."],
         src="TPBot_tianpeng_case_09"),
    dict(n=10, title="Fall-arrest TPBot", line="The car stays inside a border of black tape.",
         need=["TPBot", "micro:bit", "Black tape laid as a large box on a pale floor"],
         steps=[
             f"In {b('on start','basic')}: show an icon and set the headlights white.",
             f"In {b('forever','basic')}, add {b('if … then … else','logic')}. Build the condition from {b('not','logic')} with {b('Line sensor state is ◌ ◌')} inside it. It reads: the sensors are <em>not</em> both on white.",
             "In the <em>then</em> gap: reverse at 30 % for 1 second, then spin left at 30 % for half a second.",
             f"In the <em>else</em> gap: {b('Go Forward at speed 30 %')}.",
             "Place the car inside the tape box and switch it on.",
         ],
         progs=[("t10", "Any black under the car: back away and turn. All white: drive on.")],
         extra=LINE_KEY,
         see="The car wanders inside the box. Each time a sensor reaches the tape it reverses, turns and sets off in a new direction.",
         idea="ELECFREAKS call this fall-arrest because tape along a table edge keeps the car on the table. A tape box on the floor shows the same idea.",
         change=["Change the half second of turning to a random time between 0.3 and 1 second.",
                 "Flash the headlights red each time the car reaches the tape.",
                 "Count the number of times the car reaches the tape and show the count on the micro:bit."],
         src="TPBot_tianpeng_case_10"),
    dict(n=11, title="Following with a fixed distance", line="The car keeps a steady gap behind whatever is in front of it.",
         need=["TPBot", "micro:bit", "A book to hold in front of the car, or a second car"],
         steps=[
             "Make a variable called <code>distance</code>.",
             f"In {b('forever','basic')}, set <code>distance</code> to {b('Sonar distance unit cm')}.",
             f"Add {b('if … then … else','logic')} and press its <strong>+</strong> to make an <em>else if</em>. First condition: <code>distance &gt; 10 and distance &lt; 20</code>. Second condition: <code>distance &lt; 10</code>.",
             "Set both wheels to 0 in the first gap, to -30 in the second and to 30 in the else gap.",
             "Hold the book about 15 cm in front of the car, then move it slowly away and slowly back.",
         ],
         progs=[("t11", "Between 10 and 20 cm: stay. Closer: back away. Further: catch up.")],
         see="The car follows the book forwards and backs away when the book comes close, keeping a gap of 10 to 20 cm.",
         idea="Three answers to one measurement: too close, just right, too far.",
         change=["Change the gap to between 20 and 30 cm.",
                 "Use a headlight colour for each of the three answers.",
                 "Line up two cars, one following the other, with a person leading the front car."],
         src="TPBot_tianpeng_case_11"),
]

CSS = """
        body { animation: none; }
        .summary, .lesson, .setup li, .key td { font-family: var(--font-body); color: var(--ink-black); }
        .summary { font-size: 0.95rem; line-height: 1.7; margin: var(--gap-xs) 0 var(--gap-md); }
        code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.86em; background: #f0ece4; border-radius: 3px; padding: 0.05em 0.3em; }
        .blk { display: inline-block; font-family: var(--font-ui); font-weight: 600; font-size: 0.8em; color: #fff; border-radius: 4px; padding: 0.05em 0.45em; white-space: nowrap; line-height: 1.5; }
        .blk-tp { background: #32b9b9; } .blk-basic { background: #1e90ff; } .blk-input { background: #d400d4; }
        .blk-logic { background: #00a4a6; } .blk-loops { background: #00aa00; } .blk-vars { background: #dc143c; } .blk-math { background: #9400d3; }
        .blk-game { background: #007a4b; } .blk-arrays { background: #e65722; } .blk-led { background: #5c2d91; }
        .setup { counter-reset: step; list-style: none; margin: 0 0 var(--gap-md); padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
        .setup li { counter-increment: step; background: #fff; border: 1px solid #e6dfd2; border-radius: 8px; padding: 0.9rem 1rem 1rem; font-size: 0.88rem; line-height: 1.6; }
        .setup li::before { content: "Step " counter(step); display: block; font-family: var(--font-display); font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--bronze-core); margin-bottom: 0.3rem; }
        .setup strong.t { display: block; font-family: var(--font-heading); font-size: 1rem; margin-bottom: 0.25rem; }
        .bar { display: flex; justify-content: space-between; align-items: baseline; margin: var(--gap-md) 0 var(--gap-xs); }
        .bar h2 { margin: 0; }
        .group-intro { font-family: var(--font-body); font-size: 0.92rem; line-height: 1.7; color: var(--ink-black); margin: 0 0 var(--gap-xs); }
        .bar button { font-family: var(--font-ui); font-weight: 600; font-size: 0.78rem; color: var(--bronze-dark); background: #fff; border: 1px solid #e0d6c6; border-radius: 6px; padding: 0.35rem 0.8rem; cursor: pointer; }
        .bar button:hover { border-color: var(--bronze-core); }
        details.lesson { background: #fff; border: 1px solid #e6dfd2; border-radius: 10px; margin: 0 0 0.6rem; scroll-margin-top: 1rem; }
        details.lesson[open] { border-color: var(--bronze-light); }
        details.lesson > summary { list-style: none; cursor: pointer; display: grid; grid-template-columns: auto 1fr auto; gap: 0.9rem; align-items: center; padding: 0.85rem 1rem; }
        details.lesson > summary::-webkit-details-marker { display: none; }
        .num { font-family: var(--font-ui); font-weight: 600; font-size: 0.85rem; color: #fff; background: var(--bronze-core); border-radius: 999px; min-width: 2rem; height: 2rem; display: inline-flex; align-items: center; justify-content: center; }
        .st { font-family: var(--font-heading); font-size: 1.05rem; color: var(--ink-black); }
        .st span { display: block; font-family: var(--font-body); font-size: 0.86rem; color: var(--gray-dark); line-height: 1.5; margin-top: 0.1rem; }
        .chev { width: 0.6rem; height: 0.6rem; border-right: 2px solid var(--bronze-core); border-bottom: 2px solid var(--bronze-core); transform: rotate(45deg); transition: transform 0.15s; margin-right: 0.3rem; }
        details[open] > summary .chev { transform: rotate(-135deg); }
        .body { padding: 0.2rem 1.1rem 1.1rem; border-top: 1px solid #f0ece4; font-size: 0.92rem; line-height: 1.7; }
        .body p.how { margin: 0; }
        .body h3 { font-family: var(--font-ui); font-weight: 600; font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--bronze-dark); margin: 1.1rem 0 0.35rem; }
        .body ol, .body ul { margin: 0; padding-left: 1.3rem; }
        .body li { margin: 0 0 0.4rem; }
        .need { display: flex; flex-wrap: wrap; gap: 0.35rem; list-style: none; padding: 0 !important; }
        .need li { background: #faf7f2; border: 1px solid #e0d6c6; border-radius: 999px; padding: 0.05rem 0.7rem; font-size: 0.82rem; margin: 0; }
        figure.prog { margin: 0.9rem 0 0; }
        figure.prog .frame { background: #f7f5f1; border: 1px solid #ece7dd; border-radius: 8px; padding: 0.9rem; overflow-x: auto; }
        figure.prog img { display: block; max-width: 100%; height: auto; }
        figure.prog figcaption { font-size: 0.84rem; color: var(--gray-dark); margin-top: 0.35rem; line-height: 1.5; }
        .see { background: #f3f8f4; border-left: 3px solid #2e7d4f; border-radius: 0 6px 6px 0; padding: 0.6rem 0.9rem; margin: 0; }
        .idea { background: #faf7f2; border-left: 3px solid var(--bronze-core); border-radius: 0 6px 6px 0; padding: 0.6rem 0.9rem; margin: 1rem 0 0; }
        .key { border-collapse: collapse; margin: 0.9rem 0 0; }
        .key th { font-family: var(--font-ui); font-weight: 600; font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-dark); text-align: left; padding: 0.25rem 0.9rem 0.25rem 0; border-bottom: 1px solid var(--bronze-light); }
        .key td { font-size: 0.86rem; padding: 0.25rem 0.9rem 0.25rem 0; border-bottom: 1px solid #ece7dd; }
        .key td:first-child { font-size: 1rem; letter-spacing: 0.1em; white-space: nowrap; }
        .docs { list-style: none; padding: 0 !important; display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .docs a, a.src { font-family: var(--font-ui); font-weight: 600; font-size: 0.8rem; text-decoration: none; color: var(--bronze-dark); background: #fff; border: 1px solid #e0d6c6; border-radius: 6px; padding: 0.3rem 0.7rem; display: inline-block; }
        .docs a:hover, a.src:hover { border-color: var(--bronze-core); }
        .srcline { margin: 1.1rem 0 0; }
        .credit-note { font-family: var(--font-body); font-size: 0.85rem; color: var(--gray-dark); font-style: italic; background: #faf7f2; border: 1px solid #f0ece4; border-radius: 4px; padding: var(--gap-sm) var(--gap-md); margin: var(--gap-lg) 0 var(--gap-md); line-height: 1.6; }
        .credit-note a { color: var(--bronze-light); }
        @media (max-width: 860px) { .setup { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .setup { grid-template-columns: 1fr; } details.lesson > summary { gap: 0.6rem; padding: 0.75rem 0.8rem; } }
"""

JS = """
    <script>
    (function () {
        var all = Array.prototype.slice.call(document.querySelectorAll('details.lesson'));
        var btn = document.getElementById('toggle-all');
        function label() { btn.textContent = all.every(function (d) { return d.open; }) ? 'Close all' : 'Open all'; }
        function fromHash() {
            var d = location.hash && document.getElementById(location.hash.slice(1));
            if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView(); }
        }
        btn.addEventListener('click', function () {
            var open = !all.every(function (d) { return d.open; });
            all.forEach(function (d) { d.open = open; });
        });
        all.forEach(function (d) {
            d.addEventListener('toggle', function () {
                label();
                if (d.open && history.replaceState) history.replaceState(null, '', '#' + d.id);
            });
        });
        window.addEventListener('hashchange', fromHash);
        fromHash(); label();
    })();
    </script>"""


def figure(pid, cap, man):
    m = man[pid]
    w = round(m["w"] * 0.8)
    return (f'<figure class="prog"><div class="frame"><img src="../blocks/{pid}.png" width="{w}" '
            f'height="{round(m["h"] * 0.8)}" loading="lazy" alt="MakeCode blocks. {cap}"></div>'
            f'<figcaption>{cap}</figcaption></figure>')


def lesson(L, man, word, prefix="lesson"):
    o = [f'<details class="lesson" id="{prefix}-{L["n"]}">',
         f'<summary><span class="num">{L["n"]}</span><span class="st">{L["title"]}<span>{L["line"]}</span></span><span class="chev"></span></summary>',
         '<div class="body">',
         f'<h3>How the game works</h3><p class="how">{L["how"]}</p>' if L.get("how") else "",
         '<h3>You need</h3><ul class="need">' + "".join(f"<li>{x}</li>" for x in L["need"]) + "</ul>",
         f'<h3>{word}</h3><ol>' + "".join(f"<li>{x}</li>" for x in L["steps"]) + "</ol>"]
    if L["progs"]:
        o.append("<h3>The blocks</h3>" + "".join(figure(p, c, man) for p, c in L["progs"]))
    if L.get("extra"):
        o.append(L["extra"])
    o.append(f'<h3>What happens</h3><p class="see">{L["see"]}</p>')
    if L.get("idea"):
        o.append(f'<p class="idea"><strong>The idea.</strong> {L["idea"]}</p>')
    if L["change"]:
        o.append("<h3>Now change it</h3><ul>" + "".join(f"<li>{x}</li>" for x in L["change"]) + "</ul>")
    if L.get("docs"):
        o.append('<h3>Documents</h3><ul class="docs">' + "".join(f'<li><a href="{h}">{t}</a></li>' for t, h in L["docs"]) + "</ul>")
    if L.get("src"):
        o.append(f'<p class="srcline"><a class="src" href="{WIKI}{L["src"]}" target="_blank" rel="noopener">ELECFREAKS Case {L["n"]:02d}</a></p>')
    o.append("</div></details>")
    return "\n            ".join(o)


def page(title, crumb, eyebrow, summary, top, groups, man, credit):
    """groups: [(heading, intro, lessons, steps_word, id_prefix)]. The first carries Open all."""
    parts = []
    for i, (heading, intro, lessons, word, prefix) in enumerate(groups):
        btn = '<button type="button" id="toggle-all">Open all</button>' if i == 0 else ""
        parts.append(f'<div class="bar"><h2>{heading}</h2>{btn}</div>'
                     + (f'\n        <p class="group-intro">{intro}</p>' if intro else ""))
        parts += [lesson(L, man, word, prefix) for L in lessons]
    body = "\n\n        ".join(parts)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — MYP Design — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../../../vault.css">
    <style>{CSS}    </style>
</head>
<body>
    <div class="container container--wide">
        <nav class="breadcrumb">
            <a href="../../../../">The Vault</a><span>·</span>
            <a href="../../../">MYP</a><span>·</span>
            <a href="../../">Design</a><span>·</span>
            <a href="../">Robotics &amp; Control</a><span>·</span>
            {crumb}
        </nav>
        <div class="section-header">
            <span class="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
        </div>
        <div class="rule--full"></div>

        <p class="summary">{summary}</p>
{top}
        {body}

        <div class="credit-note">{credit}</div>

        <footer class="site-footer">The Vault · MYP Design · Robotics &amp; Control · 2026</footer>
    </div>
{JS}
</body>
</html>
"""


TPBOT_TOP = """
        <h2>Getting the car ready</h2>
        <ol class="setup">
            <li><strong class="t">Add the TPBot blocks</strong>In MakeCode click <strong>Extensions</strong>, type <code>tpbot</code> and click the <strong>TPBot</strong> card. A teal drawer called TPBot joins the list.</li>
            <li><strong class="t">Download</strong>Build your program and download it to the micro:bit, the same way as for your game.</li>
            <li><strong class="t">Slot it in</strong>Unplug the micro:bit and push it into the slot on top of the car until it sits firmly.</li>
            <li><strong class="t">Switch on, on the floor</strong>Put the car on the floor and press the power button once. Press it twice quickly to switch the car off.</li>
        </ol>
"""

ROWS = dict(
    makecode='<tr><td class="lt"><a href="makecode/">micro:bit with MakeCode</a><span>The lessons so far, from the first name badge to Carousel Play Day. Open a lesson to see its steps and blocks.</span></td></tr>',
    tpbot='<tr><td class="lt"><a href="tpbot/">Coding the TPBot</a><span>Eleven lessons for the robot car: driving, headlights, line tracking and the sonar.</span></td></tr>')
BLOCK = (f"""{M_START}
        <h2>Lesson pages</h2>
        <table class="lesson-table">
"""
         + "".join(f"            {ROWS[k]}\n" for k in ("makecode", "tpbot") if k in LIVE)
         + f"""        </table>
        {M_END}""")


def write_if_changed(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            if f.read() == text:
                return
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def main():
    with open(MANIFEST, encoding="utf-8") as f:
        man = json.load(f)
    sets = dict(makecode=MAKECODE + GAMES, tpbot=TPBOT)
    used = [p for k in LIVE for L in sets[k] for p, _ in L["progs"]]
    for pid in used:
        png = os.path.join(ROOT, UNIT, "blocks", pid + ".png")
        if pid not in man or man[pid]["hash"] != code_hash(pid) or not os.path.exists(png):
            raise SystemExit(f"block picture for {pid} is missing or stale: run render_design8_blocks.py")

    pages = {
        f"{UNIT}/makecode/index.html": page(
            "micro:bit with MakeCode", "micro:bit with MakeCode", "MYP Design · Year 8 · Lessons so far",
            "Every lesson so far with the micro:bit, in order, followed by nine games to build. Open one to see what you need, the steps, "
            "the blocks and something to try next. All of the building happens at "
            '<a href="https://makecode.microbit.org" target="_blank" rel="noopener">makecode.microbit.org</a>.',
            "", [("Lessons", "", MAKECODE, "Steps", "lesson"),
                 ("Games to build",
                  "Nine games like the ones Year 8 built for the Mini Project. Each one explains how the game works, "
                  "then gives the basic steps. Build one, then make it your own.",
                  GAMES, "Basic steps", "game")], man,
            'Block pictures are drawn by <a href="https://makecode.microbit.org" target="_blank" rel="noopener">Microsoft MakeCode</a>. '
            "Lessons 1 and 2 are adapted from <em>Intro to Computer Science with MakeCode for micro:bit</em> by Douglas Kiang and Mary Kiang, "
            'published by Microsoft MakeCode. The full course is on the <a href="../">Robotics &amp; Control</a> page.'),
        f"{UNIT}/tpbot/index.html": page(
            "Coding the TPBot", "Coding the TPBot", "MYP Design · Year 8 · The robot car",
            "Eleven lessons for the TPBot robot car. Each one is a short program to build, run on the floor and then change. "
            "Open a lesson to see what you need, the steps and the blocks.",
            TPBOT_TOP, [("Lessons", "", TPBOT, "Build it", "lesson")], man,
            f'These eleven lessons follow Cases 01 to 11 of the <a href="{WIKI}" target="_blank" rel="noopener">TPBot guide by ELECFREAKS</a>, '
            "who make the car. Each lesson links to its original case. The programs here were rebuilt with the current TPBot blocks and the "
            'instructions written for this class. Block pictures are drawn by <a href="https://makecode.microbit.org" target="_blank" rel="noopener">Microsoft MakeCode</a>.'),
    }
    for rel, text in pages.items():
        if rel.split("/")[-2] not in LIVE:
            continue
        write_if_changed(os.path.join(ROOT, rel), text)
        print(f"PUBLISH: {rel}")
    for pid in used:
        print(f"PUBLISH: {UNIT}/blocks/{pid}.png")

    hub = os.path.join(ROOT, HUB)
    with open(hub, encoding="utf-8") as f:
        text = f.read()
    if M_START in text:
        a = text.index(M_START)
        z = text.index(M_END) + len(M_END)
        new = text[:a] + BLOCK + text[z:]
    else:
        if ANCHOR not in text:
            raise SystemExit("hub anchor not found: " + ANCHOR.strip())
        new = text.replace(ANCHOR, "        " + BLOCK + "\n\n" + ANCHOR, 1)
    write_if_changed(hub, new)
    print(f"PUBLISH: {HUB}")


if __name__ == "__main__":
    main()
