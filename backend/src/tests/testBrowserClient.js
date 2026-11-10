const { spawn } = require('child_process');
const http = require('http');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9232',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9232/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const list = JSON.parse(data);
      const ws = new globalThis.WebSocket(list[0].webSocketDebuggerUrl);

      ws.onopen = async () => {
        let msgId = 1;
        function send(method, params = {}) {
          return new Promise(resolve => {
            const id = msgId++;
            const l = (e) => {
              const p = JSON.parse(e.data);
              if (p.id === id) {
                ws.removeEventListener('message', l);
                resolve(p.result);
              }
            };
            ws.addEventListener('message', l);
            ws.send(JSON.stringify({ id, method, params }));
          });
        }

        await send('Page.enable');
        await send('Page.navigate', { url: 'http://localhost:5000/app/' });
        await new Promise(r => setTimeout(r, 2000));

        const rInfo = await send('Runtime.evaluate', {
          expression: `(function() {
            const s = document.querySelector('script');
            return {
              parent: s ? s.parentElement.tagName : null,
              parentId: s ? s.parentElement.id : null,
              hasRun: typeof window.handleNavClick
            };
          })()`,
          returnByValue: true
        });
        console.log('Script parent element info:', rInfo.result.value);

        ws.close();
        chrome.kill();
        process.exit(0);
      };
    });
  });
}

test().catch(console.error);
