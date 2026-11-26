export const festivalDays = ['2027-05-14', '2027-05-15', '2027-05-16'];
export const categories = {
  music: { da: 'Musik', en: 'Music' },
  art: { da: 'Kunst & kultur', en: 'Art & culture' },
  food: { da: 'Mad & drikke', en: 'Food & drink' },
  community: { da: 'Fællesskab', en: 'Community' },
  family: { da: 'Børn & familie', en: 'Kids & family' },
  sports: { da: 'Sport & bevægelse', en: 'Sports & movement' },
  other: { da: 'Andet', en: 'Other' },
};
export const blankEvent = () => ({
  day: festivalDays[0], start: '', end: '', category: 'music', titleDa: '', titleEn: '',
  venue: '', address: '', descriptionDa: '', descriptionEn: '', link: '',
});
export function validEvents(events) {
  const keys = Object.keys(blankEvent());
  return Object.keys(events).length <= 500 && Object.entries(events).every(([id, event]) =>
    /^[a-f0-9-]{36}$/.test(id) && event && typeof event === 'object' && !Array.isArray(event) &&
    keys.every(key => typeof event[key] === 'string' && event[key].length <= (key.startsWith('description') ? 3000 : 300)) &&
    Object.keys(event).every(key => keys.includes(key)) &&
    festivalDays.includes(event.day) && Object.hasOwn(categories, event.category) &&
    [event.start, event.end].every(time => !time || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) &&
    (!event.link || /^https?:\/\/[^\s]+$/i.test(event.link)));
}
export function completeEvent(event) {
  return Boolean(event.titleDa.trim() && event.titleEn.trim() && event.venue.trim() && event.start);
}
export function publishedEvents(events = {}) {
  return Object.entries(events).filter(([, event]) => completeEvent(event))
    .map(([id, event]) => ({ id, ...event }))
    .sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start));
}
