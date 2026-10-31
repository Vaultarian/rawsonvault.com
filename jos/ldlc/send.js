/* LDLC — Send to Jos (Dad's idea). It fills in Dad's Google Form behind the scenes, with the level
   hidden inside it. You only type who made it, what it's called, and how hard it is.
   Only a level you have beaten can go: beat it and it asks "Would you like to send it to Jos?".
   Needs levels.js. */
const LDLCSend = (() => {
  'use strict';

  const FORM = {
    url:'https://docs.google.com/forms/d/e/1FAIpQLSehB-eeqS18QGWSY6LSh-llh8GTh213JEg_Dx3XGbDY1qeAOQ/formResponse',
    by:'entry.1909688238', name:'entry.972832664', code:'entry.725860479',
    rate:{ Difficulty:'entry.1927971596', Length:'entry.1344573086', Tricks:'entry.503476207' }
  };

  document.head.append(Object.assign(document.createElement('style'), { textContent:`
#sendModal {
  position:fixed; inset:0; z-index:60; display:flex; align-items:center; justify-content:center;
  background:rgba(0, 0, 0, .7);
}
#sendModal[hidden] { display:none; }
#sendModal .box {
  width:min(440px, 92vw); padding:22px 24px; border-radius:16px; background:#1c0008; color:#fff;
  border:2px solid #ff2a3d; box-shadow:0 14px 40px rgba(0,0,0,.6); font-family:'Fredoka One', cursive;
}
#sendModal .sendBanner { display:block; width:calc(100% + 48px); margin:-22px -24px 16px; border-radius:14px 14px 0 0; }
#sendModal h2 { font-weight:400; font-size:1.5rem; margin:0 0 14px; }
#sendModal p { font-family:'Nunito', sans-serif; font-weight:700; margin:0 0 14px; line-height:1.4; }
#sendModal p.oops { color:#ffd23f; }
#sendModal label { display:block; margin-bottom:12px; }
#sendModal label small { display:block; font-family:'Nunito', sans-serif; font-size:.8rem; color:#ffffffaa; }
#sendModal input {
  width:100%; box-sizing:border-box; margin-top:4px; padding:.45rem .6rem; border-radius:8px;
  border:2px solid #ff2a3d77; background:#000; color:#fff;
  font-family:'Nunito', sans-serif; font-weight:700; font-size:1rem; user-select:text;
}
#sendModal input:focus { outline:none; border-color:#5dff8a; }
#sendModal .rate { display:flex; align-items:center; gap:6px; margin-bottom:8px; }
#sendModal .rate span { flex:1; }
#sendModal button {
  font-family:'Fredoka One', cursive; font-size:1rem; color:#fff; cursor:pointer; box-shadow:none;
  border:2px solid #ff2a3d77; background:#000; border-radius:8px; padding:.35rem .7rem;
}
#sendModal .rate button.on { background:#2e9e4f; border-color:#5dff8a; }
#sendModal .go { display:flex; gap:10px; margin-top:16px; }
#sendModal .go button { flex:1; padding:.55rem; }
#sendModal .go .main { background:#ff2a3d; border-color:#ff2a3d; }
#sendModal .go .main:disabled { opacity:.4; cursor:default; }
` }));

  const modal = Object.assign(document.createElement('div'), { id:'sendModal', hidden:true });
  const box = Object.assign(document.createElement('div'), { className:'box' });
  modal.append(box);
  document.body.append(modal);
  const make = (tag, props, kids) => { const e = Object.assign(document.createElement(tag), props || {}); (kids || []).forEach(k => e.append(k)); return e; };
  function show(...kids) { box.replaceChildren(...kids); modal.hidden = false; }
  function close() { modal.hidden = true; box.replaceChildren(); }
  // while the box is open, keys are for the box, not the creator behind it (R, Delete, the secret word…)
  addEventListener('keydown', e => {
    if (modal.hidden) return;
    e.stopPropagation();
    if (e.key === 'Escape') close();
  }, true);
  // the LDLC banner (the same picture as the top of Dad's Google Form)
  const banner = () => make('img', { className:'sendBanner', src:'banner.webp', alt:'LDLC: Level Devil Level Creator' });
  const okRow = after => make('div', { className:'go' }, [make('button', { type:'button', className:'main', textContent:'OK',
                                                                           onclick:() => { close(); after(); } })]);

  const NICK = 'jos-ldlc-nickname';    // your nickname, so you only type it once

  // send it to Dad's form. Throws if there is no internet.
  async function post(id, req) {
    const body = new URLSearchParams({ [FORM.by]:req.by, [FORM.name]:req.name,
                                       [FORM.code]:await LDLC.pack(id, req.name, req.by) });
    Object.entries(FORM.rate).forEach(([q, entry]) => body.append(entry, req.rates[q] || ''));
    await fetch(FORM.url, { method:'POST', mode:'no-cors', body });
  }

  /* the Send to Jos box */
  function open(id, name, after) {
    const by = make('input', { maxLength:40, placeholder:'e.g. SpikeMaster9', value:localStorage.getItem(NICK) || '' });
    const title = make('input', { maxLength:40, value:name });
    const rates = {};
    const rows = Object.keys(FORM.rate).map(q => {
      const btns = ['Easy', 'Medium', 'Hard'].map(v => make('button', { type:'button', textContent:v }));
      btns.forEach(b => b.addEventListener('click', () => {
        rates[q] = b.textContent; btns.forEach(x => x.classList.toggle('on', x === b)); ready();
      }));
      return make('div', { className:'rate' }, [make('span', { textContent:q === 'Tricks' ? 'Tricks (how hard)' : q }), ...btns]);
    });
    const send = make('button', { type:'button', className:'main', textContent:'📤 Send to Jos', disabled:true });
    const ready = () => { send.disabled = !(by.value.trim() && title.value.trim() && Object.keys(rates).length === 3); };
    by.addEventListener('input', ready); title.addEventListener('input', ready);
    send.addEventListener('click', async () => {
      const req = { by:by.value.trim(), name:title.value.trim(), rates };
      send.disabled = true; send.textContent = 'Sending…';
      try {
        await post(id, req);
        try { localStorage.setItem(NICK, req.by); } catch (e) {}
        show(banner(), make('h2', { textContent:'Sent! 🎉' }),
             make('p', { textContent:'Jos will see your level soon. If he likes it, it might go on his website.' }),
             okRow(after));
      } catch (e) {
        send.disabled = false; send.textContent = '📤 Send to Jos';
        send.parentNode.before(make('p', { className:'oops', textContent:"Couldn't send it. Check the internet and try again." }));
      }
    });
    show(banner(), make('h2', { textContent:'Thanks for making a level! 🎉' }),
      make('label', {}, [document.createTextNode('Who made it?'), make('small', { textContent:'A username or nickname, not your real name' }), by]),
      make('label', {}, [document.createTextNode('Level name'), title]),
      ...rows,
      make('div', { className:'go' }, [send, make('button', { type:'button', textContent:'Cancel', onclick:close })]));
    (by.value ? title : by).focus();
  }

  /* Dad: you just beat your level, so it asks */
  function wellDone(id, name, after) {
    show(banner(), make('h2', { textContent:"Well done, you've completed your level! 🎉" }),
      make('p', { textContent:'Would you like to send it to Jos?' }),
      make('div', { className:'go' }, [
        make('button', { type:'button', className:'main', textContent:'Yes', onclick:() => open(id, name, after) }),
        make('button', { type:'button', textContent:'Not now', onclick:close })]));
  }

  return { open, wellDone, post, close };
})();
