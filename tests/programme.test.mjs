import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importProgramme } from '../lib/program-import.js';
import { formatDates,countdownDate,validFestivalDates,festivalDaysFor } from '../lib/festival-dates.js';
const dates={start:'2028-05-12',end:'2028-05-14'};
test('valid dates, localized labels, Copenhagen countdown',()=>{
  assert.equal(validFestivalDates(dates),true);
  assert.equal(validFestivalDates({start:'2028-02-30',end:'2028-03-01'}),false);
  assert.equal(validFestivalDates({start:'2028-05-12',end:'2028-05-30'}),false);
  assert.equal(formatDates(dates),'12–14 May 2028');
  assert.equal(formatDates(dates,'da'),'12.–14. maj 2028');
  assert.equal(countdownDate(dates),'2028-05-12T00:00:00+02:00');
  assert.deepEqual(festivalDaysFor(dates),['2028-05-12','2028-05-13','2028-05-14']);
});
test('TSV imports Danish dates and skips duplicates',()=>{
  const result=importProgramme('day\tstart\tcategory\ttitleDa\ttitleEn\tvenue\n12.05.2028\t9:00\tMusik\tTest dansk\tTest English\tVenue\n12.05.2028\t9:00\tMusic\tTest dansk\tTest English\tVenue',dates);
  assert.equal(result.events.length,1);assert.equal(result.events[0].start,'09:00');
  assert.deepEqual(result.duplicate,[3]);assert.equal(result.errors.length,0);
  assert.equal(importProgramme('day,start,category,titleDa,titleEn,venue\n2028-05-12,09:00,Music,Test dansk,Test English,Venue',dates,{id:result.events[0]}).duplicate.length,1);
});
test('CSV preserves quoted fields and rejects non-festival dates',()=>{
  const result=importProgramme('day,start,category,titleDa,titleEn,venue,descriptionEn\n2028-05-12,09:00,Music,DA,EN,"Venue, Nørrebro","First line\nSecond line"\n2028-05-15,09:00,Music,DA,EN,Venue,',dates);
  assert.equal(result.events.length,1);assert.equal(result.events[0].venue,'Venue, Nørrebro');assert.equal(result.events[0].descriptionEn,'First line\nSecond line');assert.equal(result.errors.length,1);
});
