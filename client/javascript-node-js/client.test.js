/**
 * NoobHub acceptance test
 *
 */

var noobhub = require('./client.js')
var assert = require('assert')
var randomData = {rand: Math.random()}
var iteration = 1

var hub = noobhub.new({server: 'localhost', port: 1337})

setTimeout(function () {
  console.log('tests NOT ok (timeout)')
  process.exit(1)
}, 5000)

hub.subscribe({
  channel: 'testChannel' + require('crypto').createHash('md5').update(Math.random().toString()).digest('hex'),
  callback: function (data) {
    assert.deepEqual(data, randomData)

    if (iteration++ < 50) {
      randomData = {rand: Math.random()}
      hub.publish(randomData)
    } else {
      console.log('tests ok')
      process.exit()
    }
  },
  subscribedCallback: function (socket) {
    hub.publish(randomData, function () {
    })
  },
  errorCallback: function (err) {
    console.log('error callback', err)
    process.exit(1)
  }
})

