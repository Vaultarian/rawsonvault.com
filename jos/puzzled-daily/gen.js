// The level-making bot. Same day = same puzzles for everyone.
(function (root) {
  function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function nb(i,N){const x=i%N,y=(i/N)|0,o=[];if(x>0)o.push(i-1);if(x<N-1)o.push(i+1);if(y>0)o.push(i-N);if(y<N-1)o.push(i+N);return o;}
  function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  // NEON: odd-shaped boards, portals, and lines that must cover every square.
  function nb2(i,w,h){const x=i%w,y=(i/w)|0,o=[];if(x>0)o.push(i-1);if(x<w-1)o.push(i+1);if(y>0)o.push(i-w);if(y<h-1)o.push(i+w);return o;}
  function genMask(r){
    const w=5+Math.floor(r()*3),h=5+Math.floor(r()*3),T=w*h,act=new Array(T).fill(true);
    const cut=(x0,y0,cw,ch)=>{for(let y=y0;y<y0+ch;y++)for(let x=x0;x<x0+cw;x++)if(x>=0&&y>=0&&x<w&&y<h)act[y*w+x]=false;};
    switch(Math.floor(r()*7)){
      case 0:break;
      case 1:cut(0,0,2,2);cut(w-2,0,2,2);cut(0,h-2,2,2);cut(w-2,h-2,2,2);break;
      case 2:cut(w-3,0,3,Math.floor(h/2));break;
      case 3:{const cx=(w-1)/2,cy=(h-1)/2,lim=Math.max(w,h)/2+.5;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(Math.abs(x-cx)+Math.abs(y-cy)>lim)act[y*w+x]=false;break;}
      case 4:cut(Math.floor((w-2)/2),Math.floor((h-2)/2),2,2);break;
      case 5:for(let k=0;k<3;k++)act[Math.floor(r()*T)]=false;break;
      case 6:cut(0,0,3,1);cut(0,0,1,3);cut(w-3,h-1,3,1);cut(w-1,h-3,1,3);break;
    }
    const cells=[];act.forEach((a,i)=>a&&cells.push(i));
    if(cells.length<16||cells.length>40)return null;
    const seen=new Set([cells[0]]),q=[cells[0]];
    while(q.length){const c=q.pop();for(const j of nb2(c,w,h))if(act[j]&&!seen.has(j)){seen.add(j);q.push(j);}}
    if(seen.size!==cells.length)return null;
    if(cells.some(c=>nb2(c,w,h).filter(j=>act[j]).length<1))return null;
    return{w,h,act};
  }
  // A solver for Neon boards: counts solutions (stops at `limit`). Returns null if it gives up.
  function neonSolve(p,limit,r,cap){
    const T=p.w*p.h,adj=[];for(let i=0;i<T;i++)adj.push([]);
    for(const e of p.edges){adj[e[0]].push(e[1]);adj[e[1]].push(e[0]);}
    const por={};p.portals.forEach(q=>{por[q.a]={to:q.b,col:q.col};por[q.b]={to:q.a,col:q.col};});
    const K=p.pairs.length,occ=new Array(T).fill(-1),tail=p.pairs.map(x=>x[0]),goal=p.pairs.map(x=>x[1]),done=new Array(K).fill(false);
    const path=p.pairs.map(x=>[x[0]]);
    let free=T-2*K;p.pairs.forEach((x,k)=>{occ[x[0]]=k;occ[x[1]]=k;});
    const sols=[];let steps=0;
    const moves=k=>{
      const out=[];
      for(const n of adj[tail[k]]){
        if(n===goal[k]){out.push([n,-1]);continue;}
        if(occ[n]!==-1)continue;
        const q=por[n];
        if(q){if(q.col!==-1&&q.col!==k)continue;if(occ[q.to]!==-1)continue;out.push([n,q.to]);}
        else out.push([n,-1]);
      }
      return out;
    };
    const alive=()=>{
      for(let v=0;v<T;v++){
        if(occ[v]!==-1||por[v])continue;
        let c=0;
        for(const n of adj[v]){if(occ[n]===-1)c++;else{const k=occ[n];if(!done[k]&&(tail[k]===n||goal[k]===n))c++;}}
        if(c<2)return false;
      }
      return true;
    };
    const dfs=()=>{
      if(++steps>cap)throw'cap';
      if(done.every(Boolean)){if(free===0)sols.push(path.map(a=>a.slice()));return sols.length>=limit;}
      if(!alive())return false;
      let bk=-1,bm=null;
      for(let k=0;k<K;k++){if(done[k])continue;const m=moves(k);if(!m.length)return false;if(!bm||m.length<bm.length){bk=k;bm=m;}}
      shuffle(bm,r);
      const k=bk;
      for(const[n,q]of bm){
        if(n===goal[k]){done[k]=true;path[k].push(n);const stop=dfs();path[k].pop();done[k]=false;if(stop)return true;continue;}
        const t0=tail[k];
        occ[n]=k;path[k].push(n);free--;
        if(q!==-1){occ[q]=k;path[k].push(q);free--;tail[k]=q;}else tail[k]=n;
        const stop=dfs();
        tail[k]=t0;
        if(q!==-1){occ[q]=-1;path[k].pop();free++;}
        occ[n]=-1;path[k].pop();free++;
        if(stop)return true;
      }
      return false;
    };
    try{dfs();}catch(e){if(e==='cap')return null;throw e;}
    return sols;
  }
  const ekey=(a,b)=>a<b?a+','+b:b+','+a;
  function gridEdges(sol,w,h){const s=new Set();for(const path of sol)for(let i=1;i<path.length;i++)if(nb2(path[i],w,h).includes(path[i-1]))s.add(ekey(path[i],path[i-1]));return s;}

  // NEON: a network of dots joined by track lines, some lines missing. The bot makes a board with exactly ONE answer.
  function genNeon(r){
    for(let attempt=0;attempt<400;attempt++){
      const w=5+Math.floor(r()*3),h=5+Math.floor(r()*2),T=w*h,cells=[];for(let i=0;i<T;i++)cells.push(i);
      const gn=i=>nb2(i,w,h);
      // 1) the answer: cut the board into paths that cover every dot (with 0-2 portal pairs)
      const np=r()<.3?0:r()<.6?1:2,portal={},plist=[];
      for(let t=0;t<np;t++)for(let q=0;q<30;q++){
        const a=cells[Math.floor(r()*T)],b=cells[Math.floor(r()*T)];
        if(a===b||portal[a]!==undefined||portal[b]!==undefined)continue;
        if(Math.abs(a%w-b%w)+Math.abs(((a/w)|0)-((b/w)|0))<3)continue;
        if(gn(a).length<3||gn(b).length<3)continue;
        portal[a]=b;portal[b]=a;plist.push([a,b]);break;
      }
      const owner=new Array(T).fill(-1),paths=[];let ok=true;
      while(ok){
        const fr=cells.filter(c=>owner[c]===-1);if(!fr.length)break;
        let start=-1,bd=9;
        for(const c of fr){if(portal[c]!==undefined)continue;const d=gn(c).filter(j=>owner[j]===-1).length;if(d<bd||(d===bd&&r()<.5)){bd=d;start=c;}}
        if(start<0){ok=false;break;}
        const path=[start];owner[start]=paths.length;
        const target=3+Math.floor(r()*6);
        while(true){
          const tail=path[path.length-1],isP=portal[tail]!==undefined;
          if(path.length>=target&&!isP)break;
          const opts=gn(tail).filter(j=>owner[j]===-1&&(portal[j]===undefined||owner[portal[j]]===-1));
          if(!opts.length){if(isP)ok=false;break;}
          const j=opts[Math.floor(r()*opts.length)];
          path.push(j);owner[j]=paths.length;
          if(portal[j]!==undefined){const q2=portal[j];path.push(q2);owner[q2]=paths.length;}
        }
        if(!ok||path.length<3){ok=false;break;}
        paths.push(path);
      }
      if(!ok||paths.length<3||paths.length>8)continue;
      const portals=plist.map(([a,b])=>{const k=paths.findIndex(p=>p.includes(a));return{a,b,col:r()<.5?-1:k};});
      const mine=gridEdges(paths,w,h);
      // 2) start with every track line, then remove lines the answer doesn't use until nothing else works
      const edges=new Map();
      for(let i=0;i<T;i++)for(const j of gn(i))if(i<j)edges.set(ekey(i,j),[i,j]);
      const puz={w,h,active:new Array(T).fill(true),pairs:paths.map(p=>[p[0],p[p.length-1]]),portals,solution:paths,edges:[]};
      let unique=false,bad=false;
      for(let it=0;it<150;it++){
        puz.edges=[...edges.values()];
        const sols=neonSolve(puz,2,r,60000);
        if(!sols||!sols.length){bad=true;break;}
        const other=sols.find(s=>{const e=gridEdges(s,w,h);if(e.size!==mine.size)return true;for(const k of e)if(!mine.has(k))return true;return false;});
        if(!other){unique=true;break;}
        const extra=[...gridEdges(other,w,h)].filter(k=>!mine.has(k));
        if(!extra.length){bad=true;break;}
        edges.delete(extra[Math.floor(r()*extra.length)]);
      }
      if(!unique||bad)continue;
      // 3) it is already unique, so taking more decoy lines away can't break it: remove plenty, so lines visibly "aren't there"
      const decoys=[...edges.keys()].filter(k=>!mine.has(k));
      shuffle(decoys,r);
      const drop=Math.ceil(decoys.length*(.35+r()*.3));
      for(let i=0;i<drop;i++)edges.delete(decoys[i]);
      puz.edges=[...edges.values()];
      const total=(w-1)*h+(h-1)*w;
      if(puz.edges.length-mine.size<4||total-puz.edges.length<4)continue;   // keep some decoys AND have missing lines
      if(neonVerify(puz))return puz;
    }
    return null;
  }
  // The rules, checked on the bot's own answer: every dot covered once, steps follow real lines, portals used properly.
  function neonVerify(p){
    const spec={};p.portals.forEach(q=>{spec[q.a]=q;spec[q.b]=q;});
    const E=new Set(p.edges.map(e=>ekey(e[0],e[1])));
    const seen=new Set();let total=0;p.active.forEach(a=>{if(a)total++;});
    for(let k=0;k<p.solution.length;k++){
      const path=p.solution[k];
      if(path[0]!==p.pairs[k][0]||path[path.length-1]!==p.pairs[k][1])return false;
      if(spec[path[0]]||spec[path[path.length-1]])return false;
      for(let i=0;i<path.length;i++){
        const c=path[i];if(!p.active[c]||seen.has(c))return false;seen.add(c);
        const s=spec[c];if(s&&s.col!==-1&&s.col!==k)return false;
        if(s){const partner=c===s.a?s.b:s.a,prev=path[i-1],next=path[i+1];if((prev===partner)===(next===partner))return false;}
        if(i>0){const d=path[i-1],tele=spec[c]&&spec[d]&&spec[c]===spec[d];if(!tele&&!E.has(ekey(c,d)))return false;}
      }
    }
    return seen.size===total;
  }

  // CURRENTS: the bot walks a path through every cell, then drops numbers along it.
  function genCurrents(r){
    const N=6,T=N*N;
    for(let a=0;a<500;a++){
      const used=new Array(T).fill(false),start=Math.floor(r()*T),path=[start];used[start]=true;let steps=0;
      const dfs=()=>{
        if(path.length===T)return true;
        if(++steps>30000)return false;
        const c=shuffle(nb(path[path.length-1],N).filter(j=>!used[j]),r);
        for(const j of c){used[j]=true;path.push(j);if(dfs())return true;if(steps>30000)return false;used[j]=false;path.pop();}
        return false;
      };
      if(!dfs())continue;
      const idx=[0];let i=0;
      while(true){i+=4+Math.floor(r()*3);if(i>=T-3)break;idx.push(i);}
      idx.push(T-1);
      const nums={};idx.forEach((k,n)=>{nums[path[k]]=n+1;});
      return{N,nums,max:idx.length,solution:path};
    }
    return null;
  }

  // SCOOT: the bot lays out blocks, then solves it itself (breadth-first search).
  function solveScoot(cars){
    const start=cars.map(c=>c.p),key=a=>a.join('');
    const seen=new Set([key(start)]);let frontier=[start],d=0;
    while(frontier.length){
      d++;const next=[];
      for(const st of frontier){
        const occ=new Array(36).fill(-1);
        cars.forEach((c,i)=>{for(let k=0;k<c.len;k++){const x=c.h?st[i]+k:c.f,y=c.h?c.f:st[i]+k;occ[y*6+x]=i;}});
        for(let i=0;i<cars.length;i++){
          const c=cars[i];
          for(const dir of[-1,1]){
            let p=st[i];
            while(true){
              const np=dir<0?p-1:p+c.len;
              if(np<0||np>5)break;
              const x=c.h?np:c.f,y=c.h?c.f:np;
              if(occ[y*6+x]>=0)break;
              p+=dir;const ns=st.slice();ns[i]=p;const k=key(ns);
              if(!seen.has(k)){seen.add(k);if(i===0&&p===4)return d;next.push(ns);if(seen.size>80000)return -1;}
            }
          }
        }
      }
      frontier=next;
    }
    return -1;
  }
  function genScoot(r){
    for(let a=0;a<600;a++){
      const cars=[{f:2,len:2,h:true,p:r()<.5?0:1}];
      const occ=new Set([cars[0].p+12,cars[0].p+13]);
      const n=7+Math.floor(r()*4);
      for(let t=0;t<80&&cars.length<n+1;t++){
        const h=r()<.5,len=r()<.7?2:3,f=Math.floor(r()*6),p=Math.floor(r()*(7-len));
        if(h&&f===2)continue;
        const cells=[];for(let k=0;k<len;k++)cells.push(h?f*6+p+k:(p+k)*6+f);
        if(cells.some(c=>occ.has(c)))continue;
        cells.forEach(c=>occ.add(c));cars.push({f,len,h,p});
      }
      const d=solveScoot(cars);
      if(d>=5&&d<=16)return{cars,par:d};
    }
    return null;
  }
  const api={hash,rng,neonVerify,neonSolve,genNeon,genCurrents,genScoot,solveScoot};
  if(typeof module!=='undefined')module.exports=api;else root.Gen=api;
})(this);
