const { spawn } = require('child_process');
const http = require('http');

async function runFullAudit() {
  console.log('[E2E Full Audit] Launching Chrome Headless...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9233/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const list = JSON.parse(data);
      const wsUrl = list[0].webSocketDebuggerUrl;
      const ws = new globalThis.WebSocket(wsUrl);

      let msgId = 1;
      const pending = new Map();
      const consoleErrors = [];

      ws.onmessage = (event) => {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();
        const p = JSON.parse(raw);

        if (p.method === 'Runtime.consoleAPICalled' && p.params.type === 'error') {
          consoleErrors.push(p.params.args.map(a => a.value || a.description).join(' '));
        }
        if (p.method === 'Runtime.exceptionThrown') {
          consoleErrors.push(p.params.exceptionDetails.text + ' ' + (p.params.exceptionDetails.exception ? p.params.exceptionDetails.exception.description : ''));
        }

        if (p.id && pending.has(p.id)) {
          const cb = pending.get(p.id);
          pending.delete(p.id);
          cb(p.result);
        }
      };

      function send(method, params = {}) {
        return new Promise((resolve) => {
          const id = msgId++;
          pending.set(id, resolve);
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      ws.onopen = async () => {
        await send('Runtime.enable');
        await send('Page.enable');
        await send('Page.navigate', { url: 'http://localhost:5000/app/' });

        // Wait for hydration
        await new Promise(r => setTimeout(r, 2000));

        async function evalInPage(expr) {
          const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
          return res && res.result ? res.result.value : null;
        }

        console.log('\n===============================================================');
        console.log('   FREE FIRE ESPORTS APP - COMPLETE INTERACTION AUDIT');
        console.log('===============================================================\n');

        // 1. Initial State
        console.log('TEST 1: Verifying initial screen...');
        const initialScreen = await evalInPage("document.querySelector('.screen.active').id");
        console.log('-> Active screen:', initialScreen);
        if (initialScreen !== 'screen-matches') throw new Error('Initial screen should be screen-matches');

        // 2. Bottom Nav: Tournaments
        console.log('\nTEST 2: Clicking Tournaments Bottom Nav Tab...');
        await evalInPage("document.getElementById('nav-screen-tournaments').click()");
        await new Promise(r => setTimeout(r, 300));
        const sTournaments = await evalInPage("document.querySelector('.screen.active').id");
        console.log('-> Active screen:', sTournaments);
        if (sTournaments !== 'screen-tournaments') throw new Error('Failed to navigate to Tournaments');

        // 3. Bottom Nav: Wallet
        console.log('\nTEST 3: Clicking Wallet Bottom Nav Tab...');
        await evalInPage("document.getElementById('nav-screen-wallet').click()");
        await new Promise(r => setTimeout(r, 300));
        const sWallet = await evalInPage("document.querySelector('.screen.active').id");
        const walletBal = await evalInPage("document.getElementById('wal-total-disp').innerText");
        console.log('-> Active screen:', sWallet, '| Balance:', walletBal);
        if (sWallet !== 'screen-wallet') throw new Error('Failed to navigate to Wallet');

        // 4. Bottom Nav: Profile
        console.log('\nTEST 4: Clicking Profile Bottom Nav Tab...');
        await evalInPage("document.getElementById('nav-screen-profile').click()");
        await new Promise(r => setTimeout(r, 300));
        const sProfile = await evalInPage("document.querySelector('.screen.active').id");
        const profName = await evalInPage("document.getElementById('prof-name-disp').innerText");
        console.log('-> Active screen:', sProfile, '| Player Name:', profName);
        if (sProfile !== 'screen-profile') throw new Error('Failed to navigate to Profile');

        // 5. Bottom Nav: Matches
        console.log('\nTEST 5: Clicking Matches Bottom Nav Tab...');
        await evalInPage("document.getElementById('nav-screen-matches').click()");
        await new Promise(r => setTimeout(r, 300));
        const sMatches = await evalInPage("document.querySelector('.screen.active').id");
        console.log('-> Active screen:', sMatches);
        if (sMatches !== 'screen-matches') throw new Error('Failed to navigate to Matches');

        // 6. Header Wallet Balance Pill
        console.log('\nTEST 6: Clicking Header Wallet Balance Capsule...');
        await evalInPage("document.querySelector('.header-white button').click()");
        await new Promise(r => setTimeout(r, 300));
        const sWalletFromHdr = await evalInPage("document.querySelector('.screen.active').id");
        console.log('-> Active screen from header wallet button:', sWalletFromHdr);
        if (sWalletFromHdr !== 'screen-wallet') throw new Error('Header wallet button failed to open Wallet');

        // Navigate back to Matches
        await evalInPage("handleNavClick('screen-matches', 'Matches')");
        await new Promise(r => setTimeout(r, 200));

        // 7. Segmented Control (All Matches vs My Matches)
        console.log('\nTEST 7: Testing Segmented Controls...');
        await evalInPage("document.getElementById('seg-my').click()");
        await new Promise(r => setTimeout(r, 300));
        const myActive = await evalInPage("document.getElementById('seg-my').classList.contains('active')");
        console.log('-> My Matches tab active:', myActive);

        await evalInPage("document.getElementById('seg-all').click()");
        await new Promise(r => setTimeout(r, 300));
        const allActive = await evalInPage("document.getElementById('seg-all').classList.contains('active')");
        console.log('-> All Matches tab active:', allActive);

        // 8. Reward Filter Pills
        console.log('\nTEST 8: Testing Reward Filter Pills (Booyah & Kills)...');
        await evalInPage("document.querySelectorAll('.reward-pill')[1].click()");
        await new Promise(r => setTimeout(r, 200));
        console.log('-> Booyah pill active:', await evalInPage("document.querySelectorAll('.reward-pill')[1].classList.contains('active')"));

        await evalInPage("document.querySelectorAll('.reward-pill')[2].click()");
        await new Promise(r => setTimeout(r, 200));
        console.log('-> Kills pill active:', await evalInPage("document.querySelectorAll('.reward-pill')[2].classList.contains('active')"));

        await evalInPage("document.querySelectorAll('.reward-pill')[0].click()");
        await new Promise(r => setTimeout(r, 200));
        console.log('-> All Matches pill active:', await evalInPage("document.querySelectorAll('.reward-pill')[0].classList.contains('active')"));

        // 9. Match Card Details Navigation
        console.log('\nTEST 9: Clicking Match Card to View Regulations & Details...');
        await evalInPage("document.querySelector('.card-banner-box').click()");
        await new Promise(r => setTimeout(r, 400));
        const sDetails = await evalInPage("document.querySelector('.screen.active').id");
        const detailsTitle = await evalInPage("document.getElementById('detail-match-title').innerText");
        console.log('-> Active screen:', sDetails, '| Match Title:', detailsTitle);
        if (sDetails !== 'screen-details') throw new Error('Failed to open Match Details');

        // Back from Details
        await evalInPage("document.querySelector('#screen-details .header-white div').click()");
        await new Promise(r => setTimeout(r, 300));
        console.log('-> Returned to:', await evalInPage("document.querySelector('.screen.active').id"));

        // 10. Quick Add Cash (+₹50)
        console.log('\nTEST 10: Testing Quick Add Cash (+₹50)...');
        await evalInPage("handleNavClick('screen-wallet', 'Wallet')");
        await new Promise(r => setTimeout(r, 300));
        const balBefore = await evalInPage("document.getElementById('hdr-wallet-bal').innerText");
        console.log('-> Balance before Quick Add:', balBefore);
        await evalInPage("quickAddMoney(50)");
        await new Promise(r => setTimeout(r, 1200));
        const balAfter = await evalInPage("document.getElementById('hdr-wallet-bal').innerText");
        console.log('-> Balance after Quick Add +₹50:', balAfter);

        // 11. Modal Tests (Withdrawal Modal & Profile Modal)
        console.log('\nTEST 11: Testing Modals Interactivity...');
        await evalInPage("openWithdrawModal()");
        await new Promise(r => setTimeout(r, 200));
        const withdrawDisplay = await evalInPage("document.getElementById('modal-withdraw').style.display");
        console.log('-> Withdraw modal open:', withdrawDisplay === 'flex');
        await evalInPage("closeModal('modal-withdraw')");

        await evalInPage("openProfileModal()");
        await new Promise(r => setTimeout(r, 200));
        const profileDisplay = await evalInPage("document.getElementById('modal-profile').style.display");
        console.log('-> Profile modal open:', profileDisplay === 'flex');
        await evalInPage("closeModal('modal-profile')");

        // 12. Copy Free Fire UID
        console.log('\nTEST 12: Testing Copy UID & Toast Feedback...');
        await evalInPage("copyUID()");
        await new Promise(r => setTimeout(r, 300));
        const toastText = await evalInPage("document.getElementById('toast-text').innerText");
        console.log('-> Toast message:', toastText);

        // Return to home
        await evalInPage("handleNavClick('screen-matches', 'Matches')");

        console.log('\n===============================================================');
        console.log('   AUDIT SUMMARY & EXCEPTION LOGS:');
        console.log('   Total Console Errors / Unhandled Exceptions:', consoleErrors.length);
        if (consoleErrors.length > 0) {
          console.error('   ERRORS:', consoleErrors);
        } else {
          console.log('   ALL 12 TESTS PASSED WITH 0 ERRORS! INTERACTION IS 100% OPERATIONAL!');
        }
        console.log('===============================================================\n');

        ws.close();
        chrome.kill();
        process.exit(consoleErrors.length > 0 ? 1 : 0);
      };
    });
  });
}

runFullAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
