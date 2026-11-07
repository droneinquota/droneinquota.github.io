/* Icone decorative coerenti. Non legge credenziali, non effettua richieste. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg';
const paths={home:['M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'],explore:['m21 3-6 16-4-6-6-4 16-6Z','m11 13 10-10'],comments:["M4 4h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-5 3V6a2 2 0 0 1 1-2Z"],diary:["M3 10h18v11H3z","M3 4h18v6H3z","m6 4 4 6m3-6 4 6M8 15h8"],download:['M12 3v12m-5-5 5 5 5-5','M4 16v5h16v-5'],support:['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z'],mail:['M3 5h18v14H3z','m3 6 9 7 9-7'],send:['m22 2-7 20-4-9-9-4 20-7Z','M11 13 22 2'],refresh:['M20 7v5h-5','M4 17v-5h5','M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1'],search:['M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z','m15 15 6 6'],users:['M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z','M5 21v-2a7 7 0 0 1 14 0v2M19 4a3 3 0 0 1 0 6M21 14a5 5 0 0 1 2 4v3'],shield:['m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z'],unlock:['M7 11V7a5 5 0 0 1 9-3','M5 11h14v10H5z','M12 15v2'],trash:['M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7'],eye:['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z','M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],edit:['m15 4 5 5M4 20l5-1L21 7a3.5 3.5 0 0 0-5-5L4 14v6Z'],check:['m5 12 4 4L20 5'],close:['m6 6 12 12M18 6 6 18'],back:['m12 5-7 7 7 7M5 12h16'],content:['M4 3h16v18H4z','M8 7h8M8 11h8M8 15h8'],tool:["M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z","M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"]};
const mapping=[[/revoca/i,'unlock'],[/elimina|cancella/i,'trash'],[/ripristina|riprova|aggiorna|ricarica/i,'refresh'],[/scrivi|posta|email|avvisi/i,'mail'],[/invia|condividi|pubblica/i,'send'],[/sospens|blocca|ban utenti|modera/i,'shield'],[/cerca/i,'search'],[/visualizza contenuti|dettagli|racconti/i,'content'],[/anteprima|visita|guarda|mostra/i,'eye'],[/modifica/i,'edit'],[/annulla|chiudi|esci/i,'close'],[/conferma|approva|salva|verifica|accedi/i,'check'],[/precedente|indietro|torna/i,'back'],[/diario|video/i,'diary'],[/scarica|download|installa/i,'download'],[/sostieni|dona|donazione/i,'support'],[/esplora/i,'explore'],[/commenti|rispondi|conversazione/i,'comments'],[/utenti|piloti/i,'users'],[/home|drone in quota/i,'home'],[/stato del sito|manutenzione/i,'tool']];
function icon(name){const svg=document.createElementNS(NS,'svg');svg.setAttribute('class','di-ui-icon');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('data-ui-icon',name);for(const d of paths[name]){const path=document.createElementNS(NS,'path');path.setAttribute('d',d);svg.append(path);}return svg;}
function decorate(node){
 if(node.matches('.reg-person,.flight-row,.di-explore-card,.photo-arrow,#photo-open,#photo-thumbs button,.hub-nav button'))return;
 if(node.closest('iframe,.paypal-buttons,[data-paypal-button],#di-maintenance-page'))return;
 if(node.querySelector('img,iframe'))return;
 const prior=node.querySelector('svg:not(.di-ui-icon)');
 const text=node.textContent.trim();if(!text||text.length>90)return;
 const match=mapping.find(([pattern])=>pattern.test(text));const existing=node.querySelector('.di-ui-icon');
 if(!match){if(existing)existing.remove();return;}
 const name=match[1];if(prior){if(prior.getAttribute('aria-hidden')!=='true')return;prior.remove();}if(existing?.getAttribute('data-ui-icon')===name)return;if(existing)existing.remove();
 // Rimuove soltanto glifi decorativi storici, mantenendo nodi, etichette ed eventi.
 const first=node.firstChild;if(first?.nodeType===3)first.nodeValue=first.nodeValue.replace(/^[\s✉▤♙▷↗↻✓✕✎]+/u,'');
 node.prepend(icon(name));
}
function paint(){for(const node of document.querySelectorAll('body.di-unified-ui button,body.di-unified-ui nav a,body.di-unified-ui #menu a,body.di-unified-ui .actions a,body.di-unified-ui .hub-visit'))decorate(node);}
function start(){paint();let pending=false;const observer=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;paint();});});observer.observe(document.body,{childList:true,subtree:true,characterData:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

