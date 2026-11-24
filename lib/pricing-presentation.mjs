export const pricingPresentationSource = String.raw`
function pricingText(node){
 if(Array.isArray(node))return node.map(pricingText).join('');
 if(!node||typeof node!=='object')return typeof node==='string'?node:'';
 if(typeof node.text==='string')return node.text;
 if(Array.isArray(node.text))return node.text.map(run=>typeof run==='string'?run:String(run?.text||'')).join('');
 if(node.stack)return pricingText(node.stack);
 if(node.columns)return pricingText(node.columns);
 if(node.table)return pricingText(node.table.body);
 return '';
}
function pricingIsEmphasis(line){
 const s=String(line||'').trim();
 return /^RM\s*[\d,]+(?:\.\d{1,2})?\s*\+?/i.test(s)||/^\*?\s*all prices?\s+(?:are|is)\b.*\b8\s*%.*\bSST\b/i.test(s);
}
function pricingPax(payload){
 const values=payload?.values||state?.values||{};
 const key=Object.keys(values).filter(k=>/^event3_/.test(k)).sort()[0];
 const match=String(values[key]||'').match(/\d+/);
 return match?.[0]||'';
}
function pricingCompany(payload){
 const values=payload?.values||{};
 return String(payload?.department||values.recipient1||String(values.recipient0||'').split(/\r?\n/)[1]||'').split(/\r?\n/)[0].trim();
}
function pricingHeaderRun(doc,text,bold=false){
 const run=doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','w:r'),props=doc.createElementNS(run.namespaceURI,'w:rPr'),fonts=doc.createElementNS(run.namespaceURI,'w:rFonts'),size=doc.createElementNS(run.namespaceURI,'w:sz'),color=doc.createElementNS(run.namespaceURI,'w:color'),node=doc.createElementNS(run.namespaceURI,'w:t');
 fonts.setAttributeNS(run.namespaceURI,'w:ascii','Aptos');fonts.setAttributeNS(run.namespaceURI,'w:hAnsi','Aptos');size.setAttributeNS(run.namespaceURI,'w:val','16');color.setAttributeNS(run.namespaceURI,'w:val','837754');
 props.append(fonts);if(bold)props.append(doc.createElementNS(run.namespaceURI,'w:b'));props.append(size,color);run.append(props);
 node.textContent=text;node.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');run.append(node);return run;
}
function pricingHeaderField(doc,name,fallback){
 const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main',field=doc.createElementNS(W_NS,'w:fldSimple');field.setAttributeNS(W_NS,'w:instr',name);
 const run=doc.createElementNS(W_NS,'w:r'),props=doc.createElementNS(W_NS,'w:rPr'),size=doc.createElementNS(W_NS,'w:sz'),text=doc.createElementNS(W_NS,'w:t');size.setAttributeNS(W_NS,'w:val','16');props.append(size);run.append(props);text.textContent=fallback;run.append(text);field.append(run);return field;
}
async function pricingAddFirstPageHeader(zip,doc,payload){
 const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main',R_NS='http://schemas.openxmlformats.org/officeDocument/2006/relationships',relFile=zip.file('word/_rels/document.xml.rels'),section=doc.getElementsByTagNameNS(W_NS,'sectPr')[0],ref=Array.from(section?.getElementsByTagNameNS(W_NS,'headerReference')||[]).find(node=>node.getAttributeNS(W_NS,'type')==='first');
 if(!relFile||!ref)return;
 const rels=new DOMParser().parseFromString(await relFile.async('string'),'application/xml'),id=ref.getAttributeNS(R_NS,'id'),rel=Array.from(rels.getElementsByTagName('Relationship')).find(node=>node.getAttribute('Id')===id),target=rel?.getAttribute('Target');
 if(!target)return;
 const path='word/'+target.replace(/^\.\//,'');
 const file=zip.file(path);if(!file)return;
 const header=new DOMParser().parseFromString(await file.async('string'),'application/xml'),root=header.documentElement,existing=Array.from(root.getElementsByTagNameNS(W_NS,'p')).map(p=>Array.from(p.getElementsByTagNameNS(W_NS,'t')).map(t=>t.textContent||'').join('')).join('\n');
 if(/Page\s+\d+\s+of/i.test(existing))return;
 const makeParagraph=()=>{const p=header.createElementNS(W_NS,'w:p'),pr=header.createElementNS(W_NS,'w:pPr'),spacing=header.createElementNS(W_NS,'w:spacing'),align=header.createElementNS(W_NS,'w:jc');spacing.setAttributeNS(W_NS,'w:before','0');spacing.setAttributeNS(W_NS,'w:after','0');align.setAttributeNS(W_NS,'w:val','left');pr.append(spacing,align);p.append(pr);return p;};
 const page=makeParagraph();page.append(pricingHeaderRun(header,'Page '),pricingHeaderField(header,'PAGE','1'),pricingHeaderRun(header,' of '),pricingHeaderField(header,'NUMPAGES','2'));root.append(page);
 const company=pricingCompany(payload);if(company){const p=makeParagraph();p.append(pricingHeaderRun(header,company,true));root.append(p);}
 zip.file(path,new XMLSerializer().serializeToString(header));
}
function pricingMinimum(text,pax){
 if(!pax)return text;
 return String(text).replace(/(minimum\s+of\s+)\d+(?=\s+(?:people|persons)\b)/i,(_m,prefix)=>prefix+pax);
}
function pricingApplyDocx(doc,t,payload){
 const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const text=node=>{let out='';const walk=n=>{if(n.localName==='t')out+=n.textContent||'';else if(n.localName==='br')out+='\n';else if(n.localName==='tab')out+='\t';else for(const child of n.childNodes||[])walk(child);};walk(node);return out;};
 const setBold=(run,bold)=>{
  const props=Array.from(run.childNodes||[]).find(n=>n.localName==='rPr');
  let p=props;
  if(!p&&bold){p=doc.createElementNS(W_NS,'w:rPr');run.insertBefore(p,run.firstChild);}
  if(!p)return;
  for(const name of ['b','bCs']){
   let el=Array.from(p.childNodes||[]).find(n=>n.localName===name);
   if(bold){if(!el){el=doc.createElementNS(W_NS,'w:'+name);p.appendChild(el);}el.removeAttributeNS(W_NS,'val');}
   else if(el)el.setAttributeNS(W_NS,'w:val','0');
  }
 };
 const setParagraphLines=paragraph=>{
  let lines=[[]];
  for(const run of Array.from(paragraph.getElementsByTagNameNS(W_NS,'r'))){
   for(const node of Array.from(run.childNodes||[])){
    if(node.localName==='br'){lines.push([]);continue;}
    if(node.localName==='t')lines[lines.length-1].push({run,text:node.textContent||''});
   }
  }
  for(const line of lines){
   const isBold=pricingIsEmphasis(line.map(x=>x.text).join(''));
   for(const item of line)setBold(item.run,isBold);
  }
 };
 for(const table of Array.from(doc.getElementsByTagNameNS(W_NS,'tbl'))){
  const rows=Array.from(table.childNodes||[]).filter(n=>n.localName==='tr');
  const cells=rows[0]?Array.from(rows[0].childNodes||[]).filter(n=>n.localName==='tc'):[];
  const headings=cells.map(text).map(s=>s.replace(/\s+/g,' ').trim().toLowerCase());
  const packageRate=headings.some(s=>s==='package')&&headings.some(s=>s==='rate');
  if(!packageRate)continue;
  for(const row of rows.slice(1)){
   const rateCell=Array.from(row.childNodes||[]).filter(n=>n.localName==='tc')[1];
   if(rateCell)for(const paragraph of Array.from(rateCell.getElementsByTagNameNS(W_NS,'p')))setParagraphLines(paragraph);
  }
 }
 const pax=pricingPax(payload);
 if(pax)for(const paragraph of Array.from(doc.getElementsByTagNameNS(W_NS,'p'))){
  const old=text(paragraph),next=pricingMinimum(old,pax);
  if(next!==old&&typeof masterFill==='function')masterFill(paragraph,next,doc);
 }
}
const pricingDocBase=buildDoc;
buildDoc=async function(){
 const blob=await pricingDocBase(),t=templates[state.template];
 if(!t||!['quotation','confirmation'].includes(t.documentType))return blob;
 const zip=await JSZip.loadAsync(blob),file=zip.file('word/document.xml');
 if(!file)return blob;
 const doc=new DOMParser().parseFromString(await file.async('string'),'application/xml');
 pricingApplyDocx(doc,t,state);
 if(t.documentType==='confirmation')await pricingAddFirstPageHeader(zip,doc,state);
 zip.file('word/document.xml',new XMLSerializer().serializeToString(doc));
 return zip.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
};
function pricingMinimumPdf(node,pax){
 if(Array.isArray(node)){for(const item of node)pricingMinimumPdf(item,pax);return;}
 if(!node||typeof node!=='object')return;
 if(typeof node.text==='string')node.text=pricingMinimum(node.text,pax);
 else if(Array.isArray(node.text))node.text=node.text.map(item=>typeof item==='string'?pricingMinimum(item,pax):({...item,text:pricingMinimum(item?.text||'',pax)}));
 if(node.stack)pricingMinimumPdf(node.stack,pax);
 if(node.columns)pricingMinimumPdf(node.columns,pax);
 if(node.table?.body)pricingMinimumPdf(node.table.body,pax);
}
function pricingFormatPdfCell(node){
 if(Array.isArray(node)){for(const item of node)pricingFormatPdfCell(item);return;}
 if(!node||typeof node!=='object')return;
 if(typeof node.text==='string')node.bold=pricingIsEmphasis(node.text);
 else if(Array.isArray(node.text)){
  const runs=[];
  for(const item of node.text){
   const run=typeof item==='string'?{text:item}:{...item};
   const pieces=String(run.text||'').split(/(\n)/);
   for(const piece of pieces){if(!piece)continue;runs.push({...run,text:piece,bold:piece==='\n'?run.bold:pricingIsEmphasis(piece)});}
  }
  node.text=runs;
 }
 if(node.stack)pricingFormatPdfCell(node.stack);
 if(node.columns)pricingFormatPdfCell(node.columns);
 if(node.table?.body)pricingFormatPdfCell(node.table.body);
}
function pricingFindRateTables(node){
 if(Array.isArray(node)){for(const item of node)pricingFindRateTables(item);return;}
 if(!node||typeof node!=='object')return;
 if(node.table?.body){
  const body=node.table.body,headings=(body[0]||[]).map(pricingText).map(s=>s.replace(/\s+/g,' ').trim().toLowerCase());
  if(headings.some(s=>s==='package')&&headings.some(s=>s==='rate'))for(const row of body.slice(1))pricingFormatPdfCell(row?.[1]);
  for(const row of body)for(const cell of row||[])pricingFindRateTables(cell);
 }
 if(node.stack)pricingFindRateTables(node.stack);
 if(node.columns)pricingFindRateTables(node.columns);
}
const pricingPdfBase=quotePdfDefinition;
quotePdfDefinition=function(t,payload){
 const definition=pricingPdfBase(t,payload);
 if(!definition||!['quotation','confirmation'].includes(t?.documentType))return definition;
 pricingMinimumPdf(definition.content,pricingPax(payload));
 pricingFindRateTables(definition.content);
 return definition;
};
`;
