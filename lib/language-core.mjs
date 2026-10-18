import dictionaries from './translations.json' with {type:'json'};
export function translateText(value, language='ms') {
  if(typeof value!=='string'||!value.trim())return value;
  const core=value.trim(), dict=dictionaries[language]||dictionaries.ms;
  const translated=Object.hasOwn(dict,core)?dict[core]:undefined;
  if(translated!==undefined)return value.slice(0,value.indexOf(core))+translated+value.slice(value.indexOf(core)+core.length);
  if(language==='en') {
    const field=core.match(/^Sila semak medan ([a-z_]+)\.$/);if(field){const names={venue_id:'venue',customer_name:'full name',email:'email',phone:'phone number',event_type:'event type',event_date:'event date',end_date:'end date',start_time:'start time',end_time:'end time',organisation:'organisation',notes:'additional requirements'};return 'Please check the '+(names[field[1]]||'form')+' field.';}
    const room=core.match(/^([123]) bilik tidur$/i);if(room)return room[1]+' bedroom'+(room[1]==='1'?'':'s');
    const units=core.match(/^(\d+) unit$/);if(units)return units[1]+' unit'+(units[1]==='1'?'':'s');
    if(core.endsWith(' penuh'))return core.slice(0,-6)+' full';
    if(core.endsWith(' pilih tarikh'))return core.slice(0,-13)+' choose date';
    if(core.startsWith('Foto destinasi '))return 'Destination photo '+core.slice(15);
    if(core.startsWith('Lihat gambar '))return 'View photo '+translateText(core.slice(13),'en');
    if(core.endsWith(' Kijal Permai Apartment'))return translateText(core.slice(0,-23),'en')+' Kijal Permai Apartment';
  }
  return value;
}
