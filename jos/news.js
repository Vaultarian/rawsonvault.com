/* ============ 📰 JOS'S NEWS ============
   Jos (2 Nov 2026): "in the bottom left is news in big orange letters and behind it is the Mobius
   strip instead of a globe. You know how there is news with a globe behind it; make it the Mobius
   strip." And: "everything I make below it, add a look at it button or a play it button, and it
   will send you to that game or tool, or it will show you what it is if it's not a game and it's
   just a visual."
   Then: "make it so it covers the whole screen when they click news and there's a bit more detail
   to it… in the bottom right corner… is a news person holding the register of all the new news
   with news on the front page and news on the back and a little speech bubble is coming out of
   him and it tells you the news."

   Then: "the newsman is saying the whole thing… he should be saying this, not his own little
   detail. Make that small bubble fill all of those" — and "I can't see my cursor".

   Bottom left of the home page: NEWS, with the family's Möbius strip turning round behind it, like
   the globe behind the news on TV. Click it and the home page goes grey, and ALL the news comes
   out of the newsman's mouth in one big speech bubble, newest first. He stands in the bottom right
   corner holding his newspaper (NEWS on the front, NEWS on the back). Point at a story and he
   flips his paper and talks. Click the grey edges, the ✕, or press Esc to go back.

   ⭐ CARL: when Jos finishes something (or moves on to something else), write it in
     ~/jos/news-notes.md. At gameover, move everything from there to the TOP of the list below.
     play:    'folder/'        → a ▶ Play it button (a game)
     look:    'folder/'        → a 👀 Look at it button (a tool, or something to look at)
     picture: 'folder/pic.png' → a 👀 Look at it button that shows the picture right here
     show:    'clock'          → a 👀 Look at it button that shows something already on this page
     what = the headline (in bold), more = the detail underneath */
(function () {
  var NEWS = [
    { emoji:'✂️', when:'21 Nov', title:'LDLC: Crop and shape, and infinity tilt',
      what:'New in Advanced: Crop and shape, next to the Eraser. Click a block and drag its green circles to change its shape, as big as the whole level.',
      more:'Click a line to add a circle, and choose Curved (a bump) or Hard (a point). The hero walks up slopes and bumps, and a shape only hits you where it really is. ' +
           'Tilt can be infinity: click in the Tilt box and press I, and it keeps turning forever. ' +
           'Back to how it was puts the shape back, and a new circle has Curved and Hard buttons under it.',
      look:'ldlc/levels.html' },
    { emoji:'🕳️', when:'20 Nov', title:'Throw It In: no emoji, a box, red tape and hitboxes',
      what:'All 150 pieces of junk are real 3D shapes now, and junk is solid: every piece has a hitbox that fits its shape.',
      more:'The yard starts 16 metres by 10 metres and grows. The money waits in the hole until the bonus bar runs out. ' +
           'Vacuum cleaners are see-through, so you can see what they sucked up, and their eyebrows slant down when you pick them up. 30 out of 100 put dust on a machine, and it is broken for as long as they were on it. ' +
           'Press X at the cleaner box to return it: it leaves 5 vacuum cleaners that tape up the hole, and you click each piece of tape 10 times to pull it off. ' +
           'New tool: a box that holds junk. Press F to flip it and tip the junk out. Put it in the hole and it bonks you on the head! ' +
           'Each machine has a red X where its junk lands, the tools are half the size, and junk, coins, the box and the tape are still there when you reload. ' +
           'HOLE GROWS BIGGER now shows the three words one under the other, over the game.',
      play:'throw-it-in/' },
    { emoji:'🕳️', when:'19 Nov', title:'Throw It In: a brand new 3D game',
      what:'Turn the wheels on the machine, junk shoots out, and you throw it in the hole. The hole chucks coins back out!',
      more:'There are 150 pieces of junk, plus gold junk (times 3) and silver junk (times 2). The coins are bronze, silver, gold and plasma. ' +
           'Buy fans, trampolines, panels and a junk magnet, and get combos by throwing junk in quickly. ' +
           'At 100 pieces of junk the screen says HOLE GROWS BIGGER, the hedge moves out and the hole zooms to a new place. ' +
           'Watch out for the cleaner box and its vacuum cleaners. And you can jump down the hole yourself!',
      play:'throw-it-in/' },
    { emoji:'🚀', when:'19 Nov', title:'Trampoline Tramp: the sky update',
      what:'With zero gravity, a GO BACK DOWN button appears when you are over 30 feet up. And the air runs out if you go too high!',
      more:'The game tells you when you pass each layer of the sky: the troposphere, the stratosphere, the mesosphere and the thermosphere. ' +
           'Above the troposphere a pulsing red air bar appears. It empties in 15 seconds, and then the game starts over. Come back down and it fills up again. ' +
           'The flickering on the far-away mountains is fixed too.',
      play:'trampoline-tramp/' },
    { emoji:'✨', when:'17 Nov', title:'Trampoline Tramp: power orbs, getting sick, and pick your season',
      what:'Catch a glowing power orb and watch an ad for 1 minute of every upgrade and infinite coins and money. But bounce too much and you get sick!',
      more:'A small glowing orb with spinning rings waits in front of you when you press Play, and every minute there is a 1 in 4 chance another one appears in the yard. ' +
           'Walk into it and choose Cancel or Watch ad. After the ad you get every upgrade and infinite coins and money for 1 minute. ' +
           'Being in the air makes you a little hungry. Bounce more than 20 times in a row, or keep moving for 20 seconds without stopping, and you get sick: ' +
           'the screen goes woozy and green, and you get hungry for 20 seconds. ' +
           'Type spring, summer, autumn or winter while you play and the season changes straight away. And Start over now starts a fresh game as soon as you press Yes.',
      play:'trampoline-tramp/' },
    { emoji:'🚌', when:'16 Nov', title:'Trampoline Tramp: 3D jobs and a whole town',
      what:'Every job is now 3D, and the world has a town, traffic, day and night, and the four seasons.',
      more:'Pick a job on the computer and a bus picks you up at the gate. Mow a lawn, catch pests in a house (don\'t cage the cat!), fix pipes down a manhole, ' +
           'flip pancakes in a café, make pizzas for customers, and sort the recycling. Press Esc to leave a job early for $2. ' +
           'Across the road there are houses, shops and a city, with a kid on a swing next door. Cars and people cross the road, and the bus stops for them. ' +
           'A day lasts 4 minutes, with a sun, a moon, stars and clouds. The seasons change every 2 days: leaves grow in spring, fall in autumn, and in winter there is snow and icicles. Sometimes it rains. Press N to skip to the next season.',
      play:'trampoline-tramp/' },
    { emoji:'🤸', when:'15 Nov', title:'Trampoline Tramp',
      what:'Bounce on a trampoline in a 3D yard, do jobs, buy food, and unlock a giant skill tree.',
      more:'Walk into the yard and bounce on the trampoline. Press Space right as you land to bounce higher, and the higher you go the more coins you get. ' +
           'Click the old computer in the garage to open the skill tree: upgrades split into two, and some join back together into one big one. ' +
           'The computer also has jobs, like mowing the lawn, catching pests and fixing the plumbing. Jobs earn money, and money buys food. ' +
           'Watch your stomach bar. If it runs out, you fall over and the game starts again.',
      play:'trampoline-tramp/' },
    { emoji:'💣', when:'15 Nov', title:'Bomb Sandbox update',
      what:'Friendlier bomb names, a hover box that shows each bomb going off, a pixel BACK button, and prices that climb in 8 levels.',
      more:'Hover over a bomb in the shop for half a second and a little film shows it going off. The bombs now unlock in 8 levels, with the Mega Goo Bomb at the very end. ' +
           'The Biggest Bang Bomb and the Mega Goo Bomb are the last ones to find.',
      play:'bomb-sandbox/' },
    { emoji:'💣', when:'14 Nov', title:'Bomb Sandbox',
      what:'Dig a giant hole with over 100 bombs: big bang, black hole, mice, goo and more.',
      more:'Click the shopkeeper to buy bombs with the blocks you break. Throw a bomb, then pick the Spark Stick and click it to set it off. ' +
           'Pick the Pickaxe to dig up the slope, the Nature Block to fill holes with the right ground, and walk over holes to make bridges that bend. ' +
           'Dig through the bottom of the world and the white void sends you back to the surface. ' +
           'Nature Bombs grow the ground back, the Flat Bomb makes the whole world flat, and the Mega Goo Bomb asks first because it changes the whole map. ' +
           'It has a home screen with named games that save in your browser, and a trailer.',
      play:'bomb-sandbox/' },
    { emoji:'🧩', when:'14 Nov', title:'Puzzle Daily',
      what:'Three new puzzles every day: Scoot, Neon and Currents.',
      more:'A bot makes each puzzle fresh at midnight and checks it can be done. Slide the blocks so the red one escapes in Scoot, join the dots along the tracks in Neon, ' +
           'and draw one line through the numbers in order in Currents. Finish one and it is locked for the day. Every puzzle has a theme.',
      play:'puzzled-daily/' },
    { emoji:'🎶', when:'13 Nov', title:'Song Maker',
      what:'Click squares to make your own song, add drums and press play.',
      more:'Pick a melody sound (Marimba, Piano, Strings, Woodwind, Synth) and a beat sound (Electronic, Blocks, Kit, Conga). ' +
           'The play button splits into two bars. Press the tick to copy a link, then download your song as .mp3, .wav or .mid. ' +
           'Change name gives your song a name.',
      look:'song-maker/' },
    { emoji:'🏀', when:'13 Nov', title:'Bouncy Balls',
      what:'A noise meter: the louder you are, the higher the balls bounce.',
      more:'Press Start bouncing and allow the microphone. Pick your Total, a Theme (Minecraft blocks, Pizza, Bubbles, Eyeballs that look around…), ' +
           'a Noise alert with Jos\'s own sounds, and Ball bounciness. At 100, even a tap sends them all the way to the top.',
      look:'bouncy-balls/' },
    { emoji:'😈', when:'13 Nov', title:'LDLC: devils use portals and triggers',
      what:'A devil has the same switch as the ball.',
      more:'Turn on Go through portals and use triggers and a devil sets off triggers and goes in one portal and comes out of its partner.',
      look:'ldlc/levels.html' },
    { emoji:'🧱', when:'12 Nov', title:'LDLC: who a block stops',
      what:'Collision has a Type: All, Only player or Only devil.',
      more:'Turn Collision on and a Type drop bar appears. Only player stops you but lets devils walk through. ' +
           'Only devil does the opposite. Triggers can use Change collision in the Do list to turn Collision on or off and ' +
           'choose the Type while you play.',
      look:'ldlc/levels.html' },
    { emoji:'📟', when:'12 Nov', title:'LDLC: the Device',
      what:'A glowing circle that floats in front of you and kills devils.',
      more:'The lights slowly fade from green to red. Pick it up and any devil that touches you dies. Turn on Devil max ' +
           'and it can only kill that many, like 3, and then it disappears and does not come back.',
      look:'ldlc/levels.html' },
    { emoji:'👿', when:'12 Nov', title:'LDLC: the Devil',
      what:'A 😈 that chases you, jumps over blocks, and laughs when it catches you.',
      more:'The screen goes grey and then fades back while the same little devil tips back and laughs. Every devil has its own ' +
           'Jump power and Speed. Attraction can be a type (Player, Anything, or a kind of block) or one numbered block. ' +
           'Turn on Destroy attraction and it stands at the edge, white particles come out, and the block is destroyed after the ' +
           'Destroying time. Movement can be Platformer or Top view, so it can fly straight at you.',
      look:'ldlc/levels.html' },
    { emoji:'📝', when:'12 Nov', title:'LDLC: the Text block',
      what:'Blue for words, green for numbers, and triggers can change them.',
      more:'Type something and the square goes away, leaving glowing words at any Size. Text shows over everything. ' +
           'Triggers can give a new sentence with a Splash word, or set or change a number. A trigger also has a Repeat type: ' +
           'once, each time he goes in, or while he is inside.',
      look:'ldlc/levels.html' },
    { emoji:'🌀', when:'12 Nov', title:'LDLC: Tilt and Visibility',
      what:'Turn any block by any angle, and choose how see-through it is.',
      more:'Tilt is in the block properties and also a Do for triggers, so a block can turn smoothly. In the creator you see the ' +
           'regular block with the tilted one see-through on top. Visible has a Visibility % from 0 to 100.',
      look:'ldlc/levels.html' },
    { emoji:'📋', when:'12 Nov', title:'LDLC: copy and paste',
      what:'Right-click a block to Copy it, and right-click an empty square to Paste.',
      more:'Copy takes everything about the block. Paste is greyed out on a block so you never paste over one. Right-click a ' +
           'trigger card, tick actions, press Done, and use Copy actions and Paste actions to give another block the same actions.',
      look:'ldlc/levels.html' },
    { emoji:'💚', when:'12 Nov', title:'LDLC: the Checkpoint remembers everything',
      what:'Die and you keep your coins, triggers and moved blocks.',
      more:'The grey checkpoint is now four broken pieces, and its lightning bolt is smaller. Movement also has Change speed, ' +
           'with decimals, when a block has two triggers.',
      look:'ldlc/levels.html' },
    { emoji:'💚', when:'9 Nov', title:'LDLC: the Checkpoint',
      what:'A green diamond that remembers where you got to.',
      more:'It starts as a grey cracked kite with a green glow. Touch it and a green lightning bolt comes down ' +
           'from the ceiling and hits it. The cracks go and it turns into a bright green diamond. If you die, ' +
           'you start again from it. Restart goes back to the very beginning.',
      play:'ldlc/' },
    { emoji:'📋', when:'9 Nov', title:'LDLC: share a level',
      what:'Copy link and Copy code next to Test, and Paste level code on My levels.',
      more:'Press Copy code in the creator, send it to another device, and press Paste level code on My levels. ' +
           'It asks if you want to add the level. You do not have to send the level to Jos first.',
      play:'ldlc/' },
    { emoji:'🔗', when:'9 Nov', title:'LDLC: connecting blocks is easier',
      what:'Trigger to block has a Done button, and you can drag a box round blocks to connect them all.',
      more:'Choose your triggers, press Done, then drag a box round the blocks. A trigger can connect to another ' +
           'trigger too. Many Camera position blocks can be changed together, and every step of a Repeating ' +
           'trigger has a Wait box. Balls can go through portals and use triggers.',
      play:'ldlc/' },
    { emoji:'🔁', when:'8 Nov', title:'LDLC: the Repeating trigger',
      what:'A new block in Advanced levels: the steps go round and round, over and over.',
      more:'It is a trigger with arrows curling round its exclamation mark. Touch it and the blocks it is ' +
           'connected to do their steps one after another, then start again, like a block that goes up three ' +
           'and then down three for ever. Drag the steps into the order you want.',
      play:'ldlc/' },
    { emoji:'🚪', when:'8 Nov', title:'LDLC: Needed heroes and a smarter camera',
      what:'With lots of Heroes, the camera follows all of them and zooms out so they stay on the screen.',
      more:'Mark Heroes as Needed for finish, and then every Needed Hero has to go into a Door ' +
           'before the level is won. The first one in makes the door close and open again, but it is ' +
           'RED inside. A second later it shakes and turns black again, while the Hero waits inside ' +
           'for the others. A Hero you did not mark ignores the doors.',
      play:'ldlc/' },
    { emoji:'😈', when:'8 Nov', title:'LDLC: difficulties',
      what:'When you create a level it asks: Beginner, Regular or Advanced.',
      more:'Beginner keeps the guide on and hides Edit controls and the Dash orb. Regular has all ' +
           'the usual blocks. Advanced gives you the advanced commands (the editor commands have a ' +
           'new name), the Camera position, Hill and Ball blocks, and lets you put down lots of ' +
           'Heroes and Doors that all do the same thing. Press left and every Hero goes left.',
      play:'ldlc/' },
    { emoji:'📷', when:'8 Nov', title:'LDLC: choose your grid size, and a camera',
      what:'Choose how big your level is, from one screen up to 160 by 90, and zoom out to see it all.',
      more:'A new level asks what grid size you want. Rechoose size changes it later, and Zoom has a ' +
           'slider and Zoom to fit. Hold Space and drag to move around a big level without putting ' +
           'blocks down. When you play, the camera follows your hero. The new Camera position block ' +
           'can send the camera to a spot you choose, or slide it up, down, left or right, and it ' +
           'can make the hero die if he goes off the screen.',
      play:'ldlc/' },
    { emoji:'⚪', when:'8 Nov', title:'LDLC: the Ball and the Hill',
      what:'A blue Ball that is not deadly unless you say so, and a Hill for it to roll down.',
      more:'Turn Gravity on and the ball falls, bounces and rolls down the hill. Turn Crush deadly ' +
           'on and it kills you if it lands on your head, but you are safe if you touch its side or ' +
           'top. A trigger can turn its Gravity on and off. Your hero can walk up and down the hill ' +
           'too.',
      play:'ldlc/' },
    { emoji:'😈', when:'8 Nov', title:'LDLC: gravity can go any way',
      what:'Set gravity to Up, Down, Left or Right, and your hero turns so his feet stand on the new floor.',
      more:'The Edit controls block now has a Do list, like a trigger: add Set gravity, or Change ' +
           'controls. The Hero can start with any gravity too. He jumps straight away from the ' +
           'floor, still exactly as high as his Jump power.',
      play:'ldlc/' },
    { emoji:'😈', when:'8 Nov', title:'LDLC: speed and scary music',
      what:'The Hero and Edit controls both have a Speed box, and the LDLC menus have scary music.',
      more:'The music plays on the LDLC home screen and the My Levels page only, not when you build ' +
           'or play. A little speaker button in the top right turns it off.',
      play:'ldlc/' },
    { emoji:'🧩', when:'8 Nov', title:'Sudoku is in the Games menu',
      what:'You can find Sudoku in the Games list on the main page now.',
      more:'It has its own how-to-play card too, and a Back button on its start screen.',
      play:'sudoku/' },
    { emoji:'😈', when:'8 Nov', title:'LDLC: jump power',
      what:'Jump power is how many blocks high you jump, and every jump goes exactly that high.',
      more:'A normal jump is 2 blocks. You can set it on the Hero from the very start, and an Edit ' +
           'controls block can change it later in the level. Letting go early no longer makes a ' +
           'smaller jump.',
      play:'ldlc/' },
    { emoji:'🔢', when:'8 Nov', title:'Sudoku: tutorials you can play, and an eraser that stays on',
      what:'Three tutorials teach you Sudoku, and the eraser can stay on in lightning mode.',
      more:'Tutorial 1 teaches the buttons one at a time, then a little clip shows someone finishing ' +
           'a level. Tutorial 2 is a small 4 by 4 board and Tutorial 3 is 6 by 6, each with a guide ' +
           'that asks which number is missing from a row, a column and a box. In lightning mode the ' +
           'eraser stays glowing red so you can keep rubbing squares out.',
      play:'sudoku/' },
    { emoji:'💡', when:'7 Nov', title:'Sudoku: hints, coins and tutorials',
      what:'Sudoku has a lightbulb hint button, coins you win by finishing levels, and a rewind button on levels you already did.',
      more:'Click the lightbulb for a hint. Click the little + for more help: reveal a square, reveal a random ' +
           'square, or type a number to reveal that many. Squares are named like chess, so the bottom left is A1. ' +
           'A right number glows green and a wrong one goes red. Finish a level and confetti falls, a fanfare ' +
           'plays and ten coins fly into your coin counter. Squares 1 to 3 are tutorials, and Level 1 is open ' +
           'from the start. Open a level you already finished and a spinning rewind button lets you play it again.',
      play:'sudoku/' },
    { emoji:'🔢', when:'6 Nov', title:'Sudoku',
      what:'A sudoku game with 100 levels. Every level is made brand new while the loading dots go round.',
      more:'A little program puts random numbers in the grid and checks it can be solved. If it cannot, it tries ' +
           'again, all in about 1.5 seconds. Higher levels start with fewer numbers. Pencil notes, an eraser, and a ' +
           'red message that tells you the rule when you put a number in the wrong place. A good number glows green, ' +
           'and finishing a row, column or box sends green spreading along it. Finish all nine of a number and its ' +
           'button whirls away. Lightning mode lights up a number so you can click lots of squares. Click a ' +
           'locked level and it shows which level to beat next. Pull the level screen down and a lock whirls in.',
      play:'sudoku/' },
    { emoji:'📰', when:'2 Nov', title:'NEWS!',
      what:'This! Click NEWS and the newsman tells you every new thing, in one big speech bubble.',
      more:'The home page goes grey and all the news comes out of the newsman’s mouth in a giant speech ' +
           'bubble. The Möbius strip turns behind the big orange letters, like a TV news globe. He stands in ' +
           'the corner holding his newspaper (NEWS on the front and NEWS on the back). Point at a story and ' +
           'he flips it over and talks, with 10 different mouth shapes. Click the grey edges to go back.',
      picture:'ldlc/ring-spin.webp', strip:48 },
    { emoji:'📖', when:'1 Nov', title:'LDLC beginner bubbles',
      what:'Open a level in LDLC and type beginner. Gold bubbles with arrows show you how everything works.',
      more:'Made with a friend. The bubbles change with what you are doing: pick Trigger to block and they ' +
           'show steps 1, 2 and 3, with the step you are on lit up. The Hero says "You start here" and the ' +
           'Door says "Get here to win!". Clicks go straight through, so you can keep building. Type beginner ' +
           'again to hide them.',
      look:'ldlc/levels.html' },
    { emoji:'😈', when:'31 Oct', title:'LDLC: Level Devil Level Creator',
      what:'Make your own Level Devil levels, play them, and send the best ones to Jos.',
      more:'14 blocks, all drawn from Jos’s own pictures: spikes, sawblades, springs, portals, dash orbs, ' +
           'triggers, buttons and more. Press TEST and the devil’s mouth closes over your level. My levels ' +
           'keeps every level you make, and PLAY mixes them all up. Beat your level and you can send it to Jos.',
      play:'ldlc/' },
    { emoji:'🌳', when:'29 Oct', title:'SEASONALITY!',
      what:'Grow your forest with sun energy, and keep your plants alive.',
      more:'You start with 70 seeds and a tutorial that shows you everything. Plant a willow, then saplings ' +
           'beside it. Sun energy runs along the roots to your trees, and clicking a tree gives you more. ' +
           'Drag along the forest to find new places to plant. It saves itself when you pause.',
      play:'seasonality/preview-start.html' },
    { emoji:'🧱', when:'26 Oct', title:'Marble Run Builder',
      what:'Build your own marble track with springs, portals, one-ways and breakable bricks.',
      more:'12 bricks and real gravity. Portals come in numbered pairs, breakable bricks shatter into ' +
           'pieces, and the spring is Jos’s own design. Save your tracks and show them off in the gallery. ' +
           'The old Marble Run is now called Marble Races.',
      play:'marble-run-builder/' },
    { emoji:'⏰', when:'23 Oct', title:'The clock',
      what:'Click the clock in the top left: a lava lamp, typing, and a big rolling clock. It can be analog too.',
      more:'The screen turns into a lava lamp, the time types itself out, and the big clock rolls its numbers ' +
           'like a stopwatch. There is an analog clock too, and it remembers which one you like. Click again, ' +
           'or press Esc, to go back.',
      show:'clock' },
    { emoji:'♟️', when:'23 Oct', title:'Checkers jump rules',
      what:'Three ways to play: Regular, Competition and Competition Plus.',
      more:'Jos and Dad checked the real competition rules. Regular: jumping is your choice. Competition: ' +
           'if you can jump, you must. Competition Plus: you must take the biggest jump, like in ' +
           'international games.',
      play:'checkers/' },
    { emoji:'🚢', when:'22 Oct', title:'Battleships',
      what:'Hide your ships and sink the other side’s fleet.',
      more:'Place your own fleet by hand: click to put each ship down, 🔄 to turn it, or 🔀 to fill it ' +
           'randomly. Then take turns firing and find their ships before they find yours.',
      play:'battleships/' },
    { emoji:'🐛', when:'22 Oct', title:'Caterpillar',
      what:'Dots and Boxes, Jos-style. Finish a box to claim it, against a friend or the computer.',
      more:'5 by 5 boxes. Draw a line on your turn. Finish the fourth side of a box and it is yours, and ' +
           'you go again. Play a friend, or the computer on Easy or Hard.',
      play:'caterpillar/' },
    { emoji:'🛗', when:'9 Oct', title:'Space & Sea Elevator',
      what:'Ride a glass lift from the bottom of the Mariana Trench all the way up to the Moon.',
      more:'A stickman in a glass lift on two cables, from 10,935 metres down to the Moon, 384,400 km up. ' +
           '11 zones with real things in them: planes, Everest, the ISS, dolphins, giant squid and the ' +
           'Titanic. The 🔍 button zooms out so you can see the whole shaft.',
      look:'space-sea-elevator/' }
  ];

  var css = document.createElement('style');
  css.textContent = [
    /* the NEWS badge: the Möbius strip turning round, NEWS in big orange letters across it */
    '#newsBtn{position:fixed;left:16px;bottom:16px;z-index:480;width:150px;height:150px;padding:0;border:none;',
    '  background:none;cursor:pointer;transition:transform .15s}',
    '#newsBtn:hover{transform:scale(1.07)}',
    '#newsBtn .ring{position:absolute;inset:0;background:url(ldlc/ring-spin.webp) 0 0/7200px 150px no-repeat;',
    '  animation:newsSpin 4.32s steps(48) infinite;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))}',
    '@keyframes newsSpin{to{background-position:-7200px 0}}',
    '.newsWord{font-family:"Fredoka One",cursive;letter-spacing:.04em;color:#d9643a;line-height:1;',
    '  text-shadow:3px 0 #f2ede3,-3px 0 #f2ede3,0 3px #f2ede3,0 -3px #f2ede3,2px 2px #f2ede3,-2px 2px #f2ede3,',
    '  2px -2px #f2ede3,-2px -2px #f2ede3,0 6px 12px rgba(0,0,0,.3)}',
    '#newsBtn .newsWord{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:2.7rem}',
    '#newsBtn .dot{position:absolute;right:14px;top:16px;width:20px;height:20px;border-radius:50%;background:#e23b3b;',
    '  border:3px solid #f2ede3;display:none}',
    '#newsBtn.unseen .dot{display:block}',

    /* the news: the home page goes grey, and the news is one big speech bubble from the newsman */
    '#newsPage{position:fixed;inset:0;z-index:1000500;font-family:Nunito,sans-serif;background:rgba(35,50,50,.45);',
    '  -webkit-backdrop-filter:grayscale(1) brightness(.85);backdrop-filter:grayscale(1) brightness(.85)}',
    '#newsPage[hidden]{display:none}',
    /* the home page draws its own black cursor at layer 1000000 - lift it above the news */
    'html.newsOpen #cursorFire{z-index:2147483100!important}',
    '#newsPage .x{position:fixed;top:16px;right:18px;z-index:3;border:none;background:#3d9595;color:#fff;font-size:1.4rem;',
    '  width:48px;height:48px;border-radius:50%;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25)}',
    '#newsPage .x:hover{background:#2a7070}',
    '#newsPage .bubble{position:absolute;left:28px;top:28px;right:270px;bottom:28px;background:#f8f4ec;',
    '  border:4px solid #2a7070;border-radius:34px;box-shadow:0 14px 40px rgba(0,0,0,.35)}',
    '#newsPage .scroll{position:absolute;inset:0;overflow-y:auto;border-radius:30px;',
    '  background-image:radial-gradient(rgba(61,149,149,.12) 1.5px,transparent 1.5px);background-size:22px 22px}',
    '#newsPage .tail{position:absolute;overflow:visible}',
    '#newsPage .tail.side{right:-96px;bottom:170px;width:100px;height:70px}',
    '#newsPage .tail.down{display:none}',
    '#newsPage .wrap{max-width:1300px;margin:0 auto;padding:6px 26px 30px}',
    '#newsPage .head{position:relative;height:210px;display:flex;align-items:center;justify-content:center}',
    '#newsPage .head .ring{position:absolute;left:50%;top:50%;width:200px;height:200px;margin:-100px 0 0 -100px;',
    '  background:url(ldlc/ring-spin.webp) 0 0/9600px 200px no-repeat;animation:newsSpinBig 4.32s steps(48) infinite}',
    '@keyframes newsSpinBig{to{background-position:-9600px 0}}',
    '#newsPage .head .newsWord{position:relative;font-size:clamp(3.5rem,11vw,6rem)}',
    '#newsPage .sub{text-align:center;font-weight:800;color:#3d9595;font-size:1.05rem;margin:-6px 0 22px}',
    '#newsPage .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}',
    '#newsPage .card{background:#fbf8f1;border:3px solid #2a7070;border-radius:18px;padding:16px 18px 18px;',
    '  box-shadow:0 6px 0 rgba(42,112,112,.25);display:flex;flex-direction:column;transition:transform .15s}',
    '#newsPage .card:hover{transform:translateY(-3px)}',
    '#newsPage .card.first{border-color:#d9643a;box-shadow:0 6px 0 rgba(217,100,58,.35)}',
    '#newsPage .row{display:flex;align-items:center;gap:10px;margin-bottom:6px}',
    '#newsPage .emoji{font-size:2.4rem;line-height:1}',
    '#newsPage .when{font-weight:900;font-size:.8rem;color:#fff;background:#3d9595;border-radius:50px;padding:.15rem .6rem;',
    '  text-transform:uppercase;letter-spacing:.06em}',
    '#newsPage .card.first .when{background:#d9643a}',
    '#newsPage .title{font-family:"Fredoka One",cursive;font-size:1.4rem;color:#d9643a;line-height:1.2;margin:2px 0 6px}',
    '#newsPage .what{font-weight:800;font-size:1rem;color:#2a4545;line-height:1.45;margin:0 0 8px}',
    '#newsPage .more{font-weight:600;font-size:.95rem;color:#4b6464;line-height:1.5;margin:0 0 14px;flex:1}',
    '#newsPage .go{align-self:flex-start;border:none;cursor:pointer;text-decoration:none;font-family:"Fredoka One",cursive;',
    '  font-size:1.05rem;color:#fff;background:#3d9595;border-radius:50px;padding:.45rem 1.2rem}',
    '#newsPage .go:hover{background:#2a7070}',
    '#newsPage .go.play{background:#d9643a}',
    '#newsPage .go.play:hover{background:#b94f29}',
    '#newsPage .look{max-width:700px;margin:0 auto;text-align:center}',
    '#newsPage .look .pic{display:block;margin:10px auto 16px;max-width:100%;max-height:50vh}',
    '#newsPage .look .strip{width:280px;height:280px;margin:10px auto 16px;background-size:13440px 280px;',
    '  background-repeat:no-repeat;animation:newsSpinHuge 4.32s steps(48) infinite}',
    '@keyframes newsSpinHuge{to{background-position:-13440px 0}}',
    '#newsPage .back{margin-top:6px}',

    /* the newsman, bottom right, with his newspaper. The big bubble is what he is saying. */
    '#newsman{position:fixed;right:18px;bottom:0;z-index:2;width:230px;cursor:pointer}',
    '#newsman svg{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 14px rgba(0,0,0,.2))}',
    '#newsman .paper{transform-box:fill-box;transform-origin:50% 50%}',
    '#newsman .paper.flip{animation:newsFlip .6s ease-in-out}',
    '@keyframes newsFlip{50%{transform:scaleX(0)}}',
    '#newsman .m{display:none}#newsman .m.on{display:inline}',

    /* "Look at it" on the clock: it glows so you can find it */
    '@keyframes newsGlow{0%,100%{box-shadow:0 0 0 0 rgba(217,100,58,0)}50%{box-shadow:0 0 0 10px rgba(217,100,58,.55)}}',
    '.newsGlow{animation:newsGlow .7s ease-in-out 4}',

    '@media (max-width:700px){#newsBtn{width:100px;height:100px}',
    '  #newsBtn .ring{background-size:4800px 100px;animation-name:newsSpinSmall}',
    '  #newsBtn .newsWord{font-size:1.8rem}#newsBtn .dot{right:8px;top:8px;width:16px;height:16px}',
    '  #newsman{width:130px;right:6px}',
    /* on a phone the bubble sits above him and its tail points down to his mouth */
    '  #newsPage .bubble{left:10px;top:10px;right:10px;bottom:200px;border-radius:26px}#newsPage .scroll{border-radius:22px}',
    '  #newsPage .tail.side{display:none}#newsPage .tail.down{display:block;right:70px;bottom:-76px;width:70px;height:80px}',
    '  #newsPage .x{top:18px;right:18px;width:42px;height:42px;font-size:1.2rem}',
    '  #newsPage .wrap{padding:6px 14px 24px}#newsPage .head{height:150px}',
    '  #newsPage .head .ring{width:140px;height:140px;margin:-70px 0 0 -70px;background-size:6720px 140px;',
    '    animation-name:newsSpinMid}}',
    '@keyframes newsSpinSmall{to{background-position:-4800px 0}}',
    '@keyframes newsSpinMid{to{background-position:-6720px 0}}',
    '@media (prefers-reduced-motion:reduce){#newsBtn .ring,#newsPage .ring,#newsPage .strip{animation:none}',
    '  #newsman .paper.flip{animation:none}}'
  ].join('\n');
  document.head.appendChild(css);

  /* the newsman, drawn in the site's colours. The newspaper has NEWS on the front and NEWS on the
     back, and it flips over every time he tells you a new story. */
  var MAN =
    '<svg viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">' +
    // legs and shoes
    '<rect x="78" y="228" width="26" height="62" rx="8" fill="#2a4545"/><rect x="116" y="228" width="26" height="62" rx="8" fill="#2a4545"/>' +
    '<ellipse cx="88" cy="292" rx="22" ry="8" fill="#1d2f2f"/><ellipse cx="132" cy="292" rx="22" ry="8" fill="#1d2f2f"/>' +
    // body: a teal jacket with an orange tie
    '<path d="M58 150 Q60 118 110 116 Q160 118 162 150 L166 238 Q110 250 54 238 Z" fill="#3d9595"/>' +
    '<path d="M98 118 L110 136 L122 118 Z" fill="#fff"/><path d="M106 128 L114 128 L117 168 L110 176 L103 168 Z" fill="#d9643a"/>' +
    // head
    '<rect x="100" y="98" width="20" height="22" fill="#f1c27d"/>' +
    '<circle cx="110" cy="72" r="38" fill="#f1c27d"/>' +
    '<circle cx="72" cy="76" r="8" fill="#e8b06a"/><circle cx="148" cy="76" r="8" fill="#e8b06a"/>' +
    // the cap: a newsboy cap in orange
    '<path d="M70 62 Q72 26 110 24 Q150 26 152 60 Q110 50 70 62 Z" fill="#d9643a"/>' +
    '<path d="M66 62 Q110 46 160 58 Q166 66 150 68 Q110 58 70 70 Q60 68 66 62 Z" fill="#b94f29"/>' +
    '<circle cx="110" cy="26" r="5" fill="#b94f29"/>' +
    // face
    '<circle cx="96" cy="78" r="5" fill="#2a4545"/><circle cx="124" cy="78" r="5" fill="#2a4545"/>' +
    '<circle cx="97.5" cy="76.5" r="1.6" fill="#fff"/><circle cx="125.5" cy="76.5" r="1.6" fill="#fff"/>' +
    '<circle cx="88" cy="92" r="6" fill="#f2a07b" opacity=".6"/><circle cx="132" cy="92" r="6" fill="#f2a07b" opacity=".6"/>' +
    // his mouth: a resting smile (0) and 10 talking shapes, mixed up like real words
    '<g class="m on"><path d="M98 94 Q110 104 122 94" fill="none" stroke="#2a4545" stroke-width="4" stroke-linecap="round"/></g>' +
    // 1  m / b / p: lips pressed together
    '<g class="m"><path d="M100 97 Q110 99.5 120 97" fill="none" stroke="#2a4545" stroke-width="4.5" stroke-linecap="round"/></g>' +
    // 2  uh: a little bit open
    '<g class="m"><ellipse cx="110" cy="97" rx="7" ry="3.8" fill="#7a2a1a"/></g>' +
    // 3  AH: wide open, tongue showing
    '<g class="m"><path d="M99 93 Q110 91 121 93 Q121 108 110 108 Q99 108 99 93 Z" fill="#7a2a1a"/>' +
      '<ellipse cx="110" cy="104.5" rx="6" ry="3" fill="#e0675a"/></g>' +
    // 4  ee: wide and flat, top teeth
    '<g class="m"><path d="M97 94 Q110 92 123 94 Q122 101 110 102 Q98 101 97 94 Z" fill="#7a2a1a"/>' +
      '<path d="M99 94.3 Q110 92.6 121 94.3 L120.5 96.6 Q110 95.1 99.5 96.6 Z" fill="#fff"/></g>' +
    // 5  oo: small and round, lips pushed out
    '<g class="m"><circle cx="110" cy="98" r="4.5" fill="#7a2a1a" stroke="#c9735a" stroke-width="2.2"/></g>' +
    // 6  oh: tall and round
    '<g class="m"><ellipse cx="110" cy="98.5" rx="6.5" ry="7.5" fill="#7a2a1a"/>' +
      '<ellipse cx="110" cy="103.5" rx="4" ry="2" fill="#e0675a"/></g>' +
    // 7  f / v: top teeth on the bottom lip
    '<g class="m"><path d="M100 95 Q110 94 120 95 Q119 101 110 101 Q101 101 100 95 Z" fill="#7a2a1a"/>' +
      '<rect x="103" y="94.4" width="14" height="4" rx="1.2" fill="#fff"/></g>' +
    // 8  l / th: open, tongue up
    '<g class="m"><ellipse cx="110" cy="98" rx="9" ry="6.5" fill="#7a2a1a"/>' +
      '<path d="M104 103.5 Q110 93.5 116 103.5 Z" fill="#e0675a"/></g>' +
    // 9  eh: medium open, top teeth
    '<g class="m"><path d="M98 94 Q110 92 122 94 Q120 105 110 105 Q100 105 98 94 Z" fill="#7a2a1a"/>' +
      '<path d="M100 94.4 Q110 92.8 120 94.4 L119.4 97 Q110 95.6 100.6 97 Z" fill="#fff"/></g>' +
    // 10 ha: a big happy open smile
    '<g class="m"><path d="M97 93.5 Q110 96 123 93.5 Q120 107 110 107 Q100 107 97 93.5 Z" fill="#7a2a1a"/>' +
      '<ellipse cx="110" cy="103.5" rx="5.5" ry="2.6" fill="#e0675a"/></g>' +
    // arms up to the paper
    '<path d="M60 160 Q36 190 52 214" fill="none" stroke="#3d9595" stroke-width="20" stroke-linecap="round"/>' +
    '<path d="M160 160 Q184 190 168 214" fill="none" stroke="#3d9595" stroke-width="20" stroke-linecap="round"/>' +
    // the newspaper: front and back both say NEWS
    '<g class="paper">' +
      '<rect x="40" y="150" width="140" height="96" rx="4" fill="#fffdf7" stroke="#9aa9a9" stroke-width="2" transform="rotate(-4 110 198)"/>' +
      '<g class="front" transform="rotate(-4 110 198)">' +
        '<text x="110" y="180" text-anchor="middle" font-family="Fredoka One, cursive" font-size="27" fill="#d9643a">NEWS</text>' +
        '<rect x="52" y="188" width="116" height="3" fill="#2a4545"/>' +
        '<rect x="52" y="197" width="44" height="36" fill="#3d9595" opacity=".5"/>' +
        '<rect x="102" y="198" width="66" height="4" fill="#9aa9a9"/><rect x="102" y="207" width="60" height="4" fill="#9aa9a9"/>' +
        '<rect x="102" y="216" width="66" height="4" fill="#9aa9a9"/><rect x="102" y="225" width="50" height="4" fill="#9aa9a9"/>' +
      '</g>' +
      '<g class="backside" transform="rotate(-4 110 198)" style="display:none">' +
        '<text x="110" y="180" text-anchor="middle" font-family="Fredoka One, cursive" font-size="27" fill="#3d9595">NEWS</text>' +
        '<rect x="52" y="188" width="116" height="3" fill="#2a4545"/>' +
        '<rect x="52" y="198" width="66" height="4" fill="#9aa9a9"/><rect x="52" y="207" width="60" height="4" fill="#9aa9a9"/>' +
        '<rect x="52" y="216" width="66" height="4" fill="#9aa9a9"/><rect x="52" y="225" width="56" height="4" fill="#9aa9a9"/>' +
        '<rect x="124" y="197" width="44" height="36" fill="#d9643a" opacity=".45"/>' +
      '</g>' +
    '</g>' +
    // hands holding the paper
    '<circle cx="50" cy="214" r="11" fill="#f1c27d"/><circle cx="170" cy="210" r="11" fill="#f1c27d"/>' +
    '</svg>';

  var btn = document.createElement('button');
  btn.id = 'newsBtn';
  btn.title = 'News';
  btn.innerHTML = '<span class="ring"></span><span class="newsWord">NEWS</span><span class="dot"></span>';
  var page = document.createElement('div');
  page.id = 'newsPage';
  page.hidden = true;
  // the speech bubble's tail: one pointing sideways to his mouth, one pointing down (on a phone).
  // The little rectangle hides the bubble's edge where the tail joins on.
  var TAILS =
    '<svg class="tail side" viewBox="0 0 100 70"><rect x="-2" y="7" width="11" height="34" fill="#f8f4ec"/>' +
    '<path d="M6 4 L96 56 L6 44" fill="#f8f4ec" stroke="#2a7070" stroke-width="4" stroke-linejoin="round"/></svg>' +
    '<svg class="tail down" viewBox="0 0 70 80"><rect x="7" y="-2" width="34" height="11" fill="#f8f4ec"/>' +
    '<path d="M4 6 L56 76 L44 6" fill="#f8f4ec" stroke="#2a7070" stroke-width="4" stroke-linejoin="round"/></svg>';
  page.innerHTML = '<button class="x" title="Close">✕</button>' +
                   '<div class="bubble"><div class="scroll"><div class="wrap"></div></div>' + TAILS + '</div>' +
                   '<div id="newsman" title="Click me!">' + MAN + '</div>';
  document.body.appendChild(btn);
  document.body.appendChild(page);
  var wrap = page.querySelector('.wrap');
  var scroll = page.querySelector('.scroll');
  var man = page.querySelector('#newsman');
  var paper = man.querySelector('.paper');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function header() {
    var h = el('div', 'head');
    h.appendChild(el('span', 'ring'));
    h.appendChild(el('span', 'newsWord', 'NEWS'));
    wrap.appendChild(h);
  }

  function showList() {
    wrap.innerHTML = '';
    header();
    wrap.appendChild(el('div', 'sub', 'Everything new Jos made, newest first'));
    var grid = el('div', 'grid');
    NEWS.forEach(function (n, i) {
      var card = el('div', 'card' + (i === 0 ? ' first' : ''));
      var row = el('div', 'row');
      row.appendChild(el('span', 'emoji', n.emoji));
      row.appendChild(el('span', 'when', i === 0 ? 'Newest · ' + n.when : n.when));
      card.appendChild(row);
      card.appendChild(el('div', 'title', n.title));
      card.appendChild(el('p', 'what', n.what));
      if (n.more) card.appendChild(el('p', 'more', n.more));
      var go;
      if (n.play || n.look) {
        go = el('a', 'go' + (n.play ? ' play' : ''), n.play ? '▶ Play it' : '👀 Look at it');
        go.href = n.play || n.look;
      } else {
        go = el('button', 'go', '👀 Look at it');
        go.onclick = function () { lookAt(n); };
      }
      card.appendChild(go);
      // point at a story and the newsman flips his paper and talks
      card.addEventListener('mouseenter', function () { if (i !== story) { story = i; talk(1400); } });
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  // things that aren't a game: show them right here
  function lookAt(n) {
    if (n.show === 'clock') {
      close();
      var c = document.getElementById('josClock');
      if (c) { c.classList.remove('newsGlow'); void c.offsetWidth; c.classList.add('newsGlow'); }
      return;
    }
    wrap.innerHTML = '';
    header();
    var box = el('div', 'look');
    box.appendChild(el('div', 'title', n.emoji + ' ' + n.title));
    if (n.strip) {                // a picture that's lots of pictures in a row: play it
      var s = el('div', 'strip');
      s.style.backgroundImage = 'url(' + n.picture + ')';
      box.appendChild(s);
    } else {
      var img = el('img', 'pic');
      img.src = n.picture;
      img.alt = n.title;
      box.appendChild(img);
    }
    box.appendChild(el('p', 'what', n.what));
    if (n.more) box.appendChild(el('p', 'more', n.more));
    var back = el('button', 'go back', '← Back to the news');
    back.onclick = showList;
    box.appendChild(back);
    wrap.appendChild(box);
    scroll.scrollTop = 0;
  }

  /* ---------- the newsman: everything in the big bubble is him talking ---------- */
  var story = -1, mouth = 0, chatter = 0;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouths = [].slice.call(man.querySelectorAll('.m')), now = 0;
  function setMouth(k) {
    mouths[now].classList.remove('on');
    mouths[k].classList.add('on');
    now = k;
  }
  // talking: words of 1 to 4 sounds, each sound a different mouth shape, a tiny pause between
  // words (lips shut or a little smile), then the resting smile when he's finished
  function speak(ms) {
    clearTimeout(mouth);
    var end = Date.now() + ms, left = 0;
    (function step() {
      if (Date.now() >= end) { setMouth(0); return; }
      if (left <= 0) {
        left = 1 + Math.floor(Math.random() * 4);
        setMouth(Math.random() < 0.5 ? 1 : 0);
        mouth = setTimeout(step, 90 + Math.random() * 110);
        return;
      }
      left--;
      var k;
      do { k = 2 + Math.floor(Math.random() * 9); } while (k === now);
      setMouth(k);
      mouth = setTimeout(step, 70 + Math.random() * 90);
    })();
  }
  // flip the newspaper over (NEWS on the front, NEWS on the back) and talk for a bit
  function talk(ms) {
    paper.classList.remove('flip'); void paper.getBoundingClientRect(); paper.classList.add('flip');
    setTimeout(function () {
      var f = paper.querySelector('.front'), b = paper.querySelector('.backside');
      var frontShowing = f.style.display !== 'none';
      f.style.display = frontShowing ? 'none' : '';
      b.style.display = frontShowing ? '' : 'none';
    }, 300);
    if (!calm) speak(ms);
  }
  man.addEventListener('click', function () { talk(1800); });

  // a red dot until you've looked at the newest news
  var SEEN = 'jos-news-seen';
  function newest() { return NEWS[0].when + ' ' + NEWS[0].title; }
  function seen() { try { return localStorage.getItem(SEEN) === newest(); } catch (e) { return true; } }
  if (!seen()) btn.classList.add('unseen');

  function open() {
    showList();
    page.hidden = false;
    scroll.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.classList.add('newsOpen');
    btn.classList.remove('unseen');
    try { localStorage.setItem(SEEN, newest()); } catch (e) {}
    story = -1;
    talk(3000);
    // now and then he turns the page and keeps talking
    clearInterval(chatter);
    chatter = setInterval(function () { talk(1800); }, 8000);
  }
  function close() {
    page.hidden = true;
    document.documentElement.style.overflow = '';
    document.documentElement.classList.remove('newsOpen');
    clearInterval(chatter); clearTimeout(mouth);
    setMouth(0);
  }

  btn.addEventListener('click', open);
  page.querySelector('.x').addEventListener('click', close);
  // click the grey edges to go back to the home page
  page.addEventListener('click', function (e) { if (e.target === page) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !page.hidden) close(); });
})();
