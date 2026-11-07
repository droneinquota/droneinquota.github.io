(()=>{'use strict';
const list=document.getElementById('community-pilots'),status=document.getElementById('community-pilots-status'),more=document.getElementById('pilots-more');if(!list)return;
const api='https://drone-italia-commenti.turni-vigilanza-pdura.workers.dev';
let pilots=[],flights=[],comments=[],ready=false,fallback=false,nextPage=null,busy=false;
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function render(){list.replaceChildren();let rows=pilots;
 if(fallback){const names=new Map();for(const f of flights){if(f.isDemo||f.status&&f.status!=='published')continue;const name=String(f.author||'').trim();if(name)names.set(name.toLocaleLowerCase('it'),{nickname:name});}for(const c of comments){const name=String(c.nickname||'').trim();if(name)names.set(name.toLocaleLowerCase('it'),{nickname:name});}rows=[...names.values()].sort((a,b)=>a.nickname.localeCompare(b.nickname,'it'));}
 for(const p of rows){const row=node('li'),avatar=node('span',p.nickname.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase(),'pilot-initials'),copy=node('span');avatar.setAttribute('aria-hidden','true');row.append(avatar);
 if(!fallback&&/^[a-f0-9-]{36}$/i.test(p.avatarMediaId||'')){const img=node('img');img.className='pilot-public-photo';img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.src='https://drone-italia-diario.turni-vigilanza-pdura.workers.dev/media/'+encodeURIComponent(p.avatarMediaId);img.addEventListener('error',()=>{img.replaceWith(avatar);},{once:true});row.replaceChildren(img);}
 copy.append(node('strong',p.nickname));copy.append(node('span',fallback?'Grado in aggiornamento':p.grade+' · '+p.points+' punti','pilot-grade'));
 if(!fallback)copy.append(node('small',p.comments+' commenti · '+p.replies+' risposte · '+p.stories+' racconti'));if(p.suspended)copy.append(node('small','Account sospeso'));row.append(copy);list.append(row);}
 if(more){more.hidden=!nextPage;more.disabled=busy;}
 status.textContent=fallback?'Gradi temporaneamente non disponibili.':!ready?'Caricamento della community…':rows.length?rows.length+' di '+total+' piloti della community.':'I primi piloti compariranno dopo la pubblicazione dei loro contenuti.';
}
let total=0;
async function load(page=1){if(busy)return;busy=true;render();try{const r=await fetch(api+'/community/pilots?page='+page,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.pilots)||d.gradeComplete!==true||d.pilots.some(p=>typeof p.nickname!=='string'||typeof p.grade!=='string'||!Number.isFinite(p.points)))throw Error();const ids=new Set(pilots.map(p=>p.id));pilots.push(...d.pilots.filter(p=>!ids.has(p.id)));total=d.total;nextPage=d.nextPage;fallback=false;ready=true;}catch{if(!pilots.length){fallback=true;try{const r=await fetch(api+'/comments',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});if(r.ok){const d=await r.json();comments=Array.isArray(d.comments)?d.comments:[];}}catch{}}else status.textContent='Altri piloti temporaneamente non disponibili.';}finally{busy=false;render();}}
 document.addEventListener('di-journal-public',e=>{flights=Array.isArray(e.detail)?e.detail:[];if(fallback)render();});if(more)more.addEventListener('click',()=>{if(nextPage)load(nextPage);});render();load();
})();
