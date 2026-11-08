# LDLC — Level Devil Level Creator

Jos's game, designed by Jos on 30 Oct 2026. **The mechanics are his.** Read this before
building anything.

## The big idea, in Jos's words

> "The reason I'm making it a level devil creator is so you can make your own levels. I know
> you can just play them, but I would also like to make my own."

So **making levels is the main thing.** PLAY is for playing the levels people make.

## The blocks

Jos's full list:

| Block | What it is |
|---|---|
| **Tile** | a ground block |
| **Hero** | where the player starts |
| **Door** | where the player has to get to |
| **Spike** | a *triple* spike, but it only takes up one block |
| **Small spike** | a smaller spike |
| **Sawblade** | |
| **Spring** | |
| **Coin** | |
| **One way** | "you can jump and you go through it, but you don't go back down" |
| **Portal** | like Marble Run Builder: portals come in **pairs**. There is a switch, **show portal connections** |
| **Trigger** | |
| **Button** | |
| **Edit controls** | lets the level maker change the controls (see below) |

**The portal looks like this.** Jos drew it himself, "because Google images doesn't have
it": a black square ring, a white gap, a smaller black square ring, and a white middle.
**It switches colours every 0.30 seconds.**

## How each block looks and works (Jos's pictures, 30 Oct)

Jos sent a picture of each block. Carl drew them in LDLC's colours. The pictures are in
`~/jos/ldlc-refs/`.

| Block | Looks like | Does |
|---|---|---|
| **Tile** | a plain solid block | you stand on it |
| **Door** | a tall doorway with rounded top corners | finish (see The door) |
| **Hero** | a little blocky person: head, body, two legs (Carl added tiny devil horns) | runs with his **legs going wide apart, then together**, like Jos's video |
| **Spike** | three spikes, **short** | deadly on the pointy part |
| **Small spike** | one small spike | deadly |
| **Sawblade** | a big round blade with a square hole | **really spins**, deadly |
| **Spring** | a flat slab on a little bar | **"it just boots you up"**: the bar gets longer when you land on it and boots you up |
| **Coin** | a coin | you collect it, with **Jos's coin sound** |
| **One way** | three short dashes | jump up through it, you don't go back down |
| **Trigger** | a green square with a black **!** | **invisible when you play**, "like a trigger in G-dash" |
| **Button** | a dome, **brown** (not green) | **goes down when you stand on it**, and sets off whatever it's connected to |
| **Edit controls** | like the trigger, but with **← → ↑ ↓ arrows** instead of the **!** | touch it and the controls change to what it's set to |

**Do action** (Jos): any block that does something, like a spring or a coin, has a **Do action**
switch in its properties. Turn it off and it doesn't do it: the spring won't boot you, the coin
won't collect.

**The trigger's properties** are only **Visibility** (off) and **Do action** (on).

The coin sound is `sounds/coin.wav`, from Freesound: *8Bit Coin Collection #2* by Duskbreaker,
sound 649726. **Licence checked 31 Oct: Creative Commons 0**, free to use with no credit needed.

## The ball and the hill (Jos, 8 Nov)

Jos: **"Ball is not a thing in edit controls. It is an object."** It is a block of its own, and the
**Hill** comes straight after it.

**Ball.** It is **blue** (Jos: "the ball is not gray, how about it's just blue"). *"Basically like a sawblade, except it doesn't spin and it does not kill you unless you have
deadly turned on."* Its properties (switches): **Deadly** (off), **Gravity** (off), **Crush deadly** (off),
Visible, Disguise as block.

- **Gravity off:** it just sits there, like a sawblade. A trigger's **Movement** still carries it.
- **Gravity on:** it falls, bounces and rolls down hills. When a trigger's Movement is over, it falls too.
  **Carl's choice:** it falls the way the hero's gravity is pointing (so Set gravity turns the balls with him).
- A trigger can turn Gravity on and off with **Change properties**, like any other switch.
- **Crush deadly:** if it **falls on his head, he dies**. Touching the **side or top** of it does nothing.
  **Crush deadly turns Gravity on by itself** (and turning Gravity off turns Crush deadly off).
  Carl's choice: it only crushes when it is really falling (a ball that has just rolled up and rests on him won't).
- **Crush deadly off:** it just **bounces off him**. He is never stopped or pushed by it.

**Hill.** A slope, a block cut corner to corner. Turned 0 it rises to the right; **R** turns it. Properties:
Collision, Visible, Disguise.

- **The ball rolls down it**, any way it is turned.
- **The hero walks up and down it** (gravity pointing down). Its straight side is a wall. He keeps hold of it
  going downhill, and a jump leaves it. **Carl's choice:** with any other gravity, or a hill turned onto the
  ceiling, the hill is a plain solid block for the hero (the ball still rolls on its slope).
- Not built: balls pushing each other, balls pushing the hero, a hill that kills.

## Difficulties (Jos, 8 Nov)

When you press **Create** on My levels, it asks **What difficulty?** *before* it sends you into the creator
(Cancel makes nothing). Then the creator asks for the grid size. The difficulty is kept with the level, and it
travels with a shared level.

| | Beginner | Regular | Advanced |
|---|---|---|---|
| Beginner guide (the bubbles) | **on, locked** | on or off (type `beginner`) | off, locked |
| Advanced commands | **off, locked** | on or off (type `advanced`) | **on, locked** |
| Edit controls, Dash orb | **no** | yes | yes |
| Camera position, Hill, Ball | no | no | **yes** |
| More than one Hero or Door | no | no | **yes** |

- **Editor commands are now called Advanced commands.** The secret word is **advanced** (**editor** still works
  too). In a Beginner or Advanced level the word says why it won't toggle.
- Hidden blocks are only hidden from the palette (and from the Disguise list). Blocks already in a level stay.
- An older level with no difficulty is **Regular**, unless it already has a Ball, Hill, Camera position or more than
  one Hero or Door: then it is **Advanced**, so nothing in it goes missing.
- **Several Heroes and Doors (Advanced).** They all do the same thing: press left and every Hero goes left,
  press jump and they all jump. Each has his own Jump power, Speed and Set gravity. **Any Hero reaching any Door
  finishes the level** (Carl's choice: the doors "all do the same thing"). If any Hero dies, the whole level starts
  again. The camera follows the first Hero (the top-left one). With "If off screen, die" on, any Hero off the
  screen dies. A Ball can crush any of them.
- **The camera follows every Hero** (Jos, 8 Nov): with no Camera position touched, it follows the Hero, or all of them
  together: it points at the middle of them, and **zooms out** if they spread apart, so **they are all on the screen**
  (it zooms back in when they come together). Touching a Camera position block still takes over, as before.
- **Needed for finish** (Jos, 8 Nov): a new switch on the **Hero**, also when you select several Heroes with Select
  blocks. Once any Hero is marked, **only the marked Heroes count, and ALL of them must go into a Door** to finish.
  A Hero that is not marked ignores the Doors. With nobody marked it is the old rule (any Hero at any Door).
  A marked Hero who goes in while others are still out **waits inside the Door** (he is not drawn, and the camera
  forgets him). The Door then shows Jos's picture: the shutter **closes and opens again, but it is RED inside, not
  black**; a second later it **shakes and turns back to black**. When the last marked Hero goes in, the Door does the
  usual finish (shutter, then it sinks).
- Not done: separate keys for each Hero.

## Grid size, the camera and the Camera position block (Jos, 8 Nov)

Jos dropped "Game settings" (gravity and speed were already done) and kept one thing: **grid size**.

**Grid size.** *"You choose what you want your grid size to be when you first go into the level."* A **new level**
shows a **little red message**: *What do you want your grid size to be?* with **Wide** and **Tall** (in blocks) and a
**Continue** button. 32 by 18 is one screen (and what older levels always were). It can be 12 to 160 wide and 8 to
90 tall. Each level remembers its own size; sharing a level carries it; the My levels pictures shrink to fit.
A level that is closed before pressing Continue asks again next time.

**Rechoose size** (Jos, 8 Nov): a button next to *Show portal connections* and *Show trigger connections*. It shows the
same red message with the current size filled in, and a **Cancel** button. The blocks stay put on the floor: the
**bottom left corner stays where it is**, so a taller level gets room above and a wider one gets room on the right
(the floor does not stretch by itself). A smaller level loses any block that no longer fits, and says how many.
Camera position spots move with the floor. Because it changes the level, a beaten level has to be beaten again before
it can be sent.

**Moving around a big level.** A block is always the same size on the screen (the size that fits 32 by 18); a
level smaller than that is blown up to fit, and a bigger one scrolls.
- **Hold Space and drag** to move around, whatever block you are holding: *you don't put any blocks down.*
- With the **Cursor**, **dragging on empty space** moves around too. The **mouse wheel** does as well
  (hold Shift for sideways).
- **When you play, the camera follows the hero.** Jos: *"Jos does not want the grid bigger when testing, so the
  screen follows the hero."*

**Zoom** (Jos, 8 Nov): a **🔍 Zoom** button next to Rechoose size. It opens a little box with a slider from *out* to *in*
(the whole level at the far left, up to 200%), the percent, and two buttons: **Zoom to fit** (shows the whole board)
and **100%**. Zooming keeps the middle of the screen where it is. It only changes the creator: when you TEST or PLAY
the blocks are the normal size and the camera follows the hero.

**The Camera position block** (placed after Hill, Advanced only). Properties: the regular **Visible** and **Do action**
(invisible when you play, like a trigger), then:
- **Camera position:** a **Choose** button. It takes the panel away; as you move the mouse a **pulsing green circle**
  shows on each square; click one to choose it. (Esc or Cancel to give up.) Pan with Space + drag if the spot is far.
  A chosen spot shows as a green circle with a dashed line from its block.
- When the hero touches the block (once), **the camera glides to that position and stays there.**
- **Moving** (a switch): says **Camera moving**, with **Go** (up, left, down, right) and **Speed** (blocks a second).
  The camera slides that way until it reaches the edge of the level. It needs a level bigger than the screen that
  way. Under it, the switch **If off screen, die**: if the hero is off the screen he dies.
- A Camera position block with nothing chosen and Moving off puts the camera **back to following the hero.**
- Carl's choices: Moving does not also use the chosen position; "school screen" was taken to mean *one screen*,
  so in a level that already fits one screen the camera stays regular.

## The edit controls block

**Its properties** (Jos): the controls settings below, **plus Do action and Visible.**
(Carl's choice: it starts invisible, like the trigger.) It works when you touch it while playing.
Click it with the Cursor to change its settings.

Jos: it "will say left equals left arrow, right equals right arrow, up equals space or up
arrow, and they can change that, and they don't all have to be different."

- The level maker picks which key does **left**, **right** and **up**.
- Keys don't have to be different. Two moves can share a key.
- It can also change what the character does: **always going left**, or **always going right**.
- **A Do list, like a trigger** (Jos, 8 Nov): the block doesn't show all its settings at once. It
  says **When touched** and has **+ Add**. Each one is a **Do** you choose: **Change controls**
  (the keys, Always going, Jump power and Speed below) or **Set gravity**. The settings only show
  once you have chosen. It does its whole list **once, when the hero touches it**. (Jos did not
  want it called "switch gravity": it is an action.)
- **Set gravity** (Jos, 8 Nov): **Up, Down, Left or Right**, and the hero turns so his feet are on that
  side. He falls that way, **jumps straight away from it** (still exactly Jump power blocks), and
  runs along the surface. With gravity sideways, **← runs up and → runs down**, and Jump is still the
  Up key: that is what **Change controls** is for, to put them on whichever keys feel right.
  Hero and walls: the level's **solid edges** are floors too (the default top edge is solid, so
  gravity Up makes him stand on the ceiling). Gravity Up on a level whose top edge is set to
  deadly will not work. The door pulls him upright again.
  With sideways gravity a spring on a wall boots him and an up or down spring knocks him along.
- **The hero has Set gravity too**, so he starts with the gravity you choose.
- **Jump power** (Jos, 8 Nov): **how high he jumps, in blocks**, and **every jump goes exactly that high**.
  The normal jump is **2 blocks** (so a 1-block wall is a hop, and a 2-block wall can't be climbed).
  From 0.5 to 20 (the level is 18 blocks tall, so above about 17 he just bumps the top). Jos took out the old "let go early for a small hop": a tap and a hold are the same jump.
  The movement is worked out exactly, so it is 2 blocks at any frame rate.
- **Speed** (Jos, 8 Nov): how fast he runs, as a percent of normal. 100 is normal, 200 is twice as
  fast, 50 is half. From 10 to 300. It also changes his speed when **Always going** is on.
- **The hero has Jump power and Speed too**, so you can set them right from the start of the level.
  An Edit controls block then changes them when he touches it. A block that only changes the keys
  (it was never given a Jump power or Speed) leaves the hero's own settings alone.

## The door

Jos showed Carl a video of how the door works: when you reach it, **it pulls you into the
middle of the door**, **a shutter comes down over you**, and then **the whole door sinks into
the ground**. **No LEVEL COMPLETE message** (Jos said take it out); you go back to the creator.

## Pressing TEST

Jos showed Carl a video of how it should look. Built in LDLC's own style:

- Jos: **the devil closes his mouth, then reopens it.** His jaws close over the creator, his
  eyes blink, then the mouth opens and your level is inside.
- **The same when you finish** (or press ✏️): he closes over the level and opens onto the
  creator again. (Carl made ✏️ do it too.)
- The level **fills the whole screen**. Nothing moves until the mouth is open.
- Two buttons in the top corner: **✏️ back to the creator** and **🔄 start again** (Carl's
  choice for the second one), plus the 💀 death counter.
- The Mods and Language buttons hide while you play, so they can't cover the door.

## The tile

Jos: **"tile is a block, not a slab."** Tiles that touch join up into one solid block, with the
red edge only on the outside.

## The tools

- **Cursor**: click a block to see its **block properties**.
- **Select blocks**: so you can move them and delete them.
- **Trigger to block**: connect a trigger or a button to a block.
- **Eraser**.

## The three tools, as Jos explained them (30 Oct)

**Cursor**: "just click on a block and it shows its properties." Jos (31 Oct): **the cursor can move
one block** (drag it), and **Select blocks can move lots of blocks**.

**Select blocks**: "a box where you can just click and drag with your cursor and it shows a
dotted box and it selects objects in it." Then you can move them and delete them.

**Trigger to block**:

1. A little message pops up from the top: **choose a trigger**. You click one of your triggers.
2. It says **click on a block/blocks**. You click a block.
3. Once you've clicked a block it says **done**, but you can still click other blocks too.

When a trigger is connected to something, **that something** gets an **Add** button. Jos: "the
add is in the selected block, not in the connected trigger." So you click the connected block with
the Cursor, and under its properties there's the trigger with **+ Add**. Click it and it puts in
**Do [blank ▾]**, and you choose **Change size**, **Movement** or **Change properties**:

- **Change size**: it says **New size [blank]** and you choose a number.
- **Movement**: **Left, Right, Up or Down** on one line, and on another line **how many blocks**
  (it says 1, with up and down arrows to change it). It also says **Speed**, and you can change
  that too. It starts on **Up, 1 block, speed 1**, and it shows **a little green dot where it
  will go, with little yellow lines going to that green dot** at the speed it's going, "so you
  can see how fast it's going and where it's going."
- **Change properties**: it says **New properties** and gets the properties from that block.
  "It's not always the same properties, so make the machine look what properties it has."
  They come out with switches, and you turn them on and off.

## Spring strength (31 Oct)

Jos: a spring has **Strength** in its properties, which is **how strong it is**: strength 1 boots
you up 1 block, strength 30 boots you 30 blocks. It starts as the regular spring (Carl measured
that as **5**). On its side, strength is how far it knocks you back.

## The edges of the level (31 Oct)

Jos: the walls, ceiling and floor each have an **edit button** beside them (on top, below, or at
the side). Click it and a message pops up:

- **"Switched to floor"** (or wall, or roof): the hero stands on it, or bumps into it.
- Click again: **"Changed to edge of screen"**: if the hero goes onto it, **he dies**.

They start as LDLC was before: **walls and roof solid, the bottom is the edge of the screen**. In
the creator, a solid edge is a white line and an edge of screen is red dashes.

## A block inside another block (31 Oct)

Jos: "you can just place one block in another block." Say you want **a spring to come up out of
the floor**: put the spring in the floor block, connect a trigger to it, and make it pop up. The
hero and a trigger can go in the same square too.

- Pick a block and click on a block that's already there: **it goes inside it**. A square holds 2.
- Jos: **a block can go inside the same block**, like a tile inside a tile. (Clicking does that;
  dragging over the same block leaves it alone, like before.) The pill says **Tile (inside)**.
- In the creator, the block inside shows as **a small picture in the corner**.
- Jos: when you point at a square with two blocks, **it says which block** (like **Tile**), and **if
  you keep your cursor on it, it changes to the other one** (like **Spring**), and you can click on
  that. The same with every other block, for the Cursor and for Trigger to block.
- When you play, the block inside is **hidden behind** the other one until it moves out.

Carl's choices: the **Eraser clears the whole square**. To swap a block for a different one, erase
it first. Dragging the outside block out with the Cursor leaves the inside one behind.

## Changing lots of blocks at once (31 Oct)

Jos: in **Select blocks**, left-click one of the selected blocks to change **all their properties
at once**.

- It only works if they **have the same properties**. If they're different, you can't.
- A switch that's **on for some and off for others sits in the middle, one side green, one side
  black**. All on = green. All off = off.
- **Turn one on and all the selected blocks go on.** The same with off, and all the other
  properties.

Carl's choices: a click opens it, a drag still moves them. Different properties gives the message
"These blocks have different properties 😈". Turn and Output work on all of them too, and say
**Mixed** if they're different. Connections and Edit controls settings stay one block at a time.

## Delay on a trigger connection (31 Oct)

Jos: *"add delay when a trigger is connected to it… let's say they wanted a spike to appear
when they go across the trigger, but they want it to appear one second later… make a delay
going up to 30 seconds."*

- Every **← Trigger** card in a block's panel has **Delay … seconds**, from 0 to 30.
- 0 means straight away, the same as before. You cross the trigger, the clock starts, and
  when it runs out the actions happen (Change size, Movement, properties).
- Die and try again, and the clock starts fresh.
- The connection line shows a little **⏱ 1s** tag when it has a delay.

## Show trigger connections (31 Oct)

Jos: *"make a show trigger connections switch right below show portal connections… put it in
the top bar, just make show portal connections go up a bit."*

- Top bar, right under **Show portal connections**. Turned on, every trigger shows a dotted
  green line to each block it is connected to, with its ⏱ delay tag.
- Remembers whether it was on.

## Selecting blocks that have blocks inside them (31 Oct)

Jos: *"If they select blocks with blocks inside of it using select blocks, it will say select
inside blocks as a button, select all blocks as a button, or select outside blocks as a button,
and when they click that it will show the properties."*

- Box round some blocks with **Select blocks**. If any of them has a block inside, the bar
  shows **Select inside blocks**, **Select all blocks** and **Select outside blocks**.
- Click one and the properties open for just those blocks. Change a switch and only they change.
- Dragging still moves everything in the box.
- The properties for lots of blocks show their **Connected triggers** too. Jos: *"I have a trigger
  connected to lots of inside blocks… it didn't have any connected triggers. Make connected
  triggers be in there."* One card per trigger (**← Trigger · 25 blocks**). Delay, **+ Add** and
  every action change all of those blocks at once. ✕ disconnects the trigger from all of them.
- If the blocks already do different things, the card says *"These blocks do different things,
  so they can't be changed together 😈"*, and Delay shows Mixed.
- Select all blocks follows the old rule: if the blocks are different (a tile and a spring),
  it says *"These blocks have different properties 😈"*.

## Secret word: editor commands (31 Oct)

Jos: *"Can you make a secret word editor, and it will show up with editor commands… up one second
delay, that's an editor command… the first one I connected will start at zero, then the next one
I connected will start at one, then the next one… at two, and so on, but make that in editor
commands, not in the real game as the button."*

- Type **editor** on the keyboard (not in a box) and a purple **🛠 Editor commands** button appears
  bottom left. Click it to see the list. Type **editor** again to hide it all.
- **⏱ Up 1 second each**: in the Connected triggers card for lots of selected blocks. It sets the
  delays to 0, 1, 2, 3… seconds, in the order you connected the blocks to the trigger.
- Nobody sees these unless they know the word.
- **Up 1, starting later.** Jos: *"If they click, go up one second… If they click it again, it will
  say starting from one second. They click it again, it will say starting from two seconds, and so
  on. If they double click it in one second, then it will turn off going up one."*
  First click: 0, 1, 2, 3… Next click: 1, 2, 3, 4… The button says **starting from N seconds**.
  Two clicks inside one second turn it off, and every delay goes back to 0.
- **Up by any number.** Jos: *"if I do a decimal, let's say 0.1, it will change to going up 0.1 seconds
  every time, starting from 0 seconds… clicking it again, it will say starting from 0.1 seconds."*
  The **⏱ Up by** box sets the step (0.1 to 30). With 0.1: 0, 0.1, 0.2… then starting from 0.1, and so on.
- **🔗 Picks In / Out** (editor command). Jos: *"if you have editor commands on, you can put it in or
  out, and if you click on a block in trigger to block, then it will always select the inside ones,
  and if it's set to out, then it will always select the outside ones."* With editor commands on,
  Trigger to block never swaps when you hold still. It always picks the one you chose.
- **🚩 Start pos** (editor command). Jos: *"add a block start pos, and that start pos is where the hero
  starts. I know there's a hero block, but I don't wanna keep on changing it each time… there can only
  be one start pos… if you click on a different space, the first start pos will disappear… if you turn
  off editor commands or you erase the start pos, the hero will start where it usually starts."*
  A green flag at the bottom of BLOCKS, only with editor commands on. TEST starts the hero at the flag.
  The eraser takes the flag first, then the block under it on the next click.
- **🛠 Do same with other triggers** (editor command). Jos first asked for *"do same with all
  triggers"*, then changed it: *"Instead it says do same with other triggers, and if you click that a
  checkbox will appear on every button or trigger that is connected to it, and you can click on that,
  and once you click done, it will add that same thing to all the checkbox ones."*
  In a block's Connected triggers (two or more connected). Click it on the card you set up: that card
  goes purple and every other card gets a **Do the same** tick box. Tick the ones you want, click
  **Done**, and they copy the Do. **Cancel** changes nothing. Only this block's connections change.
  Jos: *"In select blocks… lots of small spikes, if I connect it to lots of triggers and it has a up by
  with delay, there isn't a Do same with other triggers."* Now it is in the lots-of-blocks panel too:
  the ticked triggers copy the Do for **those selected blocks** only, and keep their own delays.

## Adding to what's selected (31 Oct)

Jos: *"In select blocks, if you select blocks, you can click on another block to put that in the
selected area too, but only that block, so you can drag twice and not having to do it separately."*

- With **Select blocks**, a second box **adds** to what is already selected.
- A click on another block adds **only that block**. On a tile with a spring inside, it adds the
  one you are pointing at.
- A click on a selected block still opens the properties, and dragging still moves them all.
- To start again: click on an empty square, or press Esc.

## Coin: Needed for finish (31 Oct)

Jos: *"make a property inside of coin that says needed for finish with a switch. If it's off, then
they can just go into the door. If it's on, then at the start the door will go down automatically
and a green circle with spikes will circle around the coin, and when you collect the coin, the door
will come up again."*

- Coins have a **Needed for finish** switch, off to start.
- On: when you play, the door sinks into the ground at the start, and a green circle with spikes
  spins round the coin. Collect it and the door comes back up, so you can finish.
- The green circle shows in the creator too, so you can see which coins are needed.
- **The devil.** Jos: *"If the coin needed for finish is on the board, then the devil will pop up on
  your screen covering the whole board and words will fade onto the screen saying a coin is hidden
  and then it will disappear and then when you get the coin, the devil will come up again and words
  will fill your screen again. Noooooo"*
  When TEST starts, the devil pops up over the whole board (horns, angry eyes, a fang grin) and
  **A coin is hidden** fades in. When you get a Needed coin he pops up again: **Noooooo**.
  Everything waits while he is on the screen (about 2½ seconds).
- **Random words.** Jos: *"give the devil different words, random each time… one of them is no,
  another one is my door! or another one is the coin! (make about 10 random ones including mine)"*
  When you get a Needed coin he says one of: **Noooooo, My door!, The coin!** (Jos's), Give it back!,
  Not fair!, How did you find it?!, That was MY coin!, Grrrrr!, Impossible!, Next time…
  Never the same one twice in a row. *A coin is hidden* stays the same.
- **Disguise as Coin for finish.** Jos: *"In disguise as block, can you make coin for finish as a
  disguise option?"* Any block can now be disguised as a **Coin for finish**: a coin with the green
  spiky circle. It only looks like one. A spike in disguise still kills you, and the door doesn't
  wait for it.

## Trigger to block: lots of triggers and buttons at once (31 Oct)

Jos: *"make it so Trigger to block also works with buttons, and you can select multiple
triggers/buttons."*

- Buttons always worked in Trigger to block; the message now says **Choose a trigger or button**.
- Click as many triggers and buttons as you like (each one goes green). Click one again to drop it.
- Then click blocks: every chosen trigger/button connects to each block. Click a block again to undo it.

- **Typing editor again turns them off on the blocks too.** Jos: *"editor commands should be able to
  be turned off by typing editor again, but it doesn't turn off editor commands on the shapes. It
  just stops you from seeing it."* The 🛠 buttons on an open block's properties (Do same with other
  triggers, Up by) now go when you type editor again, and a half-done Do same is cancelled.

## My levels and the Create button (31 Oct)

Jos: *"when you click create a level, it will show a list of all the levels you created. If you
haven't created any, it will say create a level now and it will have an arrow pointing towards the
corner where a create button is."*

- **CREATE A LEVEL** now opens **MY LEVELS** (`levels.html`): a card for every level you made, with
  a little picture of it. Click a card to open that level in the creator.
- No levels yet: it says **Create a level now**, with an arrow to the Create button.
- Every level saves itself, on its own: its blocks, its edges and its Start pos.
- **The Create button**, from Jos's screen recording: *"change 'Wix studio' to create. and don't add
  that 'Go to link' button… The create button starts as just the black background and white
  circle… when you hover your cursor over it, it does the animation from the start. And once it
  gets back to the black background and white circle, the video restarts and plays again."*
  Carl drew the pictures to match the video: a colour wheel, a circle made of code, a shiny ball on
  a grid, indigo, a purple sunset (the word spreads out), gold, wavy ribbons, orange, an orbit, grey
  with guide lines, then back to black and white. 6 seconds, then again.
- **Jos changed his mind (after lunch):** *"how about you just get the video and just put it in
  there instead of making your own and just put create in front of Wix It'll look better"* and
  *"create is in the bottom left, not the top right"*. The button is now **his own screen
  recording** (`create.mp4`) with **Create** drawn over WIX STUDIO in every frame, and the go-to-link
  icon cut off. It sits in the **bottom left**.
- **Dad (31 Oct): our own Create button, not Wix's video.** It is the family's **Möbius strip** as a
  real 3D shape, made from the maths, turning round when you point at it, with the word Create.
  Dad picked it from three tries (a coin flip, a top-over-bottom tumble, and this side-to-side turn)
  because it *"most clearly shows the Möbius strip as precessing"*, then asked for a bigger hole and
  10% faster. It is 48 pictures in one strip (`ring-spin.webp`), played with CSS, so it starts from
  the first picture every time. The official copy is in `images/brand/` with Dad's other logos.
  Jos's Wix recording is kept in `~/jos/ldlc-refs/`, off the website.
- **Right-click a level** (Jos: *"you can rename it, delete it, or play it"*): **▶ Play** plays just
  that level, **✏️ Rename** (Enter keeps it, Escape doesn't), **🗑 Delete** (it asks first).
- Click **Create**: a new level (Level 1, Level 2…) opens in the creator.
- The level you had before today became **Level 1**, so nothing was lost.

## PLAY, pause and exit (31 Oct)

Jos: *"when you press play, it will get all of the levels you created (They auto save) and place
them in a random order until you get to the end, and then it restarts the list, and randomizes it
again. Just press pause in the top left corner, and it will pause your game, all of the triggers,
all of the movements, everything, and in the middle it will have two things, a play button and
this (The exit button)"* — a door with an arrow going into it. *"make it any color you like, that
feels right."*

- **PLAY** on the front page plays every level you made, mixed up. Get to the door and the devil's
  mouth closes and opens onto the next one. At the end of the list it mixes them up again.
- **⏸ Pause**, top left, stops everything: the hero, triggers, delays, things moving, the devil,
  the spinning saws.
- In the middle: a green **▶** to carry on, and the red **exit door** to go back to the front page.
- PLAY never changes your levels.

## The Dash orb (31 Oct)

Jos sent a picture (a green circle with a white arrow): *"please can you make a block like this? If
you look into that block on the Internet, you can see what it does. Now please can you add that into
level devil."* It is the **green dash orb** from Geometry Dash.

- Touch it and **press jump**: you shoot the way the **arrow** points, in a straight line, with no
  falling, for as long as you **hold jump**. A green trail follows you.
- Let go and you fall again, still flying a little.
- Run into something and the dash stops there. Spikes and saws still get you.
- **Turn it** (R, or Turn in its properties) to point the arrow right, down, left or up. It starts
  pointing right, like Jos's picture.
- It has Deadly, Collision, Visible, Disguise and Do action. Do action off: it does nothing.

## Send to Jos and level links (31 Oct)

Dad's idea: friends make levels and send them to Jos, through a **Google Form**, so nothing on the
website can be used to change it. Jos: *"Doesn't that include a back door, I think? That's a safety
problem, Dad told me."* So there is no password and no key in the page, and nobody can write to
the website. Jos's fail-safe: *"copy this LDLC link, put it in a slide or document, send it to your
teacher."*

- **📤 Send to Jos** (in the creator, next to TEST: see below). A box asks for your **nickname**, the
  **level name**, and Easy / Medium / Hard for **Difficulty**, **Length** and **Tricks**. Press Send:
  it goes into Dad's Google Form, and it says **Sent! 🎉**. No new tab, no Google sign-in.
- The level travels as a **level code** (`LDLC1.…`). The friend never sees it. Jos and Dad see it
  in the form's answers.
- **The banner**: Dad asked for the Google Form to look like LDLC, with the Möbius logo, *"bit more
  josish"*. Carl drew it with the game's own blocks: the hero shoots out of a **dash orb**
  straight through the **Möbius ring**, **LDLC** in the middle, spikes, coins, a saw, a spring and
  the door along the ground, and the **devil** peeking in on the right. The same picture sits at the
  top of the Send to Jos box (`banner.webp`).
- **Right-click → 🔗 Copy level link** is Jos's fail-safe. It copies a link with the level inside it.
  Open the link and LDLC asks **"Add this level to My levels?"**. A level that came from someone
  else says **by** their nickname on its card.
- A level code is **checked** before it goes in: unknown blocks are dropped, numbers are kept in
  range, and anything strange is thrown away. So a made-up code can't break the game.

## Send to Jos next to TEST, and Well done (31 Oct)

Jos: *"Can we put the "Send to Jos" on the original set of the level? I don't want to have the user go
back out to My Levels, right-click a level, and then click "Send to Jos." … make it next to "Test."
If they haven't tested it and they haven't gotten to the door themselves, then it will be grayed
out."*

Dad asked if that is easy to check. It is, with one catch: "has it ever been beaten?" has a
loophole (beat it, then add a wall of spikes, then send). So it checks **"beaten since the last
change"**.

Jos's first idea was a **⏳ Pending** request that sent itself when you beat the level. Carl built it,
then Dad suggested something simpler, and Dad and Jos picked his: *"if they haven't beaten it yet,
they click "Send to Jos." It says, "You have to beat it in order to send it." Once they do actually
reach the door and they beat the level, a pop-up says, "Well done, you've completed your level.
Would you like to send it to Jos?" Then you just click "Yes.""*

- **📤 Send to Jos** is a gold button **next to TEST**. It is not in My levels any more.
- **Grey** until you beat the level: press TEST and get to the door. Hover over it and it says
  **Beat the level to send it to Jos**. Click it and it says **You have to beat it in order to send it**.
- Beating it saves a **fingerprint** of the level. Change anything and it goes grey again. Change it
  back and it lights up again.
- It only counts if you start at the **Hero**. Getting to the door from a **Start pos** doesn't count.
- **Beat it** and, back in the creator, it asks **"Well done, you've completed your level! Would you
  like to send it to Jos?"** **Yes** opens the Send to Jos box. **Not now** closes it.

## Secret word: beginner (1 Nov)

Jos, with a friend: *"make a little word command that is beginner, and if you type it
in it shows you everything you can do, how to do cursor, how to do select box, how to do trigger
to block, how to do eraser, how to do all the blocks, how to connect triggers, how to get into
the properties, how to do everything."*

Carl first made it a guide box with topics. Jos changed it: *"Can you not make it a separate tab?
How about just make it so it has arrows and little message blocks showing you how to do stuff, so
you can look at the guide while building."*

- Type **beginner** on the keyboard (not in a box): **gold message bubbles with arrows** point at
  the real things. Type it again to hide them. It remembers, like the editor commands.
- Clicks go **straight through** the bubbles, so you keep building with them on.
- They change with what you're doing:
  - Nothing picked: a short tip under each tool (Cursor, Select blocks, Trigger to block, Eraser).
  - A block picked: a bubble by it says how to put it down (and **R** to turn it, if it turns).
  - A tool picked: just that tool's bubble, with the steps. **Trigger to block** shows steps 1, 2, 3
    and the step you're on goes dark. **Select blocks** says how many are selected.
  - Properties open: a bubble says green = on, and how to get **+ Add**.
  - Always: **▶ TEST**, the **✏️ edge** button, **You start here** over the Hero, **Get here to win!**
    over the Door.
- They hide when you TEST, and never cover the creator's own messages at the top.
- Code: `beginner.js`, loaded after `editor.js`.

Carl's choices Jos can change: gold, like the door; bubbles move down out of each other's way; on a
small screen only the bubble for what you're doing shows; it never mentions the **editor** secret
word, so the editor commands stay secret.

## Block properties

Click a block with the cursor and you see its properties, each with a little switch:

- **Deadly**
- **Collision**
- **Disguise as block**: when this is on, a box appears with the block's name and a little
  down arrow. Click the arrow and it lists all the blocks (Tile, Door, Hero…), and the block
  will **look like** the one you pick.

## Turning blocks (31 Oct)

Jos: make a rotation "for every block that can actually be rotated". **Sawblade, coin, portal and
tile don't turn**, "because they'll just be the same". Turning a block **changes its hitbox and
which way it's going**:

- A **spring** boots you the way it's facing. Jos: if it's on its side and the hero walks into it,
  **it bounces him back**, and the same with every other direction, **including down**.
- A **spike** gets you on its new pointy side.
- A **one way** on its side lets you through one way and stops you coming back.
- A **button** on its side still presses.

**How to turn** (Carl's choice): press **R** before you put a block down, or click it with the Cursor
and use **↺ ↻** next to **Turn** (or press R).

## Portal Output (31 Oct)

Jos: each portal has **Output = [blank]**.

- **Blank**: you're spat out **of the bottom** if there's no block under it, or **left or right**
  if there is a block under it.
- **Up, Down, Left or Right**: when you go through the other portal, you come out of this one
  **whichever way Output says**.

## Visible (31 Oct)

Jos: **every single block has Visible** in its properties, the portal and the hero too.

## Choices Carl made that Jos can change

- Dash orb: it needs a **new** press of jump while you touch it (holding jump as you arrive
  doesn't count, like Geometry Dash). Dash speed is 14 blocks a second (twice running). Letting go
  keeps half the speed going up or down, and a little sideways. It only turns in quarter turns.

- PLAY only uses levels with a **Hero and a Door** (you can't finish a level without a door).
- A new shuffle never starts with the level you just finished, so you never get the same one twice
  in a row.
- **Escape** pauses too. 💀 deaths start at 0 on each new level. The 🔄 start-again button stays.
- PLAY starts the hero at the Hero block, never at the Start pos (that's for TEST).
- ▶ is green and the exit door is red. No levels yet: PLAY says *Make a level first 😈*.

- Right-click **Play** on one level: when you reach the door (or press the exit door) you go back to
  My levels. It's greyed out until the level has a Hero and a Door.
- Delete asks *Delete Level 2?* with **Delete** and **Keep it**, because it can't be undone.
- An empty name when renaming keeps the old name.
- Levels are called Level 1, Level 2… There is no way to rename or delete a level yet.
- The creator's **← Back** now goes to My levels, not the front page.

- Start pos is not in the disguise list (it is an editor block, not a real one).

- Do same with other triggers copies the Do (the actions), not the Delay, so Up 1 delays stay.
- Done and Cancel sit under the last card, after the tick boxes.

- Once you have clicked a block, a click on another trigger connects it as a block (so a trigger can
  still turn another trigger on or off). Before that, a click on a trigger chooses it.

- Start pos is not part of the level: it sits on top of any square without taking it up, and Clear
  takes it away too. It stays put after a refresh.

- The devil says *A coin is hidden* when TEST starts, not every time you die.
- *Noooooo* comes for every Needed coin you get, not just the last one.
- Nothing moves while the devil is on the screen, so he can't make you die.

- With more than one Needed coin, the door comes up when **all** of them are collected.
- A Needed coin that is disguised as a block has no green circle (it is in disguise).
- If you die, the coins come back and the door goes down again.

- Changing **Up by** while Up is on starts it again from 0 seconds with the new number.
- The editor remembers the last Up by number you typed.

- Turning Up 1 off puts every delay back to 0.

- Picks starts on **Out**, because that is what a quick click picked before. It remembers your choice.
- On a square with only one block, In and Out both pick that block.

- A click on an empty square clears the selection, so there is still a way to start again.

- Editor commands stay on after a refresh, until **editor** is typed again.
- Up 1 stops at 30 seconds, because that is as long as a delay goes.

- **Outside blocks** means the block in the square, so a block with nothing inside it counts as
  an outside block too.
- The three Select buttons sit on a second line of the bar, and the bar sits over the level, so
  it doesn't cover the properties.

- The portal "switches colours" by **swapping its black and white**.
- There is **one Hero and one Door** in a level. Putting down another one moves it.
- A brand-new level starts with a floor, the Hero and the Door, so TEST works straight away.
- Controls when you TEST: **← →** (or A D) to move, **↑ or Space** (or W) to jump. (Jos took out the smaller jump for letting go early on 8 Nov: every jump is the full height.)
  These are what the Edit controls block will change.
- The hero has **tiny devil horns** and one eye, looking the way he runs.
- Jos: **no coin counter.** Coins come back when you die.
- A trigger or a button goes off **once per try**. The button **stays down** after you've stood on it.
- A **button can be connected to blocks too**, the same way as a trigger.
- In Trigger to block, **click a connected block again to disconnect it.**
- Pressing **Done** opens the **last block you connected**, ready for + Add.
- The trigger's own properties list the blocks it's connected to. Click one to go to it.
- Jos (31 Oct): hover over a connected block in the properties and **it flashes red and green**
  on the level, so you know which one it is. (Carl made it work both ways: trigger → block too.)
- With the Cursor, the properties open **when you let go of the mouse**, so a drag doesn't jump.
- Dragging a block onto another block replaces it, the same as Select blocks.
- **Speed 1 = about 0.22 blocks a second.** Jos sent a recording of how fast speed 1 is; Carl
  measured the yellow lines in it (6.5 pixels a second, with 30 pixels between grid lines).
  Speed goes up to **50** (about 11 blocks a second), so traps can still be fast.
- A block that changes size **grows from its bottom middle**, so it stays on the floor.
- Portals pair up **in the order you put them down**: the 1st and 2nd are a pair, then the 3rd and
  4th. **Show portal connections** gives each pair a number and a dotted line. A portal with no
  partner shows **?**.
- A block in disguise shows a little **🎭** in the creator, so you know. You can't see it when you play.
- In Select blocks, the **Delete** key deletes too.
- **Hero, Door, Trigger and Edit controls don't turn** either. Turning them wouldn't change what they do.
- With a blank Output and a block under the portal, you come out **the way you were running**, or
  the other side if that way is blocked.
- A portal with an Output shows a little **blue arrow** on that side, in the creator only.
- A block with **Visible off** looks **see-through in the creator**, so you can still find it.
  (Triggers and Edit controls look normal, because they start invisible.)
- Changing properties with a trigger can now switch **Visible**, so blocks can appear and vanish.
- Send to Jos: the box asks for a **nickname**, not a real name. It lands in Dad's Google Form,
  never on the website.
- A level code is squashed small (compressed) so a big level still fits in one form answer. Codes
  longer than 100,000 letters are refused.
- Opening a level link **asks first** before adding the level. It never replaces one of your levels.
- Send to Jos is **gold, like the door**, and gives a little bounce when it lights up.
- **Well done** only pops up the **first** time you beat it since a change, so testing it again
  doesn't keep asking. It waits until the devil's mouth has opened onto the creator, so there is
  still no LEVEL COMPLETE message while you play (Jos, 30 Oct).
- The box **remembers your nickname** from the last time you sent a level, so you only type it once.
- TEST and Send to Jos always **stay together**. On a narrow screen they move down a line, side by side.
  On screens under 1520 pixels wide the button just says **📤 Send**.
- What gets sent is **exactly the level you beat**.

## Build log

- **30 Oct**: start screen built (`index.html`). Not in any menu. Not published.
- **30 Oct**: every block drawn from Jos's pictures. Working when you TEST: Spike, Small spike,
  Sawblade, Spring, Coin (with sound), One way, invisible Trigger. Button and Portal can be
  placed but don't do anything yet. Edit controls still needs its picture.
- **30 Oct**: the creator (`editor.html`, `editor.js`), reached from **CREATE A LEVEL**.
  Working: **Tile, Hero, Door, Spike**, the **Eraser**, **Clear**, and **▶ TEST** (play your
  level, 💀 death counter, LEVEL COMPLETE at the door). The level saves itself in the browser.
  The portal shows Jos's drawing, flashing, but doesn't work yet. Everything else says "soon".
- **30 Oct**: **Cursor, Select blocks and Trigger to block** built, with Block properties (switches,
  Disguise as block), the Edit controls settings, and **+ Add** (Change size, Movement with the green
  dot and yellow lines, Change properties). Jos's three fixes: **the button goes down**, **portals
  connect in pairs and teleport you** (with the Show portal connections switch), and **the coin
  counter is gone** (coins already had Do action). Not published.
- **31 Oct**: **turning blocks** (spike, small spike, spring, one way, button; R key or ↺ ↻ in
  Block properties), **portal Output**, and **Visible on every block**. Not published.
- **31 Oct**: hover a connected block or trigger in the properties and it **flashes red and green**;
  the **Cursor drags one block**. Not published.
- **31 Oct**: **Select blocks → click a selected block** changes all their properties at once, with
  the half-green half-black switch for mixed. Not published.
- **31 Oct**: spring **Strength**, the **✏️ edge buttons** (floor/wall/roof or edge of screen), and
  **a block inside another block**. Not published.
- **1 Nov**: secret word **beginner**: message bubbles with arrows show how to use everything (`beginner.js`). Not published.

## Menu music

Jos, 8 Nov: scary music on the LDLC **home screen** and the **levels page**, and **not** in the editor, TEST or PLAY.
It is `sounds/menu-music.mp3`, started by `music.js`, which only `index.html` and `levels.html` load. It starts on the first
click or key (browsers need that), carries on between the two pages, and loops. A speaker button in the top right turns it
off and remembers. **Licence not checked yet** (the file came from Jos's Downloads: `vibehorn-scary-horror-music-horror-495564.mp3`).
Check it before this is published.
