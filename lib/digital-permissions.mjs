export const canPrepareDigital=role=>role==='owner'||role==='director';
export const canApproveDigital=role=>role==='manager'||role==='director';
export function digitalUiAccess(source){for(const who of ['me','me?','user','user?']){const key=who.endsWith('?')?who.slice(0,-1)+'?.role':who+'.role';for(const [role,allowed] of [['owner',['owner','director']],['manager',['manager','director']]]){source=source.split(key+"==='"+role+"'").join(JSON.stringify(allowed)+'.includes('+key+')');source=source.split(key+"!=='"+role+"'").join('!'+JSON.stringify(allowed)+'.includes('+key+')');}}return source;}

