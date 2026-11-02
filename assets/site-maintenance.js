(()=>{'use strict';function renderMaintenance(container,message,preview=false){
 message=message.replace(/Drone Italia/g,'Drone in Quota');container.replaceChildren();const page=document.createElement('section');page.className='di-maintenance-page';if(!preview)page.id='di-maintenance-page';
 page.innerHTML='<header class="di-maintenance-header"><span class="di-maintenance-brand">DRONE IN QUOTA<i></i></span><span>'+ ''+'</span></header><div class="di-maintenance-main"><div class="di-maintenance-drone"><img src="assets/maintenance-drone-v1.webp" alt="Drone in Quota"></div><section class="di-maintenance-card"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4a6 6 0 0 1-8 8l-8 9-3-3 9-8a6 6 0 0 1 8-8l-4 4 3 3Z"/></svg><p class="di-maintenance-eyebrow">AGGIORNAMENTO DEL SISTEMA</p><h2>MANUTENZIONE IN CORSO</h2><p class="di-maintenance-message"></p><p class="di-maintenance-thanks">Grazie per la pazienza.</p></section></div><footer class="di-maintenance-footer">DRONE IN QUOTA · LA PASSIONE DEL VOLO</footer>';
 page.querySelector('.di-maintenance-message').textContent=message==='Stiamo aggiornando Drone in Quota. Torneremo online appena possibile.'?message.replace('. Torneremo','.\nTorneremo'):message;
 if(!preview){const a=document.createElement('a');a.href='admin.html';a.className='di-maintenance-admin';a.textContent='Area amministratore';page.append(a)}container.append(page);return page;
}
async function authorizedPreview(){
 let token='';
 try{
  if(window.name.startsWith('di-preview:')){token=window.name.slice(11);window.name='';if(/^[a-f0-9]{64}$/i.test(token))sessionStorage.setItem('di-preview-token',token)}
  token=sessionStorage.getItem('di-preview-token')||'';
  if(!/^[a-f0-9]{64}$/i.test(token))return false;
  const r=await fetch('https://drone-italia-diario.turni-vigilanza-pdura.workers.dev/preview/verify',{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(4000)});
  if(r.ok)return true;
  sessionStorage.removeItem('di-preview-token');return false;
 }catch{return false}
}
async function check(){let state=null;try{const r=await fetch('https://drone-italia-diario.turni-vigilanza-pdura.workers.dev/site-status',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(4000)});if(r.ok)state=await r.json()}catch{}try{if(state?.enabled===true&&!(await authorizedPreview())){if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));if(!document.getElementById('di-maintenance-page')){const host=document.createElement('div'),page=renderMaintenance(host,typeof state.message==='string'?state.message:'Stiamo aggiornando Drone in Quota. Torneremo online appena possibile.');document.body.prepend(page);document.documentElement.classList.add('di-maintenance-active');document.title='Manutenzione — Drone in Quota'}}}finally{clearTimeout(window.diSiteGateTimeout);document.documentElement.classList.remove('di-site-checking')}}check();window.addEventListener('pageshow',e=>{if(e.persisted)location.reload()});})();