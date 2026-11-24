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
 const keys=Object.keys(values).filter(k=>/^event3_/.test(k)).sort();
 const paxValue=keys.map(k=>String(values[k]||'')).find(value=>/\d+\s*(?:persons?|people|pax)\b/i.test(value));
 const fallback=keys.map(k=>values[k]).reverse().find(value=>/\d/.test(String(value||'')));
 const match=String(paxValue||fallback||'').match(/\d+/);
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
 const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main',R_NS='http://schemas.openxmlformats.org/officeDocument/2006/relationships',relFile=zip.file('word/_rels/document.xml.rels'),section=doc.getElementsByTagNameNS(W_NS,'sectPr')[0],refs=Array.from(section?.getElementsByTagNameNS(W_NS,'headerReference')||[]);
 if(!relFile||!refs.length)return;
 const rels=new DOMParser().parseFromString(await relFile.async('string'),'application/xml'),company=pricingCompany(payload),done=new Set();
 const normalizePath=target=>{const raw=String(target||'').replace(/\\/g,'/'),base=raw.startsWith('/')?raw.slice(1):raw.startsWith('word/')?raw:'word/'+raw,parts=base.split('/'),out=[];for(const part of parts){if(!part||part==='.')continue;if(part==='..')out.pop();else out.push(part);}return out.join('/');};
 const makeParagraph=header=>{const p=header.createElementNS(W_NS,'w:p'),pr=header.createElementNS(W_NS,'w:pPr'),spacing=header.createElementNS(W_NS,'w:spacing'),align=header.createElementNS(W_NS,'w:jc');spacing.setAttributeNS(W_NS,'w:before','0');spacing.setAttributeNS(W_NS,'w:after','0');align.setAttributeNS(W_NS,'w:val','left');pr.append(spacing,align);p.append(pr);return p;};
 for(const ref of refs){
  const id=ref.getAttributeNS(R_NS,'id'),rel=Array.from(rels.getElementsByTagName('Relationship')).find(node=>node.getAttribute('Id')===id),path=normalizePath(rel?.getAttribute('Target'));
  if(!path||done.has(path))continue;done.add(path);
  const file=zip.file(path);if(!file)continue;
  const header=new DOMParser().parseFromString(await file.async('string'),'application/xml'),root=header.documentElement,existing=Array.from(root.getElementsByTagNameNS(W_NS,'p')).map(p=>Array.from(p.getElementsByTagNameNS(W_NS,'t')).map(t=>t.textContent||'').join('')).join('\n');
  let changed=false;
  if(!/Page\s+\d+\s+of/i.test(existing)){const page=makeParagraph(header);page.append(pricingHeaderRun(header,'Page '),pricingHeaderField(header,'PAGE','1'),pricingHeaderRun(header,' of '),pricingHeaderField(header,'NUMPAGES','2'));root.append(page);changed=true;}
  if(company&&!existing.toLowerCase().includes(company.toLowerCase())){const p=makeParagraph(header);p.append(pricingHeaderRun(header,company,true));root.append(p);changed=true;}
  if(changed)zip.file(path,new XMLSerializer().serializeToString(header));
 }
}
async function pricingEnsureDefaultHeader(zip,doc,payload){
 const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main',R_NS='http://schemas.openxmlformats.org/officeDocument/2006/relationships',relPath='word/_rels/document.xml.rels',relFile=zip.file(relPath),section=doc.getElementsByTagNameNS(W_NS,'sectPr')[0];
 if(!relFile||!section)return;
 const rels=new DOMParser().parseFromString(await relFile.async('string'),'application/xml'),relRoot=rels.documentElement;
 const path='word/header-confirmation-running.xml',target='header-confirmation-running.xml',type=R_NS+'/header';
 let id='rIdConfirmationDefaultHeader',suffix=1;while(Array.from(rels.getElementsByTagName('Relationship')).some(rel=>rel.getAttribute('Id')===id))id='rIdConfirmationDefaultHeader'+suffix++;
 const relation=rels.createElementNS(relRoot.namespaceURI,'Relationship');relation.setAttribute('Id',id);relation.setAttribute('Type',type);relation.setAttribute('Target',target);relRoot.append(relation);
 for(const kind of ['default','first']){let ref=Array.from(section.getElementsByTagNameNS(W_NS,'headerReference')).find(item=>item.getAttributeNS(W_NS,'type')===kind);if(!ref){ref=doc.createElementNS(W_NS,'w:headerReference');ref.setAttributeNS(W_NS,'w:type',kind);section.insertBefore(ref,section.firstChild);}ref.setAttributeNS(R_NS,'r:id',id);}
 const header=new DOMParser().parseFromString('<w:hdr xmlns:w="'+W_NS+'" xmlns:r="'+R_NS+'"/>','application/xml'),root=header.documentElement;
 const p=header.createElementNS(W_NS,'w:p'),pr=header.createElementNS(W_NS,'w:pPr'),spacing=header.createElementNS(W_NS,'w:spacing'),align=header.createElementNS(W_NS,'w:jc');spacing.setAttributeNS(W_NS,'w:before','0');spacing.setAttributeNS(W_NS,'w:after','0');align.setAttributeNS(W_NS,'w:val','left');pr.append(spacing,align);p.append(pr);p.append(pricingHeaderRun(header,'Page '),pricingHeaderField(header,'PAGE','1'),pricingHeaderRun(header,' of '),pricingHeaderField(header,'NUMPAGES','2'));root.append(p);
 const company=pricingCompany(payload);if(company){const cp=header.createElementNS(W_NS,'w:p'),cpr=header.createElementNS(W_NS,'w:pPr'),cspacing=header.createElementNS(W_NS,'w:spacing');cspacing.setAttributeNS(W_NS,'w:before','0');cspacing.setAttributeNS(W_NS,'w:after','0');cpr.append(cspacing);cp.append(cpr,pricingHeaderRun(header,company,true));root.append(cp);}
 const typesFile=zip.file('[Content_Types].xml');if(typesFile){const types=new DOMParser().parseFromString(await typesFile.async('string'),'application/xml'),typesRoot=types.documentElement,exists=Array.from(types.getElementsByTagName('Override')).some(item=>item.getAttribute('PartName')==='/'+path);if(!exists){const override=types.createElementNS(typesRoot.namespaceURI,'Override');override.setAttribute('PartName','/'+path);override.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml');typesRoot.append(override);zip.file('[Content_Types].xml',new XMLSerializer().serializeToString(types));}}
 zip.file(path,new XMLSerializer().serializeToString(header));zip.file(relPath,new XMLSerializer().serializeToString(rels));
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
  // Let Word size the package/rate table to the available page width and give
  // the longer rate text a little more room than the package name.
  const tableProps=Array.from(table.childNodes||[]).find(n=>n.localName==='tblPr');
  if(tableProps){
   let width=Array.from(tableProps.childNodes||[]).find(n=>n.localName==='tblW');
   if(!width){width=doc.createElementNS(W_NS,'w:tblW');tableProps.insertBefore(width,tableProps.firstChild);}
   width.setAttributeNS(W_NS,'w:w','5000');width.setAttributeNS(W_NS,'w:type','pct');
   let layout=Array.from(tableProps.childNodes||[]).find(n=>n.localName==='tblLayout');
   if(!layout){layout=doc.createElementNS(W_NS,'w:tblLayout');tableProps.appendChild(layout);}
   layout.setAttributeNS(W_NS,'w:type','autofit');
  }
  const grid=Array.from(table.getElementsByTagNameNS(W_NS,'tblGrid'))[0];
  const columns=Array.from(grid?.childNodes||[]).filter(n=>n.localName==='gridCol');
  const columnTotal=columns.reduce((sum,column)=>sum+(Number(column.getAttributeNS(W_NS,'w'))||0),0)||10000;
  const firstWidth=Math.round(columnTotal*.4),secondWidth=columnTotal-firstWidth;
  if(columns.length===2){columns[0].setAttributeNS(W_NS,'w:w',String(firstWidth));columns[1].setAttributeNS(W_NS,'w:w',String(secondWidth));}
  for(const row of rows) {
   const cells=Array.from(row.childNodes||[]).filter(n=>n.localName==='tc');
   if(cells.length!==2)continue;
   for(const [index,cell] of cells.entries()){
    const props=Array.from(cell.childNodes||[]).find(n=>n.localName==='tcPr');
    if(!props)continue;
    let cellWidth=Array.from(props.childNodes||[]).find(n=>n.localName==='tcW');
    if(!cellWidth){cellWidth=doc.createElementNS(W_NS,'w:tcW');props.insertBefore(cellWidth,props.firstChild);}
    cellWidth.setAttributeNS(W_NS,'w:w',String(index===0?firstWidth:secondWidth));cellWidth.setAttributeNS(W_NS,'w:type','dxa');
   }
  }
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
async function pricingFixQuotationHeaderLogos(zip,doc){
 const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const WP_NS='http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
 const relsFile=zip.file('word/_rels/document.xml.rels');
 if(!relsFile)return;
 const rels=new DOMParser().parseFromString(await relsFile.async('string'),'application/xml');
 const ids=new Set(Array.from(doc.getElementsByTagNameNS(W_NS,'headerReference')).map(n=>n.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')).filter(Boolean));
 const targets=Array.from(rels.getElementsByTagName('Relationship')).filter(r=>ids.has(r.getAttribute('Id'))&&/\/header$/.test(r.getAttribute('Type')||'')).map(r=>r.getAttribute('Target')).filter(Boolean);
 const pathFor=target=>{const raw=String(target).replace(/\\/g,'/'),parts=(raw.startsWith('/')?raw.slice(1):raw.startsWith('word/')?raw:'word/'+raw).split('/'),out=[];for(const part of parts){if(!part||part==='.')continue;if(part==='..')out.pop();else out.push(part);}return out.join('/');};
 for(const target of new Set(targets)){
  const path=pathFor(target),file=zip.file(path);if(!file)continue;
  const header=new DOMParser().parseFromString(await file.async('string'),'application/xml');
  const anchors=Array.from(header.getElementsByTagNameNS(WP_NS,'anchor')).filter(a=>a.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main','blip').length);
  if(anchors.length<2)continue;
  anchors.sort((a,b)=>Number(a.getElementsByTagNameNS(WP_NS,'posOffset')[0]?.textContent||0)-Number(b.getElementsByTagNameNS(WP_NS,'posOffset')[0]?.textContent||0));
  for(const [index,anchor] of [anchors[0],anchors.at(-1)].entries()){
   const horizontal=anchor.getElementsByTagNameNS(WP_NS,'positionH')[0];if(!horizontal)continue;
   horizontal.setAttribute('relativeFrom','margin');
   for(const child of Array.from(horizontal.childNodes||[]))if(child.localName==='posOffset'||child.localName==='align')child.remove();
   const align=header.createElementNS(WP_NS,'wp:align');align.textContent=index===0?'left':'right';horizontal.appendChild(align);
  }
  zip.file(path,new XMLSerializer().serializeToString(header));
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
 if(t.documentType==='quotation')await pricingFixQuotationHeaderLogos(zip,doc);
 if(t.documentType==='confirmation'){await pricingAddFirstPageHeader(zip,doc,state);await pricingEnsureDefaultHeader(zip,doc,state);}
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
const pricingQuotationLayoutRender=render;
render=async function(token){
 await pricingQuotationLayoutRender(token);
 if(token!==revision||templates[state.template]?.documentType!=='quotation')return;
 for(const page of Array.from($('preview').querySelectorAll('section.source-docx'))){
  for(const table of Array.from(page.querySelectorAll('table'))){
   const first=table.rows?.[0],headings=Array.from(first?.cells||[]).map(cell=>(cell.textContent||'').replace(/\s+/g,' ').trim().toLowerCase());
   if(!headings.includes('package')||!headings.includes('rate'))continue;
   table.style.width='100%';table.style.tableLayout='auto';
   for(const row of Array.from(table.rows))if(row.cells.length===2){row.cells[0].style.width='40%';row.cells[1].style.width='60%';}
   for(const row of Array.from(table.rows).slice(1)){
    const rate=row.cells?.[1];if(!rate)continue;
    for(const paragraph of Array.from(rate.querySelectorAll('p,div'))){
     const line=(paragraph.textContent||'').trim();
     if(pricingIsEmphasis(line))paragraph.style.fontWeight='700';
    }
   }
  }
  const pageRect=page.getBoundingClientRect(),logos=Array.from(page.querySelectorAll('img')).map(image=>({image,rect:image.getBoundingClientRect()})).filter(item=>item.rect.width>=42&&item.rect.top<pageRect.top+150).sort((a,b)=>a.rect.left-b.rect.left);
  if(logos.length>=2){
   page.style.position='relative';
   for(const [index,item] of [logos[0],logos.at(-1)].entries()){
    const image=item.image,displayedWidth=Math.max(86,Math.min(132,item.rect.width));
    page.appendChild(image);image.style.setProperty('position','absolute','important');image.style.setProperty('top','24px','important');image.style.setProperty('left',index===0?'64px':'auto','important');image.style.setProperty('right',index===0?'auto':'64px','important');image.style.setProperty('width',displayedWidth+'px','important');image.style.setProperty('height','auto','important');image.style.setProperty('z-index','6','important');
   }
  }
 }
};
const pricingPreviewRenderBase=render;
render=async function(token){
 await pricingPreviewRenderBase(token);
 if(token!==revision)return;
 const template=templates[state.template];
 if(template?.documentType!=='confirmation'||!isMaster(template))return;
 const pages=Array.from($('preview').querySelectorAll('section.source-docx'));
 const company=pricingCompany(state);
 pages.forEach((page,index)=>{
  let header=page.querySelector('.pricing-confirmation-page-header');
  if(!header){header=document.createElement('div');header.className='pricing-confirmation-page-header';page.insertBefore(header,page.firstChild);}
  header.replaceChildren();
  const pageText=document.createElement('div');pageText.textContent='Page '+(index+1)+' of '+pages.length;header.appendChild(pageText);
  if(company){const companyText=document.createElement('div');companyText.textContent=company;companyText.style.fontWeight='700';header.appendChild(companyText);}
  Object.assign(header.style,{display:'block',position:'relative',zIndex:'5',textAlign:'left',fontFamily:'Aptos, Arial, sans-serif',fontSize:'8pt',lineHeight:'1.15',color:'#837754',margin:'0 0 14px 0',pointerEvents:'none'});
 });
};
`;
