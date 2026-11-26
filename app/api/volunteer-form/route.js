import { load } from 'cheerio';
const original = 'https://www.48timerfestival.dk';

export async function GET(request) {
  const path = new URL(request.url).searchParams.get('path') ?? '';
  if (!/^\/(?:en\/)?bliv-frivillig\/(?:fotograf-team|pr-kommunikation|teknikservice)\/$/.test(path)) {
    return Response.json({error:'Unknown volunteer route'},{status:404});
  }
  try {
    const response = await fetch(original+path,{cache:'no-store',signal:AbortSignal.timeout(7000)});
    if (!response.ok) throw Error('Original form unavailable');
    const $=load(await response.text());
    const form=$('#main-content form.et_pb_contact_form').first();
    if (!form.length) throw Error('Original form unavailable');
    const hidden={};
    const allowed=['et_pb_contactform_submit_0','_wpnonce-et-pb-contact-form-submitted-0','_wp_http_referer','trp-form-language'];
    form.find('input[type="hidden"]').each((_,node)=>{
      const input=$(node),name=input.attr('name');
      if(allowed.includes(name))hidden[name]=input.attr('value')??'';
    });
    if (!hidden['_wpnonce-et-pb-contact-form-submitted-0']) throw Error('Original form unavailable');
    const question=form.find('.et_pb_contact_captcha_question').text().trim();
    if (form.find('input[name="et_pb_contact_captcha_0"]').length && !question) throw Error('Verification question unavailable');
    return Response.json({action:original+path,hidden,question},{headers:{'Cache-Control':'no-store'}});
  }catch{
    return Response.json({error:'Unable to load the original volunteer form'},{status:503});
  }
}
