export function time12(value){const match=String(value||'').match(/^(\d{1,2}):(\d{2})/);if(!match)return String(value||'');const hour=Number(match[1]),minute=match[2];return (hour%12||12)+':'+minute+' '+(hour<12?'AM':'PM');}
export const ELYSIUM_SLOTS=[{start:'08:00',end:'14:00',label:'8:00 AM – 2:00 PM'},{start:'08:00',end:'17:00',label:'8:00 AM – 5:00 PM'},{start:'12:00',end:'14:00',label:'12:00 PM – 2:00 PM'},{start:'14:00',end:'17:00',label:'2:00 PM – 5:00 PM'},{start:'19:00',end:'22:00',label:'7:00 PM – 10:00 PM'}];
export function isElysiumSlot(start,end){return ELYSIUM_SLOTS.some(s=>s.start===start&&s.end===end)}
export function overlapsSlot(periods,date,start,end){return periods.some(p=>p.start<date+'T'+end+':00'&&p.end>date+'T'+start+':00')}
export function allSlotsBlocked(periods,date,slots){return !!slots?.length&&slots.every(s=>overlapsSlot(periods,date,s.start,s.end))}
