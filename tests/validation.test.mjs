import test from 'node:test';import assert from 'node:assert/strict';
import {convertStrokes,validParentOrigin} from '../src/validation.js';
test('trusted Google Apps Script origins',()=>{
 assert.equal(validParentOrigin('https://script.google.com'),true);
 assert.equal(validParentOrigin('https://n-abc-script.googleusercontent.com'),true);
 assert.equal(validParentOrigin('https://attacker.example'),false);
 assert.equal(validParentOrigin('https://script.googleusercontent.com.attacker.example'),false);
});
test('normalized stroke coordinates convert with aspect ratio',()=>{
 const s=convertStrokes([[[0,0],[500,500],[1000,1000]]],{width:430,height:220});
 assert.equal(s[0].points[1].x,215);assert.equal(s[0].points[1].y,110);
});
test('malformed points rejected',()=>{
 assert.throws(()=>convertStrokes([[[2000,0]]],{width:430,height:220}));
 assert.throws(()=>convertStrokes([], {width:430,height:220}));
});
