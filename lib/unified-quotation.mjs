export const unifiedQuotationSource = `(()=>{
const eventTypes=[
  ['Buffet Lunch','Lunch'],['Buffet Dinner','Dinner'],['Buffet Hi Tea','Hi Tea'],
  ['Dome Set Lunch','Lunch'],['Dome Set Dinner','Dinner'],['Dome Set Hi Tea','Hi Tea'],
  ['Half Day Seminar','Meeting & Seminar'],['Full Day Seminar','Meeting & Seminar'],
  ['Half Day Meeting','Meeting & Seminar'],['Hall Rental','Hall Rental'],
  ['Breakfast','Lunch'],['Morning Tea Break','Meeting & Seminar'],['Afternoon Tea Break','Meeting & Seminar']
];
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const isQuotation=()=>document.getElementById('documentType')?.value==='quotation';
function templateFor(category){
 const matches=templates.map((t,i)=>({t,i})).filter(x=>x.t.documentType==='quotation');
 const exact=matches.find(x=>norm(x.t.label)===norm(category)||norm(x.t.eventType)===norm(category));
 if(exact)return exact.i;
 const fallbacks={'Dinner':['Dinner Revised','Dinner'],'Meeting & Seminar':['Meeting & Seminar'],'Hall Rental':['Hall Rental'],'Hi Tea':['Hi Tea'],'Lunch':['Lunch · Master asal','Lunch'],'Wedding':['Wedding Master','Wedding']};
 for(const label of fallbacks[category]||[]){const found=matches.find(x=>norm(x.t.label)===norm(label)||norm(x.t.eventType)===norm(label));if(found)return found.i;}
 return -1;
}
function preserveSharedFields(old,next,eventType){
 next.eventType=eventType;
 const fields=new Set(templates[next.template].fields.map(f=>f.id));
 for(const [key,value] of Object.entries(old.values||{})){
   if(!fields.has(key)||/^rate\\d+_/.test(key)||/^event2_/.test(key))continue;
   next.values[key]=value;
 }
 const eventFields=templates[next.template].fields.filter(f=>/^event2_/.test(f.id));
 eventFields.forEach((f,i)=>next.values[f.id]=i===0?eventType:'');
 const groups=[...new Set(templates[next.template].fields.map(f=>f.id.match(/^rate(\\d+)_/)?.[1]).filter(Boolean))];
 next.excludedPackageGroups=groups;
 next.packageSelectionTemplate=next.template;
 next.packageSelectionDocumentType='quotation';
 next.extraPackages=old.extraPackages||[];
 next.extraBilling=old.extraBilling||[];
 if(old.tableCount!==undefined)next.tableCount=old.tableCount;
 if(old.sourceBookingId)next.sourceBookingId=old.sourceBookingId;
 if(old.sourceBookingReference)next.sourceBookingReference=old.sourceBookingReference;
 if(old.sourceQuotationId)next.sourceQuotationId=old.sourceQuotationId;
 if(old.eventStartDate)next.eventStartDate=old.eventStartDate;
 if(old.eventEndDate)next.eventEndDate=old.eventEndDate;
 if(old.department)next.department=old.department;
 if(old.eventTitle)next.eventTitle=old.eventTitle;
 return next;
}
function mountUnified(){
 const original=document.getElementById('template');
 if(!original||!isQuotation()||document.getElementById('eventTypeSelection'))return;
 const wrap=original.closest('label')||original.parentElement;
 const control=document.createElement('label');control.id='unifiedEventTypeControl';
 control.textContent='Jenis acara';
 const select=document.createElement('select');select.id='eventTypeSelection';
 eventTypes.forEach(([name])=>{const o=document.createElement('option');o.value=name;o.textContent=name;select.append(o);});
 control.append(select);wrap.before(control);wrap.hidden=true;
 const category=document.getElementById('metaType');
 if(category){const categoryLabel=category.closest('label');if(categoryLabel)categoryLabel.hidden=true;}
 let selected=eventTypes.find(([name,cat])=>templateFor(cat)===Number(state.template)&&norm(name)===norm((state.values||{}).eventType))?.[0];
 if(!selected){const t=templates[state.template],label=norm(t?.label+' '+t?.eventType);selected=eventTypes.find(([name])=>label.includes(norm(name)))?.[0];}
 if(!selected)selected=eventTypes.find(([,cat])=>templateFor(cat)===Number(state.template))?.[0]||eventTypes[0][0];
 select.value=selected;
 select.addEventListener('change',()=>{
   const [eventType,categoryName]=eventTypes.find(([name])=>name===select.value)||eventTypes[0];
   const index=templateFor(categoryName);if(index<0){tell('Templat quotation untuk jenis acara ini belum tersedia.');return;}
   const old=state;const next=fresh(index);Object.assign(next,old,{template:index,values:{...next.values}});
   preserveSharedFields(old,next,eventType);state=next;
   if(category){category.value=categoryName;}
   original.value=String(index);
   mount();
   const newControl=document.getElementById('eventTypeSelection');if(newControl)newControl.value=eventType;
   dirty=true;schedule();gate();
   tell('Jenis acara ditukar. Maklumat pelanggan dan acara dikekalkan; pilih pakej yang berkaitan dalam senarai pakej.');
 });
}
const oldMount=mount;mount=function(){oldMount();mountUnified();};
if(typeof state!=='undefined'&&state&&typeof templates!=='undefined')mountUnified();
})();`;
