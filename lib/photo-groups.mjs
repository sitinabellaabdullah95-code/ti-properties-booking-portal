export function photoGroup(item){
 if(item.category!=='photo')return '';
 if(item.destination==='kijal')return 'kijal';
 if(item.destination!=='drawbridge')return 'other';
 if(item.title.startsWith('Elysium Hall —'))return 'elysium';
 if(item.title.startsWith('Hydraulic Tour —'))return 'hydraulic';
 if(item.title.startsWith('Gallery —'))return 'gallery';
 return 'facade';
}
