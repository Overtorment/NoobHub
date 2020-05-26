const noobhub = require('./client');

const hub = noobhub.new({});

const myName = 'user_' + Math.floor(1000 * Math.random());
const ch = 'ch1';
const dt = 2000;

hub.subscribe({
  channel: ch,
  callback: (data) => {
    if (data.from === myName) {
      return;
    }
    console.log('callback', data);
  },
  subscribedCallback: (socket) => {
    console.log('subscribedCallback (got socket)');

    let i = 0;
    setInterval(() => {
      hub.publish({ from: myName, data: `${i++} ${Math.random()}` });
    }, dt);
  },
  errorCallback: (err) => {
    console.log('error callback', err);
    process.exit(1);
  },
});
