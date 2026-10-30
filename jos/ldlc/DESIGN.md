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
- Blocks Jos hasn't drawn yet show a **?** in the blocks bar, so Jos can design how they look.

## Build log

- **30 Oct**: start screen built (`index.html`). Not in any menu. Not published.
- **30 Oct**: the creator (`editor.html`, `editor.js`), reached from **CREATE A LEVEL**.
  Working: **Tile, Hero, Door, Spike**, the **Eraser**, **Clear**, and **▶ TEST** (play your
  level, 💀 death counter, LEVEL COMPLETE at the door). The level saves itself in the browser.
  The portal shows Jos's drawing, flashing, but doesn't work yet. Everything else says "soon".
