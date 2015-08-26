import test from 'tape'
import dotpath from 'dotpather'

import lib from '../src'

test('throws on incorrect params', t => {
  t.plan(3)

  t.throws(() => lib(), 'throws on no params')
  t.throws(() => lib({whitelist: [], blacklist: []}), 'throws on black+white')
  t.throws(() => lib({whitelist: 'bup'}), 'throws on bad ip')
})

test('does not throw on good params', t => {
  t.plan(2)

  t.doesNotThrow(() => lib({whitelist: '127.0.0.1'}), 'allows good ips')
  t.doesNotThrow(() => lib({blacklist: '127.0.0.0/24'}), 'allows good ips')
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

test('can lookup in multiple places', t => {
  t.plan(3)

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

test('will 403 if no default provided', t => {
  t.plan(1)

  const fakeReq = {
    connection: {remoteAddress: '192.168.1.1'}
  }
  const fakeRes = {
    statusCode: 0,
    end: () => {
      t.equal(fakeRes.statusCode, 403)
    }
  }

  const instance = lib({whitelist: '10.0.0.0/8'})
  const route = instance(t.fail.bind(t, 'routed incorrectly'))

  route(fakeReq, fakeRes)
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
