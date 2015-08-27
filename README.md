# deter

Send a request to a default route using an IP whitelist/blacklist

[![Build Status][buildstatusimg]][buildstatus]
[![npm install][npminstallimg]][npminstall]
[![js-standard-style][jsstandardimg]][jsstandard]

## Example

```javascript
const filterRoute = deter(
  {whitelist: ['127.0.0.1', '172.16.18.0/24', '::1']}, // ipv6! wow!
  onBadIp
)

const server = http.createServer(filterRoute(onGoodIp))

server.listen(8080)

function onBadIp(req, res) {
  res.statusCode = 403
  res.end()
}

function onGoodIp(req, res) {
  res.statusCode = 200
  res.end(`you're in!`)
}
```

## API

`deter(options, [defaultRoute], [lookup]) -> function`

- `options` (object) an options object, with only one of the following keys; you
  can choose a whitelist or a blacklist, but not both:
    - `whitelist` (array) a list of CIDR strings that should be allowed through
    - `blacklist` (array) a list of CIDR strings that should be denied
- `defaultRoute` (optional, function) a route to be processed if a request fails
  the whitelist/blacklist. If this is not provided, a 403 will be sent to a
  failed route.
- `lookup` (optional, function) a lookup function that gets the IP address from
  the request object; by default, this looks at any place the node http server
  might put an address (see the section on addresses for details). If you need
  to get an IP from a `x-forwarded-for` header, say, you can provide your own
  lookup function, with this form:
    - `lookup(requestObject) -> ip (string)`

## Notes

- If you provide an invalid IP or CIDR in the whitelist/blacklist, the
  constructor will `throw`; if this is a problem for you, be sure to `try/catch`
- ipv6 is supported, including CIDR notation
- `deter` expects to route on a message whose first parameter is a
  [`http.IncomingMessage`][httpincoming], and the second parameter is a
  [`http.ServerResponse`][httpresponse], conforming to the node.js HTTP/HTTPS
  servers.
- Deter looks for addresses in the following places, which should cover all of
  the major node versions:
    - `request.connection.remoteAddress`
    - `request.socket.remoteAddress`
    - `request.connection.socket.remoteAddress`

If you need to look elsewhere for an address: don't fret, just provide your own
lookup function:

```javascript
const filterRoute = deter(
  {whitelist: ['127.0.0.1', '172.16.18.0/24']},
  onBadIp,
  lookup
)

const server = http.createServer(filterRoute(onGoodIp))

server.listen(8080)

function lookup(req) {
  if (req.headers && req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'].split(',')[0]
  }
}
```

## License

Apache 2.0, see [LICENSE](./LICENSE) for details.

[httpincoming]: https://iojs.org/api/http.html#http_http_incomingmessage
[httpresponse]: https://iojs.org/api/http.html#http_class_http_serverresponse
[buildstatus]: https://travis-ci.org/fardog/deter
[npminstall]: https://www.npmjs.org/package/deter
[jsstandard]: https://github.com/feross/standard
[buildstatusimg]: http://img.shields.io/travis/fardog/deter/master.svg?style=flat-square
[npminstallimg]: http://img.shields.io/npm/dm/deter.svg?style=flat-square
[jsstandardimg]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
