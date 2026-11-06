(()=>{'use strict';
const $=id=>document.getElementById(id),API='https://drone-italia-commenti.turni-vigilanza-pdura.workers.dev';
let key='',mode='demo',users=[],real=[],selected=null,generation=0;
const defaults=[{id:'demo-1',name:'Marco Volo',email:'marco@example.com',count:12,state:'active'},{id:'demo-2',name:'Giulia Sky',email:'giulia@example.com',count:8,state:'active'},{id:'demo-3',name:'Luca Drone',email:'luca@example.com',count:3,state:'temporary'},{id:'demo-4',name:'Pilot87',email:'',count:1,state:'active'}];
const labels={active:'Attivo',temporary:'Ban temporaneo',permanent:'Ban permanente',unknown:'Da verificare'};
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
const button=(text,fn)=>{const b=el('button',text,'secondary');b.type='button';b.addEventListener('click',fn);return b;};
function reset(){users=defaults.map(x=>({...x}));}
function draw(){
 const demo=mode==='demo',q=$('users-search').value.trim().toLocaleLowerCase('it'),state=$('users-filter').value;
 $('users-badge').textContent=demo?'MODALITÀ PROVA':'UTENTI DAI MESSAGGI';$('users-reset').hidden=!demo;
 $('users-note').textContent=demo?'Utenti fittizi modificabili. Le prove restano in questa sessione e non inviano email né applicano ban reali.':'Elenco ricavato dagli ultimi 100 commenti e 100 risposte caricati. Non è un registro completo degli iscritti. Email disponibili solo se verificate; foto non ancora disponibili. Lo stato dei blocchi va verificato in Ban utenti e IP.';
 const rows=(demo?users:real).filter(u=>(!q||(u.name+' '+u.email).toLocaleLowerCase('it').includes(q))&&(!state||u.state===state));
 $('users-list').replaceChildren();
 for(const u of rows){
  const row=el('tr'),identity=el('td'),person=el('div',undefined,'users-person'),avatar=el('span',u.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase()||'U','users-avatar');
  if(demo&&(u.id==='demo-1'||u.id==='demo-2')){avatar.textContent='';avatar.className+=' users-avatar-photo '+(u.id==='demo-1'?'users-avatar-marco':'users-avatar-giulia');}avatar.setAttribute('aria-hidden','true');person.append(avatar,el('strong',u.name));identity.append(person);
  const email=el('td',u.email||'Email non disponibile'),status=el('td'),actions=el('td'),tools=el('div',undefined,'users-actions');status.append(el('span',labels[u.state]||labels.unknown,'users-state '+u.state));
  const write=button(demo?'Prova scrittura':'Scrivi',()=>{if(demo){$('users-status').textContent='Simulazione: messaggio per '+u.name+'. Nessuna email inviata.';return;}document.querySelector('.hub-nav [data-section="mail"]').click();document.dispatchEvent(new CustomEvent('di-admin-mail-compose',{detail:{to:u.email}}));});write.disabled=!u.email;
  tools.append(write,button(demo?'Modifica':'Dettagli',()=>edit(u)));actions.append(tools);row.append(identity,email,el('td',u.count+' messaggi'),status,actions);$('users-list').append(row);
 }
 $('users-count').textContent=rows.length+' utenti visualizzati';if(!rows.length){const row=el('tr'),cell=el('td','Nessun utente per questi filtri.');cell.colSpan=5;row.append(cell);$('users-list').append(row);}
}
function edit(u){selected=u.id;const demo=mode==='demo';$('users-edit-title').textContent=demo?'Modifica utente di prova':'Dettagli utente';$('users-edit-name').value=u.name;$('users-edit-email').value=u.email;$('users-edit-state').value=u.state;$('users-edit-state').disabled=!demo;$('users-edit-name').readOnly=!demo;$('users-edit-email').readOnly=!demo;$('users-edit-save').hidden=!demo;$('users-edit-note').textContent=demo?'Modifiche dimostrative: non cambiano account o ban reali.':'Dati ricavati dai messaggi caricati. Lo stato dei blocchi va verificato nella sezione Ban utenti e IP.';$('users-edit-dialog').showModal();}
async function load(){
 if(!key)return;if(mode==='demo'){draw();$('users-status').textContent='Dati di prova pronti.';return;}
 const run=++generation,auth=key;$('users-status').textContent='Caricamento utenti dai messaggi…';$('users-refresh').disabled=true;
 try{
  const results=await Promise.all(['comments','replies'].map(async type=>{const r=await fetch(API+'/admin/'+type,{headers:{Authorization:'Bearer '+auth},cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw Error(d.error||'Elenco non disponibile.');if(!Array.isArray(d[type]))throw Error('Elenco non valido.');return d[type];}));
  if(key!==auth||run!==generation)return;
  const map=new Map();let unidentified=0;
  for(const item of results.flat()){
   const email=item.contact_available&&typeof item.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)?item.email:'';
   const id=item.email_hash||email.toLowerCase();if(!id){unidentified++;continue;}
   let user=map.get(id);if(!user){user={id,name:item.nickname||'Utente',email,count:0,state:'unknown'};map.set(id,user);}user.count++;if(email)user.email=email;
  }
  real=[...map.values()];draw();$('users-status').textContent='Elenco aggiornato.'+(unidentified?' '+unidentified+' messaggi senza identificativo account non sono stati raggruppati.':'');
 }catch(e){if(key===auth&&run===generation){real=[];draw();$('users-status').textContent='Caricamento non riuscito: '+e.message;}}
 finally{if(run===generation)$('users-refresh').disabled=false;}
}
$('users-mode').addEventListener('change',()=>{mode=$('users-mode').value;generation++;$('users-refresh').disabled=false;$('users-filter').value='';$('users-search').value='';load();});
$('users-search').addEventListener('input',draw);$('users-filter').addEventListener('change',draw);$('users-refresh').addEventListener('click',load);
$('users-reset').addEventListener('click',()=>{reset();draw();$('users-status').textContent='Dati di prova ripristinati.';});
$('users-bans').addEventListener('click',()=>{document.querySelector('.hub-nav [data-section="comments"]').click();document.dispatchEvent(new CustomEvent('di-admin-tab',{detail:{tab:'bans'}}));});
$('users-edit-close').addEventListener('click',()=>$('users-edit-dialog').close());
$('users-edit-form').addEventListener('submit',e=>{e.preventDefault();if(mode!=='demo'||!key||!$('users-edit-form').reportValidity())return;const u=users.find(x=>x.id===selected),name=$('users-edit-name').value.trim();if(!u||!name)return;u.name=name;u.email=$('users-edit-email').value.trim();u.state=$('users-edit-state').value;$('users-edit-dialog').close();draw();$('users-status').textContent='Utente di prova aggiornato. Nessuna modifica agli account reali.';});
document.addEventListener('di-admin-users-open',load);document.addEventListener('di-admin-session',e=>{key=e.detail.key;mode='demo';$('users-mode').value='demo';reset();draw();});
document.addEventListener('di-admin-lock',()=>{key='';generation++;real=[];users=[];selected=null;$('users-list').replaceChildren();$('users-search').value='';$('users-edit-name').value='';$('users-edit-email').value='';$('users-status').textContent='';$('users-edit-dialog').close();$('users-refresh').disabled=false;});
reset();draw();
})();
