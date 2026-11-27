import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newBlock,validBlocks,validSEO,validLibrary,validFocus,historyList,recordPublication,clientState,mediaLibrary} from '../lib/editorial.js';
const route='/en/',url='/media/00000000-0000-0000-0000-000000000000.webp';
test('block types, safe links and focus validation',()=>{
 const b=newBlock('split');assert(validBlocks({[route]:[b]},[route]));
 assert(validBlocks({[route]:[{...b,image:url,href:'/en/program/'}]},[route]));
 assert(!validBlocks({[route]:[{...b,href:'javascript:alert(1)'}]},[route]));
 assert(!validBlocks({[route]:[{...b,color:'#ffffff'}]},[route]));
 assert(!validBlocks({[route]:[{...b,focus:{x:101,y:50}}]},[route]));
 assert(!validBlocks({[route]:[b,b]},[route]));
 assert(validFocus({x:0,y:100}));
});
test('reusable images and SEO validation',()=>{
 assert(validLibrary({[url]:'Poster'}));assert(!validLibrary({'https://bad.example/a.png':'test'}));
 assert(validSEO({[route]:{title:'Homepage',description:'Festival',image:url}},[route]));
 assert(!validSEO({[route]:{title:42}},[route]));
 assert(!validSEO({[route]:{image:'javascript:alert(1)'}},[route]));
 assert.equal(mediaLibrary({[route]:{poster:{value:url,label:'Poster'}}},{})[url],'Poster');
});
test('publication history preserves old and rollback version, limits entries and avoids exposing snapshots',()=>{
 const state={revision:23,published:{a:1},previous:{a:0}};
 assert.equal(historyList(state).length,1);
 recordPublication(state,{a:2},'2026-11-26T00:00:00Z');
 assert.deepEqual(state.previous,{a:1});assert.equal(state.history.length,2);
 const old=state.history[0].document;state.revision++;
 recordPublication(state,old,'2026-11-26T00:05:00Z');assert.deepEqual(state.published,{a:1});
 assert.deepEqual(state.history[0].document,{a:2});assert(!Object.hasOwn(clientState(state).history[0],'document'));
 assert(!recordPublication(state,{a:1}));
 for(let i=0;i<30;i++){state.revision++;recordPublication(state,{a:i+3});}
 assert.equal(state.history.length,20);
});

import {browserThemeColor} from '../lib/appearance.js';
test('browser theme follows the published poster and header palette',()=>{
 assert.equal(browserThemeColor({},true),'#ff533d');
 assert.equal(browserThemeColor({colors:{'2b141e':'#112233'}},true),'#112233');
 assert.equal(browserThemeColor({sectionBackgrounds:{'/et_pb_section_0':'#f43372'},colors:{'2b141e':'#112233'}},true),'#f43372');
 assert.equal(browserThemeColor({colors:{f9f5c7:'#f0e1b2'}}),'#f0e1b2');
});
