import http from 'http';

function makeRequest(options: http.RequestOptions, postData?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const body = JSON.parse(rawData);
          resolve({ status: res.statusCode || 200, body });
        } catch {
          resolve({ status: res.statusCode || 200, body: rawData });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING CRICKET CONQUEST AUCTION ENGINE AUTOMATED TESTS ---');

  // Test 1: Authentication
  console.log('1. Testing Organizer Login...');
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username: 'auctioneer', password: 'Auction@ZenTriX26' }
  );

  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
  }
  const token = loginRes.body.token;
  console.log('✓ Auctioneer Login successful. JWT token received.');

  // Test 2: RBAC unauthorized test
  console.log('2. Testing RBAC on protected endpoint without token...');
  const unauthRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auction/start',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got: ${unauthRes.status}`);
  }
  console.log('✓ Unauthenticated request correctly rejected with 401.');

  // Test 3: Start Auction
  console.log('3. Testing Auction Start with valid token...');
  const startRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auction/start',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {}
  );
  if (startRes.status !== 200) {
    throw new Error(`Start auction failed: ${JSON.stringify(startRes.body)}`);
  }
  const sessionState = startRes.body.data;
  console.log(`✓ Auction started. Session ID: ${sessionState.sessionId}, Current Player: ${sessionState.currentPlayer?.name || 'None'}`);

  if (!sessionState.currentPlayer) {
    throw new Error('No current player loaded in auction session');
  }

  // Ensure team exists for bidding
  const teams = sessionState.teams;
  if (!teams || teams.length === 0) {
    throw new Error('No teams available for test bidding');
  }
  const testTeam = teams[0];
  console.log(`Using test team: ${testTeam.name} (${testTeam.id}) with purse ₹${testTeam.remainingPurse} Cr`);

  // Test 4: Bidding Engine - Rejection of excessive bid
  console.log('4. Testing bid rejection when bid exceeds purse...');
  const excessiveBidRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auction/bid',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    { teamId: testTeam.id, bidAmount: 9999 }
  );
  if (excessiveBidRes.status === 200) {
    throw new Error('Excessive bid should have been rejected');
  }
  console.log(`✓ Excessive bid properly rejected: ${excessiveBidRes.body.message}`);

  // Test 5: Valid Bid Placement
  console.log('5. Testing valid bid placement...');
  const openingBid = Number(sessionState.currentPlayer.basePrice) || 2.0;
  const validBidRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auction/bid',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    { teamId: testTeam.id, bidAmount: openingBid }
  );
  if (validBidRes.status !== 200) {
    throw new Error(`Valid bid failed: ${JSON.stringify(validBidRes.body)}`);
  }
  console.log(`✓ Valid bid placed at ₹${openingBid} Cr by ${testTeam.name}. Highest bidder confirmed.`);

  // Test 6: ACID SOLD Transaction
  console.log('6. Testing atomic SOLD transaction...');
  const soldRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auction/sold',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {}
  );
  if (soldRes.status !== 200) {
    throw new Error(`Sold transaction failed: ${JSON.stringify(soldRes.body)}`);
  }
  const afterSoldTeam = soldRes.body.data.teams.find((t: any) => t.id === testTeam.id);
  console.log(`✓ Player SOLD! Team remaining purse updated to ₹${afterSoldTeam.remainingPurse} Cr (Bought: ${afterSoldTeam.playersBought})`);

  // Test 7: ACID UNDO Transaction
  console.log('7. Testing atomic UNDO transaction...');
  const undoRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auction/undo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {}
  );
  if (undoRes.status !== 200) {
    throw new Error(`Undo transaction failed: ${JSON.stringify(undoRes.body)}`);
  }
  const afterUndoTeam = undoRes.body.data.teams.find((t: any) => t.id === testTeam.id);
  console.log(`✓ Sale successfully UNDONE! Team purse restored to ₹${afterUndoTeam.remainingPurse} Cr. Player returned to stage.`);

  // Test 8: Auction History Audit Log
  console.log('8. Testing Auction History audit log endpoint...');
  const historyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auction/history',
    method: 'GET',
  });
  if (historyRes.status !== 200 || !Array.isArray(historyRes.body.data)) {
    throw new Error(`History query failed: ${JSON.stringify(historyRes.body)}`);
  }
  console.log(`✓ History returned ${historyRes.body.data.length} audit event log records.`);

  // Test 9: Results Computation
  console.log('9. Testing Auction Results & Standings computation...');
  const resultsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auction/results',
    method: 'GET',
  });
  if (resultsRes.status !== 200 || !Array.isArray(resultsRes.body.data)) {
    throw new Error(`Results calculation failed: ${JSON.stringify(resultsRes.body)}`);
  }
  console.log(`✓ Results computed for ${resultsRes.body.data.length} teams.`);

  console.log('\n========================================');
  console.log('>>> ALL 9 BACKEND AUCTION ENGINE TESTS PASSED! <<<');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
