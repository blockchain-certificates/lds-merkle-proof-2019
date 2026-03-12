import Keymap from './Keymap'

import cbor from 'cbor'
import multibase from 'multibase'

function invert (obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
}

function invertBy (obj, fn) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const k = fn(value);
    (acc[k] ||= []).push(key);
    return acc;
  }, {});
}

class Decoder {
  constructor(base58) {
    const valid = multibase.isEncoded(base58)
    if (!valid)
      throw new Error('Base58 string is invalid. Cannot construct Decoder.')

    this.base58 = base58
  }

  constructRootJSON(decoded) {
    // invert
    const rootKeymap = invert(Keymap.root)

    return decoded.reduce((acc, val) => {
      const key = rootKeymap[val[0]]
      let value = val[1]

      if (value instanceof Array) {
        if (key === 'anchors') {
          value = this.constructAnchorsJSON(value)
        }
        if (key === 'path') {
          value = this.constructPathJSON(value)
        }
      }

      if (value instanceof Buffer || value instanceof Uint8Array) {
        value = cbor.decode(value).toString('hex')
      }

      acc[key] = value
      return acc
    }, {})
  }

  constructAnchorsJSON(anchors) {
    const chainKeymap = invertBy(Keymap.chain, (value) => value.id)

    return anchors.map((anchor) =>
      anchor.reduce((acc, val) => {
        if (val[0] === 0) {
          return `${acc}:${chainKeymap[val[1]]}`
        }
        if (val[0] === 1) {
          const chain = acc.split(':').pop()
          const networkKeymap = invert(Keymap.chain[chain].networks)
          return `${acc}:${networkKeymap[val[1]]}`
        }

        return `${acc}:${cbor.decode(val[1]).toString('hex')}`
      }, 'blink')
    )
  }

  constructPathJSON(path) {
    const pathKeymap = invert(Keymap.path)
    return path.map(item => {
      return {
        [pathKeymap[item[0]]]: cbor.decode(item[1]).toString('hex')
      }
    })
  }

  decode() {
    const encoded = multibase.decode(this.base58)
    const map = cbor.decode(encoded)
    const json = this.constructRootJSON(map)

    return json
  }
}

module.exports = Decoder
