export function digitalApprovalMessage(row){
 const payload=typeof row.payload==='string'?JSON.parse(row.payload):row.payload||{},label=row.document_type==='confirmation'||payload.documentType==='confirmation'?'Confirmation':'Quotation';
 const department=row.department||payload.department||(payload.values?.recipient1||'').split('\n')[0]||(payload.values?.recipient0||'').split('\n')[1]||row.customer||'—';
 const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):String(value||'—');
 const end=row.event_end_date||payload.eventEndDate,eventDate=date(row.event_date)+(end&&end!==row.event_date?' – '+date(end):''),safe=v=>String(v).replace(/[\r\n]/g,' '),url='https://ti-properties-booking-portal.netlify.app/admin/quotation-digital?quotation='+encodeURIComponent(row.id);
 return {subject:`For Review & Approval — ${safe(row.ref)} | ${safe(department)}`,text:`Dear Miss Hana,\n\nKindly review the following ${label.toLowerCase()} for your approval:\n\nReference No.: ${row.ref}\nDepartment / Organisation: ${department}\nEvent Type: ${row.event_type||'—'}\nEvent Date: ${eventDate}\n\nReview ${label} in Admin Portal:\n${url}\n\nPlease log in using your registered account to approve the ${label.toLowerCase()} or return it with comments for amendment.\n\nThank you.\n\nTI Properties Sdn. Bhd.`};
}

