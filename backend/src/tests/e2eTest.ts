import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(method: string, path: string, body?: any, token: string = 'mock_roshan_token'): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = body ? JSON.stringify(body) : '';

    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${token}`
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('STARTING FREE FIRE ESPORTS END-TO-END SYSTEM TEST');
  console.log('====================================================\n');

  try {
    // TEST 1: Google Login & Authentication
    console.log('--- TEST 1: Google Authentication ---');
    const loginRes = await request('POST', '/auth/google-login', {
      email: 'roshan@ffesports.in',
      name: 'Roshan Chourasia',
      userId: 'user_roshan'
    });
    assert(loginRes.status === 200, 'Google Login returns HTTP 200');
    assert(loginRes.data.success === true, 'Login response success is true');
    assert(loginRes.data.user.name === 'Roshan Chourasia', 'User name is Roshan Chourasia');
    assert(loginRes.data.wallet.availableBalance >= 0, 'Wallet initialized with valid balance');

    // TEST 2: Profile Management & Updates
    console.log('\n--- TEST 2: Profile Updates & In-Game Identity ---');
    const updateProfileRes = await request('PUT', '/users/profile/user_roshan', {
      name: 'Roshan Chourasia',
      ign: 'Roshan_Boss',
      ffUid: 'FF99887766',
      age: 22,
      gender: 'Male',
      state: 'Uttarakhand',
      country: 'India',
      phone: '8949267586'
    });
    assert(updateProfileRes.status === 200, 'Profile update returns HTTP 200');
    assert(updateProfileRes.data.user.ign === 'Roshan_Boss', 'IGN updated to Roshan_Boss');
    assert(updateProfileRes.data.user.ffUid === 'FF99887766', 'FF UID updated to FF99887766');
    assert(updateProfileRes.data.user.isProfileComplete === true, 'Profile completion verified');

    // TEST 3: Matches Listing & Filter Engine
    console.log('\n--- TEST 3: Matches Listing, Maps, Modes, Search ---');
    const allMatches = await request('GET', '/matches');
    assert(allMatches.status === 200, 'Get all matches returns HTTP 200');
    assert(allMatches.data.matches.length >= 4, 'At least 4 tournament matches loaded');

    // Filter by SOLO
    const soloMatches = await request('GET', '/matches?mode=SOLO');
    assert(soloMatches.data.matches.every((m: any) => m.mode === 'SOLO'), 'Mode filter SOLO works');

    // Filter by Map Bermuda
    const bermudaMatches = await request('GET', '/matches?map=Bermuda');
    assert(bermudaMatches.data.matches.every((m: any) => m.map.includes('Bermuda')), 'Map filter Bermuda works');

    // Search filter
    const searchRes = await request('GET', '/matches?search=Solo');
    assert(searchRes.data.matches.length > 0, 'Search filter for Solo returns matches');

    // TEST 4: Admin Creates a Dedicated Test Match
    console.log('\n--- TEST 4: Admin Tournament Creation ---');
    const createMatchRes = await request('POST', '/admin/matches', {
      title: 'E2E Champions Cup ' + Date.now().toString().slice(-4),
      category: 'BATTLE_ROYALE',
      mode: 'SOLO',
      matchType: 'BOOYAH',
      map: 'Bermuda',
      entryFee: 25,
      prizePool: 500,
      firstPrize: 300,
      secondPrize: 150,
      thirdPrize: 50,
      maxSlots: 48,
      matchDate: 'Today',
      matchTime: '11:00 PM',
      rules: ['Strictly mobile devices.', 'Room ID 15 mins prior.']
    });
    assert(createMatchRes.status === 200, 'Admin created tournament successfully');
    const testMatch = createMatchRes.data.match;
    assert(testMatch.entryFee === 25, 'Match entry fee is ₹25');

    // TEST 5: Initial Wallet Balance Check & Match Registration
    console.log('\n--- TEST 5: Match Registration & Atomic Deduction ---');
    const initialWallet = await request('GET', '/wallet/user_roshan');
    const startBalance = initialWallet.data.wallet.availableBalance;
    console.log(`Starting wallet balance: ₹${startBalance}`);

    const regRes = await request('POST', `/matches/${testMatch.id}/register`, {
      userId: 'user_roshan'
    });
    assert(regRes.status === 200, 'Match registration succeeded with HTTP 200');
    assert(regRes.data.success === true, 'Registration success is true');
    assert(regRes.data.registration.ign === 'Roshan_Boss', 'Registration captured player IGN');
    assert(regRes.data.wallet.availableBalance === startBalance - testMatch.entryFee, `Wallet atomically deducted entry fee ₹${testMatch.entryFee}`);

    // TEST 6: Prevent Duplicate Match Registration
    console.log('\n--- TEST 6: Duplicate Registration Guard ---');
    const duplicateRes = await request('POST', `/matches/${testMatch.id}/register`, {
      userId: 'user_roshan'
    });
    assert(duplicateRes.status === 400, 'Duplicate registration correctly rejected with HTTP 400');
    assert(duplicateRes.data.message.includes('already registered'), 'Duplicate registration error message verified');

    // TEST 7: Transaction History Ledger
    console.log('\n--- TEST 7: Immutable Transaction Ledger ---');
    const txRes = await request('GET', '/wallet/user_roshan/transactions');
    assert(txRes.status === 200, 'Transaction history returns HTTP 200');
    const latestTx = txRes.data.transactions[0];
    assert(latestTx.type === 'ENTRY_FEE', 'Latest transaction is ENTRY_FEE');
    assert(latestTx.amount === testMatch.entryFee, `Transaction record amount matches ₹${testMatch.entryFee}`);

    // TEST 8: Add Money to Wallet
    console.log('\n--- TEST 8: Deposit & Add Money ---');
    const depositAmount = 200;
    const preDepositBal = (await request('GET', '/wallet/user_roshan')).data.wallet.availableBalance;
    const addMoneyRes = await request('POST', '/wallet/user_roshan/add-money', {
      amount: depositAmount,
      method: 'Google Pay'
    });
    assert(addMoneyRes.status === 200, 'Add Money returns HTTP 200');
    assert(addMoneyRes.data.wallet.availableBalance === (preDepositBal + depositAmount), 'Deposit successfully credited available balance');

    // TEST 9: Room Credentials Release & Access Security
    console.log('\n--- TEST 9: Secure Room Credentials Distribution ---');
    // Admin sets room credentials
    const setRoomRes = await request('POST', `/admin/matches/${testMatch.id}/room`, {
      roomId: '9920184',
      roomPassword: 'ffpass88'
    });
    assert(setRoomRes.status === 200, 'Admin set room credentials returns HTTP 200');

    // Registered user accesses room
    const registeredUserRoom = await request('GET', `/matches/${testMatch.id}/room?userId=user_roshan`);
    assert(registeredUserRoom.status === 200, 'Registered user can access room credentials');
    assert(registeredUserRoom.data.roomId === '9920184', 'Room ID verified for registered user');
    assert(registeredUserRoom.data.roomPassword === 'ffpass88', 'Room Password verified for registered user');

    // Non-registered user denied access
    const nonRegisteredRoom = await request('GET', `/matches/${testMatch.id}/room?userId=unknown_player_99`);
    assert(nonRegisteredRoom.status === 403, 'Non-registered user correctly denied room access with HTTP 403');

    // TEST 10: Booyah Prize Distribution
    console.log('\n--- TEST 10: Booyah Winner Placement & Prize Settlement ---');
    const booyahWinnerPrize = 300;
    const preBooyahWallet = await request('GET', '/wallet/user_roshan');
    const preBooyahBal = preBooyahWallet.data.wallet.availableBalance;

    const booyahRes = await request('POST', `/admin/matches/${testMatch.id}/results/booyah`, {
      rankings: [
        { rank: 1, userId: 'user_roshan', ign: 'Roshan_Boss', ffUid: 'FF99887766', prize: booyahWinnerPrize },
        { rank: 2, userId: 'user_dummy_2', ign: 'SniperAce', ffUid: 'FF883921', prize: 150 },
        { rank: 3, userId: 'user_dummy_3', ign: 'CoverFire', ffUid: 'FF773129', prize: 50 }
      ]
    });
    assert(booyahRes.status === 200, 'Booyah distribution returns HTTP 200');
    assert(booyahRes.data.result.status === 'APPROVED', 'Booyah result marked APPROVED');

    const postBooyahWallet = await request('GET', '/wallet/user_roshan');
    assert(postBooyahWallet.data.wallet.availableBalance === preBooyahBal + booyahWinnerPrize, `Winner wallet credited with 1st place prize ₹${booyahWinnerPrize}`);

    // TEST 11: Per Kill Reward Distribution on a Per-Kill Match
    console.log('\n--- TEST 11: Per Kill Reward Verification & Payout ---');
    // Admin creates Per Kill match
    const killMatchRes = await request('POST', '/admin/matches', {
      title: 'E2E Kill Showdown',
      category: 'BATTLE_ROYALE',
      mode: 'SOLO',
      matchType: 'KILL',
      map: 'Purgatory',
      entryFee: 30,
      prizePool: 1200,
      perKillReward: 30,
      maxSlots: 48,
      matchDate: 'Today',
      matchTime: '11:30 PM',
      rules: ['Every kill earns ₹30.']
    });
    const killMatch = killMatchRes.data.match;

    const killsScored = 5;
    const expectedKillReward = 5 * 30; // ₹150

    const preKillBal = (await request('GET', '/wallet/user_roshan')).data.wallet.availableBalance;
    const killRes = await request('POST', `/admin/matches/${killMatch.id}/results/kill`, {
      killRecords: [
        { userId: 'user_roshan', ign: 'Roshan_Boss', ffUid: 'FF99887766', kills: killsScored }
      ]
    });
    assert(killRes.status === 200, 'Per Kill distribution returns HTTP 200');
    assert(killRes.data.result.killCounts[0].reward === expectedKillReward, `Kill reward correctly calculated: ₹${expectedKillReward}`);

    const postKillWallet = await request('GET', '/wallet/user_roshan');
    assert(postKillWallet.data.wallet.availableBalance === preKillBal + expectedKillReward, `Kill reward of ₹${expectedKillReward} credited to player balance`);

    // TEST 12: Withdrawal Reservation & Validation
    console.log('\n--- TEST 12: Withdrawal Request & Balance Reservation ---');
    // Test invalid UPI format rejection
    const invalidUpiRes = await request('POST', '/wallet/user_roshan/withdraw', {
      amount: 100,
      upiId: 'invalid-upi-without-at'
    });
    assert(invalidUpiRes.status === 400, 'Invalid UPI ID format rejected with HTTP 400');

    // Valid withdrawal request
    const withdrawAmount = 250;
    const validUpi = 'roshan@okhdfcbank';
    const currentAvailable = postKillWallet.data.wallet.availableBalance;

    const withdrawRes = await request('POST', '/wallet/user_roshan/withdraw', {
      amount: withdrawAmount,
      upiId: validUpi
    });
    assert(withdrawRes.status === 200, 'Valid withdrawal submitted with HTTP 200');
    assert(withdrawRes.data.withdrawal.status === 'PENDING', 'Withdrawal status is PENDING');
    assert(withdrawRes.data.wallet.availableBalance === currentAvailable - withdrawAmount, 'Withdrawal amount reserved from available balance');

    const withdrawalId = withdrawRes.data.withdrawal.id;

    // TEST 13: Admin Payout Approval & Settlement
    console.log('\n--- TEST 13: Admin Withdrawal Approval ---');
    const approveRes = await request('POST', `/admin/withdrawals/${withdrawalId}/action`, {
      approve: true,
      payoutTxnId: 'UPI_BANK_REF_991823'
    });
    assert(approveRes.status === 200, 'Admin approval returns HTTP 200');
    assert(approveRes.data.withdrawal.status === 'SUCCESSFUL', 'Withdrawal marked SUCCESSFUL');
    assert(approveRes.data.withdrawal.payoutTxnId === 'UPI_BANK_REF_991823', 'Payout reference recorded');

    // TEST 14: Withdrawal Rejection & Automatic Balance Refund
    console.log('\n--- TEST 14: Withdrawal Rejection & Automatic Refund ---');
    const secondWithdraw = await request('POST', '/wallet/user_roshan/withdraw', {
      amount: 60,
      upiId: 'roshan@paytm'
    });
    assert(secondWithdraw.status === 200, 'Second withdrawal created');
    const secondId = secondWithdraw.data.withdrawal.id;

    const balanceBeforeReject = (await request('GET', '/wallet/user_roshan')).data.wallet.availableBalance;

    const rejectRes = await request('POST', `/admin/withdrawals/${secondId}/action`, {
      approve: false,
      reason: 'Name mismatch on beneficiary bank'
    });
    assert(rejectRes.status === 200, 'Admin rejection returns HTTP 200');
    assert(rejectRes.data.withdrawal.status === 'REJECTED', 'Withdrawal status set to REJECTED');

    const balanceAfterReject = (await request('GET', '/wallet/user_roshan')).data.wallet.availableBalance;
    assert(balanceAfterReject === balanceBeforeReject + 60, 'Reserved ₹60 automatically refunded back to available balance');

    // TEST 15: Admin User Suspension / Ban Toggle
    console.log('\n--- TEST 15: Admin User Sanction Management ---');
    const banRes = await request('POST', '/admin/users/user_roshan/ban');
    assert(banRes.status === 200, 'User ban toggle returns HTTP 200');
    assert(banRes.data.user.isBanned === true, 'User is marked banned');

    const unbanRes = await request('POST', '/admin/users/user_roshan/ban');
    assert(unbanRes.data.user.isBanned === false, 'User unbanned successfully');

    // TEST 16: Admin Metrics & Audit Trail
    console.log('\n--- TEST 16: Admin Metrics & Audit Logging ---');
    const metricsRes = await request('GET', '/admin/metrics');
    assert(metricsRes.status === 200, 'Admin metrics returns HTTP 200');
    assert(metricsRes.data.metrics.totalPrizeDistributed > 0, 'Metrics track total prize distribution');

    const auditRes = await request('GET', '/admin/audit-logs');
    assert(auditRes.status === 200, 'Audit logs return HTTP 200');
    assert(auditRes.data.auditLogs.length > 0, 'Audit records created for every financial and room operation');

    console.log('\n====================================================');
    console.log('🎉 ALL 16 END-TO-END TESTS PASSED WITH 0 ERRORS!');
    console.log('====================================================');
  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    process.exit(1);
  }
}

runEndToEndTests();
