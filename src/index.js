import IpCheck from 'ipcheck'
import arrayify from 'arrify'
import dotpath from 'dotpather'

export default deter

function deter ({whitelist, blacklist} = {}, onFail, lookup) {
  if (!whitelist && !blacklist) {
    throw new Error(
      'One of `whitelist` or `blacklist` are required in the options object.'
    )
  } else if (whitelist && blacklist) {
    throw new Error(
      'You cannot define both a whitelist, and a blacklist; choose one'
    )
  }

  if (!onFail) {
    throw new Error(
      'You must pass a route to be used when a route fails the filter'
    )
  }

  const checks = []
  const list = whitelist ? arrayify(whitelist) : arrayify(blacklist)

  list.forEach(ip => {
    const check = new IpCheck(ip)

    if (!check.valid) {
      throw new Error(`Bad IP Provided: ${ip}`)
    }

    checks.push(check)
  })

  return checkRoute

  function checkRoute (route) {
    return doCheck

    function doCheck (...args) {
      const req = args[0]
      let ip

      if (lookup) {
        ip = lookup(req)
      } else {
        ip = dotpath('connection.remoteAddress')(req) ||
          dotpath('socket.remoteAddress')(req) ||
          dotpath('connection.socket.remoteAddress')(req) ||
          dotpath('remoteAddress')(req)
      }

      if (checks.some(check => new IpCheck(ip).match(check))) {
        if (whitelist) {
          return route(...args)
        }

        return onFail(...args)
      }

      if (whitelist) {
        return onFail(...args)
      }

      return route(...args)
    }
  }
}
