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
  console.log('tests NOT ok')
  process.exit()
}, 5000)

hub.subscribe({
  channel: 'testChannel' + require('crypto').createHash('md5').update(Math.random().toString()).digest('hex'),
  callback: function (data) {
      // console.log('get data callback')
    assert.deepEqual(data, randomData)
      // console.log('iteration', iteration, 'ok')

    if (iteration++ < 50) {
      randomData = {rand: Math.random()}
      hub.publish(randomData)
    } else {
      console.log('tests ok')
      process.exit()
    }
  },
  subscribedCallback: function (socket) {
      // console.log('subscribed callback')
    hub.publish(randomData, function () {
        // console.log('data sent')
    })
  },
  errorCallback: function (err) {
    console.log('error callback', err)
    assert(false)
  }
})

