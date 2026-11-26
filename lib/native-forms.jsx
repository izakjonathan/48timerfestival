'use client';
import React, { useEffect, useState } from 'react';
import { localized } from './native-chrome.jsx';

const googleForm = 'https://docs.google.com/forms/d/e/1FAIpQLSesX0h6Yt-ntVELaqKKa_OOcK7HpeObnViNx4nepZL5zpsruw';

export function EventRegistration({ lang }) {
  const [date,setDate] = useState('');
  const parts = date.split(/[-T:]/);
  const fields = [
    [1571165280, 'Arrangementets navn', 'Event name', 'text', true],
    [277525198, 'Tekst til festivalprogrammet', 'Festival programme description', 'textarea', false, 650],
    [61718688, 'Beskriv din idé og eventuelle behov for koordinering', 'Describe your idea and any coordination needs', 'textarea'],
    [1224255946, 'Arrangørnavn til programmet', 'Organiser name for the programme', 'text', true],
    [1438864623, 'Sted', 'Venue', 'text', true],
    [1945692771, 'Adresse', 'Address', 'text', true],
    [1284428325, 'Telefon', 'Phone', 'tel', true],
    [2136359849, 'Link til Facebook-event', 'Facebook event link', 'url'],
  ];
  return <form className="fn-form festival-registration" method="post" action={googleForm+'/formResponse'}>
    <h2>{localized(lang,'Tilmeld dit arrangement','Register your event')}</h2>
    {fields.map(([id,da,en,type,required,max])=><label key={id}>{localized(lang,da,en)}{required?' *':''}
      {type==='textarea'?<textarea name={'entry.'+id} rows={4} required={required} maxLength={max}/>:<input name={'entry.'+id} type={type} required={required}/>}
    </label>)}
    <label>{localized(lang,'Dato og tidspunkt','Event date and time')}<input type="datetime-local" value={date} onInput={event=>setDate(event.currentTarget.value)} onChange={event=>setDate(event.target.value)}/></label>
    {['year','month','day','hour','minute'].map((part,index)=><input type="hidden" key={part} name={'entry.851811512_'+part} value={parts[index]??''} disabled={!date}/>)}
    {[[529466372,'Er arrangementet egnet til børn og familier?','Is the event suitable for children and families?'],[1699270401,'Kræves der tilmelding?','Is advance registration required?']].map(([id,da,en])=><label key={id}>{localized(lang,da,en)} *<select name={'entry.'+id} required defaultValue=""><option value="">{localized(lang,'Vælg','Choose')}</option><option value="Ja">{localized(lang,'Ja','Yes')}</option><option value="Nej">{localized(lang,'Nej','No')}</option></select></label>)}
    <button className="fn-button" type="submit">{localized(lang,'Send tilmelding','Submit registration')}</button>
    <a className="fn-text-link" href={googleForm+'/viewform'}>{localized(lang,'Åbn formularen hos Google','Open the form on Google')}</a>
  </form>;
}

const teams = [
  ['PR & Kommunikation','PR & Kommunikation','PR & communication','pr-kommunikation'],
  ['Fotograf-team','Fotograf-team','Photo team','fotograf-team'],
  ['Event-team','Event-team','Event team',''],
  ['Teknikservice','Teknikservice','Technical team','teknikservice'],
];

export function VolunteerRegistration({lang,route}) {
  const [challenge,setChallenge]=useState(null);
  const [failed,setFailed]=useState(false);
  const defaultTeam=teams.find(team=>team[3]&&route.includes('/'+team[3]+'/'))?.[0]??teams[0][0];
  const [selected,setSelected]=useState([defaultTeam]);
  useEffect(()=>{
    const abort=new AbortController();
    fetch('/api/volunteer-form?path='+encodeURIComponent(route),{signal:abort.signal,cache:'no-store'})
      .then(response=>{if(!response.ok)throw Error();return response.json();})
      .then(setChallenge).catch(()=>{if(!abort.signal.aborted)setFailed(true);});
    return ()=>abort.abort();
  },[route]);
  const original='https://www.48timerfestival.dk'+route;
  return <form className="fn-form fn-volunteer-form" action={challenge?.action??original} method="post">
    <label>{localized(lang,'Navn','Name')} *<input name="et_pb_contact_navn_0" autoComplete="name" required/></label>
    <label>{localized(lang,'E-mailadresse','Email address')} *<input name="et_pb_contact_email_0" type="email" autoComplete="email" required/></label>
    <label>{localized(lang,'Telefonnummer','Phone number')} *<input name="et_pb_contact_telefonnummer_0" type="tel" autoComplete="tel" required/></label>
    <fieldset className="fn-form-teams"><legend>Team *</legend>{teams.map(([value,da,en])=><label key={value}><input type="checkbox" checked={selected.includes(value)} onChange={event=>setSelected(previous=>event.target.checked?[...previous,value]:previous.filter(item=>item!==value))}/>{localized(lang,da,en)}</label>)}</fieldset>
    <input type="hidden" name="et_pb_contact_team_0" value={selected.join(', ')}/>
    <label>{localized(lang,'Besked','Message')} *<textarea name="et_pb_contact_besked_0" rows={5} required/></label>
    {challenge ? <>
      {Object.entries(challenge.hidden).map(([name,value])=><input key={name} type="hidden" name={name} value={value}/>)}
      {challenge.question && <label>{localized(lang,'Kontrolspørgsmål','Verification question')}: {challenge.question} = ?<input name="et_pb_contact_captcha_0" inputMode="numeric" autoComplete="off" required/></label>}
    </> : <p role="status">{failed?localized(lang,'Tilmeldingsformularen kunne ikke indlæses. Brug det oprindelige link nedenfor.','The registration form could not be loaded. Use the original form link below.'):localized(lang,'Indlæser tilmeldingsformular…','Loading registration form…')}</p>}
    <button className="fn-button" type="submit" name="et_builder_submit_button" disabled={!challenge||!selected.length}>{localized(lang,'Indsend','Submit')}</button>
    <a className="fn-text-link" href={original}>{localized(lang,'Åbn den oprindelige tilmeldingsformular','Open the original registration form')}</a>
  </form>;
}
