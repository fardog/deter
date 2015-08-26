import IpCheck from 'ipcheck'
import arrayify from 'arrify'
import dotpath from 'dotpather'

export default deter

function deter ({whitelist, blacklist} = {}, _defaultRoute, _lookup) {
  if (!whitelist && !blacklist) {
    throw new Error(
      'One of `whitelist` or `blacklist` are required in the options object.'
    )
  } else if (whitelist && blacklist) {
    throw new Error(
      'You cannot define both a whitelist, and a blacklist; choose one'
    )
  }

  const onFail = _defaultRoute || defaultRoute
  const checks = []
  const list = whitelist ? arrayify(whitelist) : arrayify(blacklist)
  const lookup = _lookup || dotpath('connection.remoteAddress')

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

    function doCheck (req, res) {
      const ip = lookup(req)

      if (checks.some(check => new IpCheck(ip).match(check))) {
        if (whitelist) {
          return route(req, res)
        }

        return onFail(req, res)
      }

      if (whitelist) {
        return onFail(req, res)
      }

      return route(req, res)
    }
  }
}

deter.defaultRoute = defaultRoute

function defaultRoute (req, res) {
  res.statusCode = 403
  res.end()
}
