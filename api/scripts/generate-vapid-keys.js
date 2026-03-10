#!/usr/bin/env node
/**
 * VAPID 키 쌍 생성 스크립트
 * 사용법: cd api && node scripts/generate-vapid-keys.js
 * 생성된 키를 Railway 환경변수에 등록하세요.
 */
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('='.repeat(50));
console.log('VAPID 키 생성 완료');
console.log('='.repeat(50));
console.log();
console.log('Railway 환경변수에 아래 값을 등록하세요:');
console.log();
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@ydpjc.org`);
console.log();
console.log('='.repeat(50));
