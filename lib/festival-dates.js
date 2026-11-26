export const defaultDates = { start:'2027-05-14', end:'2027-05-16' };
const iso = /^\d{4}-\d{2}-\d{2}$/;
export function validDate(value) {
  if(typeof value!=='string'||!iso.test(value))return false;
  const date=new Date(value+'T00:00:00Z');
  return Number.isFinite(date.valueOf())&&date.toISOString().slice(0,10)===value;
}
export function validFestivalDates(dates) {
  if(!dates||typeof dates!=='object'||Array.isArray(dates))return false;
  if(Object.keys(dates).some(key=>!['start','end'].includes(key))||!validDate(dates.start)||!validDate(dates.end))return false;
  const duration=(Date.parse(dates.end)-Date.parse(dates.start))/86400000;
  return duration>=0&&duration<=13;
}
export function festivalDates(settings={}) {
  return validFestivalDates(settings.festivalDates)?settings.festivalDates:defaultDates;
}
export function festivalDaysFor(dates=defaultDates) {
  if(!validFestivalDates(dates))return festivalDaysFor(defaultDates);
  const start=Date.parse(dates.start),end=Date.parse(dates.end);
  return Array.from({length:(end-start)/86400000+1},(_,i)=>new Date(start+i*86400000).toISOString().slice(0,10));
}
export function formatDates(dates=defaultDates,lang='en',includeYear=true) {
  const start=new Date(dates.start+'T12:00:00Z'),end=new Date(dates.end+'T12:00:00Z');
  const month = date=>new Intl.DateTimeFormat(lang==='da'?'da-DK':'en-GB',{month:'long',timeZone:'UTC'}).format(date);
  const d1=start.getUTCDate(),d2=end.getUTCDate(),year=end.getUTCFullYear(),dot=lang==='da'?'.':'';
  if(dates.start===dates.end)return d1+dot+' '+month(start)+(includeYear?' '+year:'');
  if(start.getUTCMonth()===end.getUTCMonth()&&start.getUTCFullYear()===year)return d1+dot+'–'+d2+dot+' '+month(end)+(includeYear?' '+year:'');
  return d1+dot+' '+month(start)+(start.getUTCFullYear()!==year?' '+start.getUTCFullYear():'')+' – '+d2+dot+' '+month(end)+(includeYear?' '+year:'');
}
export function countdownDate(dates=defaultDates) {
  const date=new Date(dates.start+'T00:00:00Z');
  const offset=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Copenhagen',timeZoneName:'longOffset'}).formatToParts(date).find(part=>part.type==='timeZoneName').value.replace('GMT','')||'+00:00';
  return dates.start+'T00:00:00'+offset;
}
// Update the source copy referring to the current festival edition when dates are edited.
export function refreshDateCopy(text,dates) {
  if(typeof text!=='string'||(dates.start===defaultDates.start&&dates.end===defaultDates.end))return text;
  return text.replace(/\b2027\b(?=[^!?]{0,100}14\.?\s*[-–])/g,dates.start.slice(0,4)).replace(/14\.?\s*[-–]\s*16\.?\s*(maj|may)(?:\s+2027)?/gi,(match,month)=>formatDates(dates,month.toLowerCase()==='maj'?'da':'en',/2027/.test(match)));
}
