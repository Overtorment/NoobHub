const noobhub = require('./client');

const hub = noobhub.new({});

const myName = 'js_node_user_' + Math.floor(1000 * Math.random());
const ch = 'ch1'; // 'ch2'
const dt = 1000;

hub.subscribe({
  channel: ch,
  callback: (data) => {
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
