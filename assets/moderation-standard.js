/* Motivazione condivisa fra tutte le sezioni di moderazione. */
(()=>{'use strict';
 window.DI_MODERATION_STANDARD_REASON="Il provvedimento riguarda il mancato rispetto delle regole della community di Drone in Quota. Sono richiesti contenuti pertinenti e rispettosi, senza spam, pubblicità non autorizzata, offese, contenuti illeciti o dati personali altrui. Per chiarimenti puoi rispondere a questa email.";
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-standard-target]');if(!button)return;
  const id=button.getAttribute('data-standard-target');if(!['reason','registry-action-reason','admin-reason'].includes(id))return;
  const field=document.getElementById(id);if(!field)return;field.value=window.DI_MODERATION_STANDARD_REASON;field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();
 });
})();
