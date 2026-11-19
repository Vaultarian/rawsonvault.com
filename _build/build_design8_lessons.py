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
        .setup { counter-reset: step; list-style: none; margin: 0 0 var(--gap-md); padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
        .setup li { counter-increment: step; background: #fff; border: 1px solid #e6dfd2; border-radius: 8px; padding: 0.9rem 1rem 1rem; font-size: 0.88rem; line-height: 1.6; }
        .setup li::before { content: "Step " counter(step); display: block; font-family: var(--font-display); font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--bronze-core); margin-bottom: 0.3rem; }
        .setup strong.t { display: block; font-family: var(--font-heading); font-size: 1rem; margin-bottom: 0.25rem; }
        .bar { display: flex; justify-content: space-between; align-items: baseline; margin: var(--gap-md) 0 var(--gap-xs); }
        .bar h2 { margin: 0; }
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


def lesson(L, man, word):
    o = [f'<details class="lesson" id="lesson-{L["n"]}">',
         f'<summary><span class="num">{L["n"]}</span><span class="st">{L["title"]}<span>{L["line"]}</span></span><span class="chev"></span></summary>',
         '<div class="body">',
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


def page(title, crumb, eyebrow, summary, top, lessons, man, word, credit):
    body = "\n\n        ".join(lesson(L, man, word) for L in lessons)
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
        <div class="bar"><h2>Lessons</h2><button type="button" id="toggle-all">Open all</button></div>

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

BLOCK = f"""{M_START}
        <h2>Lesson pages</h2>
        <table class="lesson-table">
            <tr><td class="lt"><a href="makecode/">micro:bit with MakeCode</a><span>The lessons so far, from the first name badge to Carousel Play Day. Open a lesson to see its steps and blocks.</span></td></tr>
            <tr><td class="lt"><a href="tpbot/">Coding the TPBot</a><span>Eleven lessons for the robot car: driving, headlights, line tracking and the sonar.</span></td></tr>
        </table>
        {M_END}"""


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
    used = [p for L in MAKECODE + TPBOT for p, _ in L["progs"]]
    for pid in used:
        png = os.path.join(ROOT, UNIT, "blocks", pid + ".png")
        if pid not in man or man[pid]["hash"] != code_hash(pid) or not os.path.exists(png):
            raise SystemExit(f"block picture for {pid} is missing or stale: run render_design8_blocks.py")

    pages = {
        f"{UNIT}/makecode/index.html": page(
            "micro:bit with MakeCode", "micro:bit with MakeCode", "MYP Design · Year 8 · Lessons so far",
            "Every lesson so far with the micro:bit, in order. Open a lesson to see what you need, the steps, "
            "the blocks and something to try next. All of the building happens at "
            '<a href="https://makecode.microbit.org" target="_blank" rel="noopener">makecode.microbit.org</a>.',
            "", MAKECODE, man, "Steps",
            'Block pictures are drawn by <a href="https://makecode.microbit.org" target="_blank" rel="noopener">Microsoft MakeCode</a>. '
            "Lessons 1 and 2 are adapted from <em>Intro to Computer Science with MakeCode for micro:bit</em> by Douglas Kiang and Mary Kiang, "
            'published by Microsoft MakeCode. The full course is on the <a href="../">Robotics &amp; Control</a> page.'),
        f"{UNIT}/tpbot/index.html": page(
            "Coding the TPBot", "Coding the TPBot", "MYP Design · Year 8 · The robot car",
            "Eleven lessons for the TPBot robot car. Each one is a short program to build, run on the floor and then change. "
            "Open a lesson to see what you need, the steps and the blocks.",
            TPBOT_TOP, TPBOT, man, "Build it",
            f'These eleven lessons follow Cases 01 to 11 of the <a href="{WIKI}" target="_blank" rel="noopener">TPBot guide by ELECFREAKS</a>, '
            "who make the car. Each lesson links to its original case. The programs here were rebuilt with the current TPBot blocks and the "
            'instructions written for this class. Block pictures are drawn by <a href="https://makecode.microbit.org" target="_blank" rel="noopener">Microsoft MakeCode</a>.'),
    }
    for rel, text in pages.items():
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
