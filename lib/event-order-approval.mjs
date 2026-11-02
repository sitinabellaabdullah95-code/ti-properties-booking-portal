export function eventOrderTransition(current,action,role,comment='',now=new Date().toISOString()){
 if(!current)throw Object.assign(Error('Rekod tidak dijumpai.'),{status:404});
 const state=current.reviewStatus||'draft';
 if(action==='submit'){
  if(role!=='owner')throw Object.assign(Error('Hanya penyedia boleh menghantar untuk kelulusan.'),{status:403});
  if(!['draft','returned'].includes(state))throw Object.assign(Error('Rekod ini sudah dihantar atau diluluskan.'),{status:409});
  return {...current,reviewStatus:'pending',submittedAt:now,approvedAt:null,approvedBy:null,reviewComment:'',reviewHistory:[...(current.reviewHistory||[]),{action,at:now,role}]};
 }
 if(!['approve','return'].includes(action))throw Object.assign(Error('Tindakan tidak sah.'),{status:400});
 if(role!=='manager')throw Object.assign(Error('Kelulusan hanya untuk Puan Hana.'),{status:403});
 if(state!=='pending')throw Object.assign(Error('Hanya dokumen menunggu semakan boleh diproses.'),{status:409});
 if(typeof comment!=='string'||comment.length>3000||(action==='return'&&!comment.trim()))throw Object.assign(Error('Isi ulasan pindaan (maksimum 3000 aksara).'),{status:400});
 return {...current,reviewStatus:action==='approve'?'approved':'returned',reviewComment:comment.trim(),approvedAt:action==='approve'?now:null,approvedBy:action==='approve'?'farhana@tiproperties.my':null,reviewHistory:[...(current.reviewHistory||[]),{action,at:now,role,comment:comment.trim()}]};
}
export function eventOrderApprovalMessage(row){const clean=v=>String(v||'—').replace(/[\r\n]+/g,' ').slice(0,250),f=row.fields;return {subject:'For Review & Approval — Event Order '+clean(f.ref),text:['Dear Miss Hana,','','Please review the Event Order and Internal document below for your approval.','','Reference No.: '+clean(f.ref),'Department / Organisation: '+clean(f.company),'Organiser: '+clean(f.organiser),'Event Type: '+clean(f.eventType),'Event Date: '+clean(f.eventDate)+(f.endDate&&f.endDate!==f.eventDate?' — '+clean(f.endDate):''),'Venue: '+clean(f.venue),'','Review Event Order & Internal:','https://ti-properties-booking-portal.netlify.app/admin/event-orders?order='+encodeURIComponent(row.id),'','Please sign in with your authorised account to approve or return the document for amendments.','','Thank you and regards,','Siti Nabella Abdullah','Executive, Sales','TI Properties Sdn Bhd'].join('\n')};}

