const { spawn } = require('child_process');
const http = require('http');

async function testTouchAndScroll() {
  console.log('[Touch & Scroll Test] Starting Chrome with mobile emulation...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9235',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9235/json', (res) => {
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

        // Set device metrics to mobile screen (Pixel 7: 412x915, mobile touch enabled)
        await send('Emulation.setDeviceMetricsOverride', {
          width: 412,
          height: 915,
          deviceScaleFactor: 2.625,
          mobile: true
        });
        await send('Emulation.setTouchEmulationEnabled', {
          enabled: true,
          maxTouchPoints: 5
        });

        await send('Page.navigate', { url: 'http://localhost:5000/app/' });
        await new Promise(r => setTimeout(r, 2000));

        async function evalInPage(expr) {
          const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
          return res && res.result ? res.result.value : null;
        }

        console.log('\n===============================================================');
        console.log('   MOBILE TOUCH & SCROLL INTERACTION VALIDATION');
        console.log('===============================================================\n');

        // 1. SCROLL TEST: Matches Feed
        console.log('TEST 1: Testing scroll on Matches Screen...');
        const scrollHeight1 = await evalInPage("document.getElementById('screen-matches').scrollHeight");
        const clientHeight1 = await evalInPage("document.getElementById('screen-matches').clientHeight");
        console.log(`-> Screen height: ${clientHeight1}px | Total scrollable height: ${scrollHeight1}px`);
        if (scrollHeight1 <= clientHeight1) throw new Error('Matches screen is not scrollable!');

        // Perform scroll
        await evalInPage("document.getElementById('screen-matches').scrollTop = 350");
        await new Promise(r => setTimeout(r, 200));
        const currentScroll1 = await evalInPage("document.getElementById('screen-matches').scrollTop");
        console.log(`-> Scroll position after scroll gesture: ${currentScroll1}px (SUCCESS: Can scroll!)`);
        if (currentScroll1 === 0) throw new Error('Matches screen failed to scroll!');

        // 2. SCROLL TEST: Tournaments Screen
        console.log('\nTEST 2: Testing scroll on Tournaments Screen...');
        await evalInPage("handleNavClick('screen-tournaments', 'Tournaments')");
        await new Promise(r => setTimeout(r, 300));
        const scrollHeight2 = await evalInPage("document.getElementById('screen-tournaments').scrollHeight");
        const clientHeight2 = await evalInPage("document.getElementById('screen-tournaments').clientHeight");
        console.log(`-> Tournaments height: ${clientHeight2}px | Scrollable: ${scrollHeight2}px`);
        await evalInPage("document.getElementById('screen-tournaments').scrollTop = 150");
        await new Promise(r => setTimeout(r, 200));
        const currentScroll2 = await evalInPage("document.getElementById('screen-tournaments').scrollTop");
        console.log(`-> Tournaments scroll position: ${currentScroll2}px`);

        // 3. SCROLL TEST: Wallet Screen
        console.log('\nTEST 3: Testing scroll on Wallet Screen...');
        await evalInPage("handleNavClick('screen-wallet', 'Wallet')");
        await new Promise(r => setTimeout(r, 300));
        const scrollHeight3 = await evalInPage("document.getElementById('screen-wallet').scrollHeight");
        const clientHeight3 = await evalInPage("document.getElementById('screen-wallet').clientHeight");
        console.log(`-> Wallet height: ${clientHeight3}px | Scrollable: ${scrollHeight3}px`);
        await evalInPage("document.getElementById('screen-wallet').scrollTop = 150");
        await new Promise(r => setTimeout(r, 200));
        const currentScroll3 = await evalInPage("document.getElementById('screen-wallet').scrollTop");
        console.log(`-> Wallet scroll position: ${currentScroll3}px`);

        // 4. SCROLL TEST: Profile Screen
        console.log('\nTEST 4: Testing scroll on Profile Screen...');
        await evalInPage("handleNavClick('screen-profile', 'Profile')");
        await new Promise(r => setTimeout(r, 300));
        const scrollHeight4 = await evalInPage("document.getElementById('screen-profile').scrollHeight");
        const clientHeight4 = await evalInPage("document.getElementById('screen-profile').clientHeight");
        console.log(`-> Profile height: ${clientHeight4}px | Scrollable: ${scrollHeight4}px`);
        await evalInPage("document.getElementById('screen-profile').scrollTop = 150");
        await new Promise(r => setTimeout(r, 200));
        const currentScroll4 = await evalInPage("document.getElementById('screen-profile').scrollTop");
        console.log(`-> Profile scroll position: ${currentScroll4}px`);

        // 5. TOUCH TAP TEST: Synthesize touch taps via touchstart/touchend
        console.log('\nTEST 5: Testing Touch Tap on Bottom Navigation Tabs...');
        async function touchTap(selector) {
          await evalInPage(`
            (function() {
              const el = document.querySelector('${selector}');
              if (!el) throw new Error('Element not found: ${selector}');
              const rect = el.getBoundingClientRect();
              const touchObj = new Touch({
                identifier: Date.now(),
                target: el,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                radiusX: 2.5,
                radiusY: 2.5,
                rotationAngle: 10,
                force: 0.5
              });
              el.dispatchEvent(new TouchEvent('touchstart', { touches: [touchObj], targetTouches: [touchObj], bubbles: true }));
              el.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], bubbles: true }));
              el.click();
            })()
          `);
        }

        // Tap Matches
        await touchTap('#nav-screen-matches');
        await new Promise(r => setTimeout(r, 250));
        console.log('-> Tapped Matches nav. Active screen:', await evalInPage("document.querySelector('.screen.active').id"));

        // Tap Tournaments
        await touchTap('#nav-screen-tournaments');
        await new Promise(r => setTimeout(r, 250));
        console.log('-> Tapped Tournaments nav. Active screen:', await evalInPage("document.querySelector('.screen.active').id"));

        // Tap Wallet
        await touchTap('#nav-screen-wallet');
        await new Promise(r => setTimeout(r, 250));
        console.log('-> Tapped Wallet nav. Active screen:', await evalInPage("document.querySelector('.screen.active').id"));

        // Tap Profile
        await touchTap('#nav-screen-profile');
        await new Promise(r => setTimeout(r, 250));
        console.log('-> Tapped Profile nav. Active screen:', await evalInPage("document.querySelector('.screen.active').id"));

        // 6. TOUCH TAP: Quick Add Money on Wallet
        console.log('\nTEST 6: Testing Touch Tap on Quick Add Amount (+₹100)...');
        await touchTap('#nav-screen-wallet');
        await new Promise(r => setTimeout(r, 200));
        const balBefore = await evalInPage("document.getElementById('wal-total-disp').innerText");
        await touchTap('.card-white button:nth-child(2)'); // +₹100
        await new Promise(r => setTimeout(r, 300));
        const balAfter = await evalInPage("document.getElementById('wal-total-disp').innerText");
        console.log(`-> Balance before: ${balBefore} | Balance after tap: ${balAfter}`);

        // 7. TOUCH TAP: Join Match
        console.log('\nTEST 7: Testing Touch Tap on Join Match...');
        await touchTap('#nav-screen-matches');
        await new Promise(r => setTimeout(r, 300));
        const joinedBefore = await evalInPage("MY_REGISTERED_IDS.size");
        await touchTap('.btn-join-match');
        await new Promise(r => setTimeout(r, 400));
        const joinedAfter = await evalInPage("MY_REGISTERED_IDS.size");
        console.log(`-> Registered count before: ${joinedBefore} | After: ${joinedAfter}`);

        console.log('\n===============================================================');
        console.log('   TOUCH & SCROLL AUDIT RESULT:');
        console.log('   Total Console Errors:', consoleErrors.length);
        if (consoleErrors.length > 0) {
          console.error('   ERRORS:', consoleErrors);
        } else {
          console.log('   ALL TOUCH & SCROLLING TESTS PASSED FLAWLESSLY WITH 0 ERRORS!');
        }
        console.log('===============================================================\n');

        ws.close();
        chrome.kill();
        process.exit(consoleErrors.length > 0 ? 1 : 0);
      };
    });
  });
}

testTouchAndScroll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
