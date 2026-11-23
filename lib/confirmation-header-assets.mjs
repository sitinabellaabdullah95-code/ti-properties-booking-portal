function attributes(tag){return Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));}
function resolvePart(base,target){if(target.startsWith('/'))return target.slice(1);const parts=base.split('/');parts.pop();for(const part of target.split('/')){if(!part||part==='.')continue;if(part==='..')parts.pop();else parts.push(part);}return parts.join('/');}
function relationships(xml){const out=new Map();for(const m of xml.matchAll(/<Relationship\b[^>]*\/?\s*>/g)){const a=attributes(m[0]);if(a.Id&&a.Target)out.set(a.Id,a.Target);}return out;}

export async function addConfirmationHeaderLogos(templates,JSZip){
 for(const template of templates){
  if(template?.documentType!=='confirmation'||!template.base64||(template.logos?.length||0)>=2)continue;
  try{
   const zip=await JSZip.loadAsync(Buffer.from(template.base64,'base64'));
   const document=await zip.file('word/document.xml')?.async('string');
   const documentRels=await zip.file('word/_rels/document.xml.rels')?.async('string');
   if(!document||!documentRels)continue;
   const references=[...document.matchAll(/<w:headerReference\b[^>]*\/?\s*>/g)].map(m=>attributes(m[0]));
   const reference=references.find(x=>x['w:type']==='first')||references.find(x=>x['w:type']==='default');
   if(!reference?.['r:id'])continue;
   const headerTarget=relationships(documentRels).get(reference['r:id']);
   if(!headerTarget)continue;
   const headerPath=resolvePart('word/document.xml',headerTarget);
   const header=await zip.file(headerPath)?.async('string');
   const relPath=headerPath.replace(/([^/]+)$/,'_rels/$1.rels');
   const headerRels=await zip.file(relPath)?.async('string');
   if(!header||!headerRels)continue;
   const rels=relationships(headerRels),logos=[];
   for(const m of header.matchAll(/<(?:wp:anchor|wp:inline)\b[\s\S]*?<\/wp:(?:anchor|inline)>/g)){
    const node=m[0],id=node.match(/<a:blip\b[^>]*\br:embed="([^"]+)"/)?.[1];
    if(!id)continue;
    const target=rels.get(id);if(!target)continue;
    const imagePath=resolvePart(headerPath,target),image=zip.file(imagePath);if(!image)continue;
    const ext=imagePath.split('.').pop()?.toLowerCase()||'png',mime=ext==='jpg'||ext==='jpeg'?'image/jpeg':ext==='gif'?'image/gif':'image/png';
    const bytes=await image.async('nodebuffer'),height=Number(node.match(/<wp:extent\b[^>]*\bcy="(\d+)"/)?.[1]||0)/914400;
    const x=Number(node.match(/<wp:positionH\b[\s\S]*?<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1]||0);
    logos.push({x,url:`data:${mime};base64,${bytes.toString('base64')}`,height:height||0.35});
   }
   logos.sort((a,b)=>a.x-b.x);
   if(logos.length)template.logos=logos.slice(0,2).map((logo,index)=>({side:index===0?'left':'right',url:logo.url,height:logo.height}));
  }catch{}
 }
 return templates;
}
