(()=>{'use strict';
const list=document.getElementById('community-pilots'),status=document.getElementById('community-pilots-status');if(!list)return;
let flights=[],comments=[],commentsReady=false,commentsFailed=false;
function render(){const pilots=new Map();
 for(const f of flights){if(f.isDemo||f.status&&f.status!=='published')continue;const name=String(f.author||'').trim();if(!name)continue;const k=name.toLocaleLowerCase('it');if(!pilots.has(k))pilots.set(k,{name,diary:true,suspended:false});else pilots.get(k).diary=true;}
 for(const c of comments){const name=String(c.nickname||'').trim();if(!name)continue;const k=name.toLocaleLowerCase('it');if(!pilots.has(k))pilots.set(k,{name,diary:false,suspended:false});if(c.account_suspended===1||c.account_suspended===true)pilots.get(k).suspended=true;}
 list.replaceChildren();for(const p of [...pilots.values()].sort((a,b)=>a.name.localeCompare(b.name,'it'))){const row=document.createElement('li'),avatar=document.createElement('span'),copy=document.createElement('span'),name=document.createElement('strong'),meta=document.createElement('small');avatar.className='pilot-initials';avatar.setAttribute('aria-hidden','true');avatar.textContent=p.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();name.textContent=p.name;meta.textContent=p.diary?'Autore nel diario':'Dalla community';copy.append(name,meta);row.append(avatar,copy);list.append(row);}
 status.textContent=pilots.size?pilots.size+' nickname dai racconti e dai commenti pubblicati.':commentsReady?'I primi piloti compariranno qui dopo la pubblicazione dei loro contenuti.':'Caricamento della community…';if(commentsFailed)status.textContent+=' Commenti temporaneamente non disponibili.';
}
document.addEventListener('di-journal-public',e=>{flights=Array.isArray(e.detail)?e.detail:[];render();});
async function load(){try{let cursor=null;const seen=new Set();for(let page=0;page<5;page++){const url=new URL('https://drone-italia-commenti.turni-vigilanza-pdura.workers.dev/comments');if(cursor)url.searchParams.set('cursor',cursor);const r=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Elenco non disponibile');const d=await r.json();if(!Array.isArray(d.comments))throw Error('Elenco non valido');comments.push(...d.comments);if(!d.nextCursor||seen.has(d.nextCursor))break;seen.add(d.nextCursor);cursor=d.nextCursor;}}catch{commentsFailed=true;}finally{commentsReady=true;render();}}
render();load();
})();
