/**
 * NoobHub acceptance test
 *
 */

var noobhub = require('./client.js').noobhub
var assert = require('assert')
var randomData = {rand: Math.random()}
var iteration = 1

noobhub.subscribe(
  {
    server: 'localhost',
    port: 1337,
    channel: 'gsom'
  },

  function (s) {
    console.log('subscribed callback')
    noobhub.publish(randomData, function () {
      console.log('data sent')
    })
  },
  function (data) {
    console.log('get data callback')
    assert.deepEqual(data, randomData)
    console.log('iteration', iteration, 'ok')
   
    if (iteration++ < 500) {
      randomData = {rand: Math.random()}
      noobhub.publish(randomData)
    } else {
      console.log('tests ok')
      process.exit()
    }
  },
  function (err) {
    console.log('error callback', err)
  }
)

