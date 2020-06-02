/**
 * NoobHub acceptance test
 *
 */

const assert = require('assert');
const crypto = require('crypto');

const noobhub = require('./client.js');

const hub = noobhub.new({ server: 'localhost', port: 1337 });

let randomData = { rand: Math.random() };
let iteration = 1;

setTimeout(() => {
  console.log('tests NOT ok (timeout)');
  process.exit(1);
}, 5000);

hub.subscribe({
  channel:
    'testChannel' +
    crypto.createHash('md5').update(Math.random().toString()).digest('hex'),
  callback: (data) => {
    assert.deepEqual(data, randomData);

    if (iteration++ < 50) {
      randomData = { rand: Math.random() };
      hub.publish(randomData);
    } else {
      console.log('tests ok');
      process.exit();
    }
  },
  subscribedCallback: (socket) => {
    hub.publish(randomData, () => {});
  },
  errorCallback: (err) => {
    console.log('error callback', err);
    process.exit(1);
  }
});
