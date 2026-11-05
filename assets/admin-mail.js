(()=>{'use strict';
 const API='https://drone-italia-commenti.turni-vigilanza-pdura.workers.dev',ORIGIN=new URL(API).origin;
 const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
 let key='',epoch=0,folder='inbox',nextCursor=null,rows=[],selected=null,pending=null,popup=null,draft=null,sending=false,loading=false,viewRun=0,listRun=0,composeTo='';
 const status=text=>$('mail-status').textContent=text;
 async function api(path,data){
  const auth=key;if(!auth)throw Error('Accedi al pannello.');
  const response=await fetch(API+'/admin/mail'+path,{method:data===undefined?'GET':'POST',headers:{Authorization:'Bearer '+auth,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)}),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(35000)});
  if(key!==auth)throw Error('Sessione chiusa.');
  let result;try{result=await response.json();}catch{throw Error('Il servizio Posta deve essere aggiornato o non è disponibile.');}
  if(response.status===401)document.dispatchEvent(new CustomEvent('di-admin-signout'));
  if(!response.ok)throw Error(result.error||'Servizio Posta non disponibile.');return result;
 }
 function person(p){return p?(p.name?p.name+' <'+p.address+'>':p.address):'Mittente non disponibile';}
 function date(v){const d=new Date(v);return Number.isNaN(+d)?'':d.toLocaleString('it-IT');}
 function clearReader(){selected=null;$('mail-reader').replaceChildren(el('p','Seleziona un messaggio per leggerlo e rispondere.','hint'));}
 function renderList(){
  const q=$('mail-search').value.trim().toLocaleLowerCase('it-IT');$('mail-list').replaceChildren();
  const filtered=rows.filter(x=>[x.subject,x.from?.name,x.from?.address,...(x.to||[]).map(p=>p.address),x.preview].join(' ').toLocaleLowerCase('it-IT').includes(q));
  for(const m of filtered){
   const b=el('button',undefined,'mail-row'+(m.id===selected?.id?' is-selected':''));b.type='button';
   if(m.id===selected?.id)b.setAttribute('aria-current','true');
   b.append(el('strong',m.subject),el('span',folder==='sentitems'?'A: '+(m.to||[]).map(person).join(', '):person(m.from),'mail-row-address'),el('small',date(m.date)),el('span',m.preview.slice(0,140),'mail-row-preview'));
   if(!m.isRead&&folder==='inbox')b.append(el('small','Non letto su Outlook','mail-unread'));
   if(m.hasAttachments)b.append(el('small','Contiene allegati','hint'));
   b.addEventListener('click',()=>openMessage(m.id));$('mail-list').append(b);
  }
  if(!filtered.length)$('mail-list').append(el('p',rows.length?'Nessun risultato nei messaggi caricati.':'Nessun messaggio in questa cartella.','hint'));
  $('mail-more').hidden=!nextCursor;$('mail-count').textContent=rows.length+' messaggi caricati';
 }
 async function list(more=false){
  if((loading&&more)||!key)return;loading=true;const version=epoch,run=++listRun,currentFolder=folder;
  status('Caricamento della posta…');$('mail-refresh').disabled=true;$('mail-more').disabled=true;
  try{
   const params=new URLSearchParams({folder:currentFolder});if(more&&nextCursor)params.set('cursor',nextCursor);
   const data=await api('/messages?'+params);if(version!==epoch||run!==listRun||folder!==currentFolder)return;
   rows=more?[...new Map([...rows,...data.messages].map(x=>[x.id,x])).values()]:data.messages;nextCursor=data.nextCursor;
   renderList();status('Posta aggiornata. La lettura qui non cambia lo stato letto/non letto in Outlook.');
  }catch(e){if(version===epoch)status(e.message);}finally{if(run===listRun){loading=false;$('mail-refresh').disabled=false;$('mail-more').disabled=false;}}
 }
 async function openMessage(id){
  const version=epoch,run=++viewRun;$('mail-reader').replaceChildren(el('p','Apertura messaggio…'));
  try{
   const {message:m}=await api('/messages/'+encodeURIComponent(id));if(version!==epoch||run!==viewRun)return;
   selected=m;renderList();const container=$('mail-reader');container.replaceChildren(el('h2',m.subject));
   container.append(el('p','Da: '+person(m.from),'mail-address'),el('p','A: '+m.to.map(person).join(', '),'mail-address'),el('p',date(m.date),'hint'));
   const content=el('div',m.body,'mail-body');container.append(content);
   if(m.bodyType.toLowerCase()==='html'){
    // HTML della posta sempre convertito in testo; nessuna risorsa remota viene caricata.
    content.textContent=m.body.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<br\s*\/?\s*>|<\/(?:p|div|tr)>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&amp;/gi,'&');
   }
   if(m.hasAttachments)container.append(el('p','Questo messaggio contiene allegati. In questa prima versione non vengono aperti nel pannello.','hint'));
   if(folder!=='sentitems'){
    const label=el('label','Risposta a: '+m.replyTo.map(person).join(', '));label.htmlFor='mail-reply-body';
    const textarea=el('textarea');textarea.id='mail-reply-body';textarea.rows=7;textarea.maxLength=20000;textarea.placeholder='Scrivi la tua risposta…';
    const button=el('button','Controlla e invia risposta');button.type='button';
    button.addEventListener('click',()=>prepare({type:'reply',id:m.id,recipients:m.replyTo.map(p=>p.address),subject:'Re: '+m.subject,body:textarea.value}));container.append(label,textarea,button);
   }
  }catch(e){if(version===epoch&&run===viewRun)$('mail-reader').replaceChildren(el('p',e.message));}
 }
 async function refreshStatus(){
  const version=epoch;status('Controllo del collegamento Outlook…');
  try{
   const data=await api('/status');if(version!==epoch)return;
   $('mail-connect').hidden=data.connected;$('mail-disconnect').hidden=!data.connected;$('mail-tools').hidden=!data.connected;$('mail-columns').hidden=!data.connected;
   $('mail-connection').textContent=data.connected?'COLLEGATA · '+data.mailbox:'DA COLLEGARE · '+data.mailbox;
   if(data.connected){if(composeTo){$('mail-compose').hidden=false;$('mail-new-to').value=composeTo;$('mail-new-subject').value='Drone in Quota — Il tuo messaggio';composeTo='';$('mail-new-subject').focus();}await list();}else status('Premi Collega Outlook e autorizza la casella droneinquota@outlook.com.');
  }catch(e){if(version===epoch){$('mail-connection').textContent='COLLEGAMENTO DA COMPLETARE';status(e.message);}}
 }
 $('mail-connect').addEventListener('click',async()=>{
  popup=window.open('about:blank','di-outlook-connect','width=620,height=760');
  if(!popup){status('Consenti la finestra popup per collegare Outlook.');return;}
  popup.document.title='Collegamento Outlook';popup.document.body.textContent='Preparazione accesso Microsoft…';
  const version=epoch;$('mail-connect').disabled=true;
  try{
   const data=await api('/connect',{});if(version!==epoch){popup.close();return;}
   const url=new URL(data.authorizationUrl);if(url.origin!=='https://login.microsoftonline.com')throw Error('Indirizzo Microsoft non valido.');
   pending={state:data.state,secret:data.confirmationSecret};popup.location.replace(url.href);status('Completa l’accesso nella finestra Microsoft. Usa droneinquota@outlook.com.');
  }catch(e){popup.close();status(e.message);}finally{$('mail-connect').disabled=false;}
 });
 window.addEventListener('message',async event=>{
  if(event.origin!==ORIGIN||event.source!==popup||!pending||event.data?.type!=='di-outlook-result'||event.data.state!==pending.state)return;
  const flow=pending;pending=null;const version=epoch;
  if(!event.data.ok){status('Collegamento non riuscito. Controlla l’account scelto, i permessi, il segreto e l’URI configurati.');return;}
  try{await api('/confirm',{state:flow.state,confirmationSecret:flow.secret});if(version!==epoch)return;if(popup&&!popup.closed)popup.close();await refreshStatus();}catch(e){if(version===epoch)status(e.message);}
 });
 function prepare(value){
  const body=value.body.trim();if(!body){status('Scrivi il messaggio prima di continuare.');return;}
  if(value.type==='new'&&(!$('mail-compose').reportValidity()))return;
  if(value.recipients.some(p=>!p||/[\r\n<>]/.test(p))){status('Destinatario non valido.');return;}
  draft={...value,body,requestId:crypto.randomUUID()};
  $('mail-confirm-title').textContent='Conferma invio email';$('mail-confirm-copy').textContent='Da: droneinquota@outlook.com\nA: '+value.recipients.join(', ')+'\nOggetto: '+value.subject;
  $('mail-confirm-body').textContent=body;$('mail-send-confirm').textContent='Invia email';$('mail-send-confirm').disabled=false;
  $('mail-confirm').showModal();$('mail-send-cancel').focus();
 }
 $('mail-compose-open').addEventListener('click',()=>{$('mail-compose').hidden=false;$('mail-new-to').focus();});
 $('mail-compose-close').addEventListener('click',()=>{$('mail-compose').hidden=true;});
 $('mail-compose').addEventListener('submit',event=>{event.preventDefault();prepare({type:'new',recipients:[$('mail-new-to').value.trim()],subject:$('mail-new-subject').value.trim(),body:$('mail-new-body').value});});
 $('mail-send-cancel').addEventListener('click',()=>{if(sending)return;draft=null;$('mail-confirm').close();});
 $('mail-confirm').addEventListener('cancel',event=>{if(sending)event.preventDefault();else draft=null;});
 $('mail-send-confirm').addEventListener('click',async()=>{
  if(!draft||sending||!key)return;const value=draft,version=epoch;sending=true;$('mail-send-confirm').disabled=true;$('mail-send-cancel').disabled=true;
  try{
   if(value.type==='disconnect'){
    await api('/disconnect',{confirm:true});if(version!==epoch)return;rows=[];nextCursor=null;clearReader();renderList();await refreshStatus();
   }else{
    const body={body:value.body,requestId:value.requestId,confirm:true};
    if(value.type==='reply')body.expectedRecipients=value.recipients;else{body.to=value.recipients[0];body.subject=value.subject;}
    await api(value.type==='reply'?'/messages/'+encodeURIComponent(value.id)+'/reply':'/send',body);
    if(version!==epoch)return;status('Microsoft ha accettato l’invio. Puoi controllarlo in Posta inviata.');
    if(value.type==='new'){$('mail-compose').reset();$('mail-compose').hidden=true;}else if($('mail-reply-body'))$('mail-reply-body').value='';
   }
   draft=null;$('mail-confirm').close();
  }catch(e){if(version===epoch){draft=null;$('mail-confirm').close();status(e.message);}}
  finally{sending=false;$('mail-send-confirm').disabled=false;$('mail-send-cancel').disabled=false;}
 });
 $('mail-disconnect').addEventListener('click',()=>{
  draft={type:'disconnect'};$('mail-confirm-title').textContent='Scollegare Outlook?';$('mail-confirm-copy').textContent='Verranno rimossi dal backend i codici di accesso alla casella. Le email resteranno su Outlook.';$('mail-confirm-body').textContent='Potrai ricollegare la casella in seguito.';$('mail-send-confirm').textContent='Scollega Outlook';$('mail-confirm').showModal();$('mail-send-cancel').focus();
 });
 $('mail-folder').addEventListener('change',()=>{folder=$('mail-folder').value;viewRun++;nextCursor=null;rows=[];clearReader();list();});
 $('mail-search').addEventListener('input',renderList);$('mail-refresh').addEventListener('click',()=>list());$('mail-more').addEventListener('click',()=>list(true));
 document.addEventListener('di-admin-mail-compose',event=>{if(key&&typeof event.detail?.to==='string')composeTo=event.detail.to;});
 document.addEventListener('di-admin-mail-open',()=>{if(key)refreshStatus();});
 document.addEventListener('di-admin-session',event=>{key=event.detail.key;epoch++;});
 document.addEventListener('di-admin-lock',()=>{key='';epoch++;viewRun++;listRun++;loading=false;rows=[];nextCursor=null;selected=null;pending=null;draft=null;composeTo='';if(popup&&!popup.closed)popup.close();$('mail-list').replaceChildren();clearReader();$('mail-compose').reset();$('mail-compose').hidden=true;if($('mail-confirm').open)$('mail-confirm').close();status('');});
 clearReader();
})();
