import test from 'tape'
import dotpath from 'dotpather'

import lib from '../src'

test('throws on incorrect params', t => {
  t.plan(4)

  t.throws(() => lib(), 'throws on no params')
  t.throws(() => lib({whitelist: [], blacklist: []}, noop), 'throws on black+white')
  t.throws(() => lib({whitelist: 'bup'}, noop), 'throws on bad ip')
  t.throws(() => lib({whitelist: 'bup'}), 'throws no failure route')
})

test('does not throw on good params', t => {
  t.plan(2)

  t.doesNotThrow(() => lib({whitelist: '127.0.0.1'}, noop), 'allows good ips')
  t.doesNotThrow(() => lib({blacklist: '127.0.0.0/24'}, noop), 'allows good ips')
})

test('passes good ips on whitelist', t => {
  t.plan(1)

  const fakeReq = {
    connection: {remoteAddress: '192.168.0.1'}
  }
  const instance = lib({whitelist: '192.168.0.0/24'}, t.fail.bind(t))
  const route = instance(t.pass.bind(t, 'routed correctly'))

  route(fakeReq, {})
})

test('fails bad ips on blacklist', t => {
  t.plan(1)

  const fakeReq = {
    connection: {remoteAddress: '192.168.0.1'}
  }
  const instance = lib({blacklist: '192.168.0.0/24'}, t.pass.bind(t, 'passed'))
  const route = instance(t.fail.bind(t, 'routed incorrectly'))

  route(fakeReq, {})
})

test('can lookup in multiple places', t => {
  t.plan(4)

  const fakeReqs = [
    {
      connection: {remoteAddress: '192.168.0.1'}
    },
    {
      connection: {
        socket: {
          remoteAddress: '192.168.0.1'
        }
      }
    },
    {
      socket: {
        remoteAddress: '192.168.0.1'
      }
    },
    {
      remoteAddress: '192.168.0.1'
    }
  ]

  const instance = lib({whitelist: '192.168.0.0/24'}, t.fail.bind(t))
  const route = instance(t.pass.bind(t, 'routed correctly'))

  fakeReqs.forEach(req => route(req, {}))
})

test('fails bad ips on whitelist', t => {
  t.plan(1)

  const fakeReq = {
    connection: {remoteAddress: '192.168.1.1'}
  }
  const instance = lib({whitelist: '192.168.0.0/24'}, t.pass.bind(t, 'routed'))
  const route = instance(t.fail.bind(t, 'routed incorrectly'))

  route(fakeReq, {})
})

test('passes good ips on blacklist', t => {
  t.plan(1)

  const fakeReq = {
    connection: {remoteAddress: '192.168.1.1'}
  }
  const instance = lib({blacklist: '192.168.0.0/24'}, t.fail.bind(t))
  const route = instance(t.pass.bind(t, 'routed correctly'))

  route(fakeReq, {})
})

test('can specify multiple addresses', t => {
  t.plan(1)

  const fakeReq = {
    connection: {remoteAddress: '192.168.1.1'}
  }
  const whitelist = ['172.24.42.0/16', '192.168.1.0/24']
  const instance = lib({whitelist}, t.fail.bind(t))
  const route = instance(t.pass.bind(t, 'routed correctly'))

  route(fakeReq, {})
})

test('can provide a lookup function', t => {
  t.plan(1)

  const fakeReq = {
    headers: {'some-fake-header': '192.168.0.1'}
  }
  const lookup = req => dotpath('headers.some-fake-header')(req)

  const instance = lib({whitelist: '192.168.0.0/24'}, t.fail.bind(t), lookup)
  const route = instance(t.pass.bind(t, 'routed correctly'))

  route(fakeReq, {})
})

test('passes through all other params to the pass function', t => {
  t.plan(3)

  const fakeReq = {
    connection: {remoteAddress: '192.168.0.1'}
  }
  const one = 'one'
  const two = {beep: 'boop'}
  const instance = lib({whitelist: '192.168.0.0/24'}, t.fail.bind(t))
  const route = instance(onPass)

  route(fakeReq, one, two)

  function onPass (...args) {
    t.deepEqual(args, [fakeReq, one, two])
    // is literally the same objects...
    t.equal(args[0], fakeReq)
    t.equal(args[2], two)
  }
})

test('passes through all other params to the fail function', t => {
  t.plan(3)

  const fakeReq = {
    connection: {remoteAddress: '192.168.1.1'}
  }
  const one = 'one'
  const two = {beep: 'boop'}
  const instance = lib({whitelist: '192.168.0.0/24'}, onFail)
  const route = instance(t.fail.bind(t, 'should not pass'))

  route(fakeReq, one, two)

  function onFail (...args) {
    t.deepEqual(args, [fakeReq, one, two])
    // is literally the same objects...
    t.equal(args[0], fakeReq)
    t.equal(args[2], two)
  }
})

function noop () {
  // nerp
}
