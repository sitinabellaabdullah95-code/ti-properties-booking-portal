export const MAIN_HALL='Hall Utama Level 3 (Elysium Hall)';
export const VVIP_ROOM='VVIP Meeting Room Level 2';
export const ELYSIUM_ROOM_NAMES=['Elysium Hall',MAIN_HALL,VVIP_ROOM];
export const isVvipRoom=name=>name===VVIP_ROOM;
export const isElysiumRoom=name=>ELYSIUM_ROOM_NAMES.includes(name);
export const roomLabel=name=>name==='Elysium Hall'?MAIN_HALL:name;
export function validateRoomGuests(name,pax){if(isVvipRoom(name)&&(!Number.isInteger(pax)||pax<8||pax>10))throw Error('VVIP Meeting Room Level 2 menerima 8–10 pax sahaja.');}
