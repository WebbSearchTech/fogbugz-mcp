#!/usr/bin/env ts-node
/**
 * Test script to debug checkins API response for case 13749
 */

import { FogBugzApi } from '../src/api';

async function main() {
  const api = new FogBugzApi({
    baseUrl: process.env.FOGBUGZ_URL || '',
    apiKey: process.env.FOGBUGZ_API_KEY || ''
  });

  const caseId = 13749;
  
  console.log(`\n🔍 Testing checkins for case ${caseId}...\n`);
  
  try {
    const checkins = await api.listCheckins(caseId);
    console.log('✅ Checkins response:');
    console.log(JSON.stringify(checkins, null, 2));
    console.log(`\n📊 Total checkins: ${checkins?.length || 0}`);
  } catch (error: any) {
    console.error('❌ Error fetching checkins:');
    console.error(error.message);
    console.error(error.stack);
  }
}

main().catch(console.error);
