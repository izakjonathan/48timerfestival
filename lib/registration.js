const googleForm = 'https://docs.google.com/forms/d/e/1FAIpQLSesX0h6Yt-ntVELaqKKa_OOcK7HpeObnViNx4nepZL5zpsruw';

export function renderRegistration($, english) {
  const form = $('<form class="festival-registration" method="post"></form>').attr('action', googleForm + '/formResponse');
  const label = (da, en) => english ? en : da;
  form.append($('<h2></h2>').text(label('Tilmeld dit arrangement', 'Register your event')));
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
  for (const [id, da, en, type, required, max] of fields) {
    const control = $(type === 'textarea' ? '<textarea rows="4"></textarea>' : '<input>').attr('name', 'entry.' + id);
    if (type !== 'textarea') control.attr('type', type);
    if (required) control.attr('required', '');
    if (max) control.attr('maxlength', max);
    form.append($('<label></label>').text(label(da, en) + (required ? ' *' : '')).append(control));
  }
  const date = $('<input type="datetime-local" data-registration-date>');
  form.append($('<label></label>').text(label('Dato og tidspunkt', 'Event date and time')).append(date));
  for (const part of ['year', 'month', 'day', 'hour', 'minute']) {
    form.append($('<input type="hidden" disabled>').attr('name', 'entry.851811512_' + part));
  }
  for (const [id, da, en] of [
    [529466372, 'Er arrangementet egnet til børn og familier?', 'Is the event suitable for children and families?'],
    [1699270401, 'Kræves der tilmelding?', 'Is advance registration required?'],
  ]) {
    const select = $('<select required></select>').attr('name', 'entry.' + id);
    select.append($('<option value=""></option>').text(label('Vælg', 'Choose')));
    select.append($('<option value="Ja"></option>').text(label('Ja', 'Yes')));
    select.append($('<option value="Nej"></option>').text(label('Nej', 'No')));
    form.append($('<label></label>').text(label(da, en) + ' *').append(select));
  }
  form.append($('<button type="submit"></button>').text(label('Send tilmelding', 'Submit registration')));
  form.append($('<p></p>').append($('<a></a>').attr('href', googleForm + '/viewform')
    .text(label('Åbn formularen hos Google', 'Open the form on Google'))));
  $('iframe[src^="' + googleForm + '"]').replaceWith(form);
}
