import { validate } from './schema'
import Keymap from './Keymap'

import cbor from 'cbor'
import * as base58 from 'base58-universal'

class Encoder {
  constructor(json) {
    const valid = validate(json)
    if (!valid)
      throw new Error('JSON is invalid. Cannot construct Encoder.')

    this.json = json
  }

  constructRootMap() {
    return Object.keys(this.json).map(key => {
      let value = this.json[key]
      if (typeof value === 'string') {
        value = cbor.encode(Buffer.from(value, 'hex'))
      }
      if (value instanceof Array) {
        if (key === 'anchors') {
          value = this.constructAnchorsMap(value)
        }

        if (key === 'path') {
          value = this.constructPathMap(value)
        }
      }

      return [Keymap.root[key], value]
    })
  }

  constructAnchorsMap(anchors) {
    return anchors.map(anchor => {
      let values = anchor.split(':')
      values.shift()

      return values.map((value, index) => {
        if (index === 0) {
          return [index, Keymap.chain[value].id]
        }
        if (index === 1) {
          return [index, Keymap.chain[values[index - 1]].networks[value]]
        }
        return [index, cbor.encode(Buffer.from(value, 'hex')) ]
      })
    })
  }

  constructPathMap(path) {
    return path.flatMap(item =>
        Object.keys(item).map(key => [
          Keymap.path[key],
          cbor.encode(Buffer.from(item[key], 'hex'))
        ])
    )
  }

  encode() {
    const map = this.constructRootMap()
    const encoded = cbor.encode(map)
    return 'z' + base58.encode(encoded)
  }
}

export default Encoder
