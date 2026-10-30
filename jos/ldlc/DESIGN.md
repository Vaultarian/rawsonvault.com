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
| **Button** | a dome, **brown** (not green) | (connects to blocks, still to build) |

**Do action** (Jos): any block that does something, like a spring or a coin, has a **Do action**
switch in its properties. Turn it off and it doesn't do it: the spring won't boot you, the coin
won't collect.

**The trigger's properties** are only **Visibility** (off) and **Do action** (on).

⚠️ **For Dad, before publishing:** the coin sound is `sounds/coin.wav`, from Freesound
(*8bit Coin Collection 2* by Duskbreaker, sound 649726). Check its licence and add a credit
before LDLC goes on the website.

## The edit controls block

Jos: it "will say left equals left arrow, right equals right arrow, up equals space or up
arrow, and they can change that, and they don't all have to be different."

- The level maker picks which key does **left**, **right** and **up**.
- Keys don't have to be different. Two moves can share a key.
- It can also change what the character does: **always going left**, or **always going right**.

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

## Block properties

Click a block with the cursor and you see its properties, each with a little switch:

- **Deadly**
- **Collision**
- **Disguise as block**: when this is on, a box appears with the block's name and a little
  down arrow. Click the arrow and it lists all the blocks (Tile, Door, Hero…), and the block
  will **look like** the one you pick.

## Choices Carl made that Jos can change

- The portal "switches colours" by **swapping its black and white**.
- There is **one Hero and one Door** in a level. Putting down another one moves it.
- A brand-new level starts with a floor, the Hero and the Door, so TEST works straight away.
- Controls when you TEST: **← →** (or A D) to move, **↑ or Space** (or W) to jump. Let go of
  jump early for a smaller jump. These are what the Edit controls block will change.
- The hero has **tiny devil horns** and one eye, looking the way he runs.
- A **🪙 coin counter** sits next to the 💀 when you TEST. Coins come back when you die.

## Build log

- **30 Oct**: start screen built (`index.html`). Not in any menu. Not published.
- **30 Oct**: every block drawn from Jos's pictures. Working when you TEST: Spike, Small spike,
  Sawblade, Spring, Coin (with sound), One way, invisible Trigger. Button and Portal can be
  placed but don't do anything yet. Edit controls still needs its picture.
- **30 Oct**: the creator (`editor.html`, `editor.js`), reached from **CREATE A LEVEL**.
  Working: **Tile, Hero, Door, Spike**, the **Eraser**, **Clear**, and **▶ TEST** (play your
  level, 💀 death counter, LEVEL COMPLETE at the door). The level saves itself in the browser.
  The portal shows Jos's drawing, flashing, but doesn't work yet. Everything else says "soon".
