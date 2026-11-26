import { blankEvent, categories, completeEvent, validEvents } from './program.js';
export const columns = ['day','start','end','category','titleDa','titleEn','venue','address','descriptionDa','descriptionEn','link'];
export const template = columns.join(',')+'\r\n';

function parseRows(text,delimiter) {
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){
      if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}
      else if(ch==='"')quoted=false;
      else field+=ch;
    }else if(ch==='"'&&!field){quoted=true;}
    else if(ch===delimiter){row.push(field);field='';}
    else if(ch==='\r'||ch==='\n'){
      if(ch==='\r'&&text[i+1]==='\n')i++;
      row.push(field);if(row.some(value=>value.trim()))rows.push(row);row=[];field='';
    }else field+=ch;
  }
  if(quoted)throw Error('A quoted cell is unfinished.');
  row.push(field);if(row.some(value=>value.trim()))rows.push(row);
  return rows;
}
const identity = event => [event.day,event.start,event.titleDa.trim().toLowerCase(),event.venue.trim().toLowerCase()].join('|');
function normalizeDate(value) {
  const match=value.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if(match)return match[3]+'-'+match[2].padStart(2,'0')+'-'+match[1].padStart(2,'0');
  return value;
}
function normalizeTime(value) {
  const match=value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return match?match[1].padStart(2,'0')+':'+match[2]:value;
}
export function importProgramme(text,dates,existing={}) {
  const errors=[],events=[],duplicate=[];
  const cleaned=text.replace(/^\uFEFF/,'');
  const first=cleaned.split(/\r?\n/)[0];
  const delimiter=first.includes('\t')?'\t':first.includes(';')?';':',';
  let rows;
  try{rows=parseRows(cleaned,delimiter);}catch(error){return {events,errors:[error.message],duplicate};}
  if(!rows.length)return {events,errors:['Paste a table or choose a CSV/TSV file.'],duplicate};
  const headers=rows.shift().map(value=>value.trim().toLowerCase());
  const keyNames=columns.map(key=>key.toLowerCase());
  if(headers.length!==new Set(headers).size||!['day','start','category','titleda','titleen','venue'].every(key=>headers.includes(key)))return {events,errors:['Required columns: day, start, category, titleDa, titleEn, venue. Use the template.'],duplicate};
  const seen=new Set(Object.values(existing).map(identity));
  for(const [index,row] of rows.entries()){
    const event=blankEvent(dates);
    headers.forEach((header,i)=>{const key=columns[keyNames.indexOf(header)];if(key)event[key]=(row[i]??'').trim();});
    event.day=normalizeDate(event.day);event.start=normalizeTime(event.start);event.end=normalizeTime(event.end);
    const label=event.category.toLowerCase();
    event.category=Object.keys(categories).find(key=>key===label||Object.values(categories[key]).some(name=>name.toLowerCase()===label))??label;
    if(!completeEvent(event)||!validEvents({'00000000-0000-0000-0000-000000000000':event},dates,true)){errors.push('Row '+(index+2)+': check required fields, dates, times and category.');continue;}
    const id=identity(event);
    if(seen.has(id)){duplicate.push(index+2);continue;}
    seen.add(id);events.push(event);
  }
  if(events.length+Object.keys(existing).length>500)errors.push('The programme can contain up to 500 events.');
  return {events,errors,duplicate};
}
