export const ELYSIUM_SLOTS=[{start:'08:00',end:'14:00',label:'8 pagi – 2 petang'},{start:'08:00',end:'17:00',label:'8 pagi – 5 petang'},{start:'12:00',end:'14:00',label:'12 tengah hari – 2 petang'},{start:'14:00',end:'17:00',label:'2 petang – 5 petang'},{start:'19:00',end:'22:00',label:'7 malam – 10 malam'}];
export function isElysiumSlot(start,end){return ELYSIUM_SLOTS.some(s=>s.start===start&&s.end===end)}
export function overlapsSlot(periods,date,start,end){return periods.some(p=>p.start<date+'T'+end+':00'&&p.end>date+'T'+start+':00')}
export function allSlotsBlocked(periods,date,slots){return !!slots?.length&&slots.every(s=>overlapsSlot(periods,date,s.start,s.end))}
