import { describe, test, expect } from 'vitest';

import Encoder from '../Encoder'
import Decoder from '../Decoder'
import Keymap from '../Keymap'
import baseSepoliaProofValue from './baseSepoliaProofValue.json'

describe('Base chain support', () => {
  test('Keymap exposes base chain with sepolia + mainnet networks', () => {
    expect(Keymap.chain.base).toBeDefined()
    expect(Keymap.chain.base.id).toBe(3)
    expect(Keymap.chain.base.networks.mainnet).toBe(8453)
    expect(Keymap.chain.base.networks.sepolia).toBe(84532)
  })

  test('Encoder accepts a blink:base:sepolia:<tx> anchor without throwing', () => {
    const encoder = new Encoder(baseSepoliaProofValue)
    const result = encoder.encode()

    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    // Multibase base58btc prefix
    expect(result.startsWith('z')).toBe(true)
  })

  test('Encoder -> Decoder roundtrip preserves the full proofValue', () => {
    const encoded = new Encoder(baseSepoliaProofValue).encode()
    const decoded = new Decoder(encoded).decode()

    expect(decoded).toEqual(baseSepoliaProofValue)
  })

  test('anchor string round-trips with base:sepolia chain + network prefix', () => {
    const encoded = new Encoder(baseSepoliaProofValue).encode()
    const decoded = new Decoder(encoded).decode()

    expect(decoded.anchors).toHaveLength(1)
    expect(decoded.anchors[0]).toBe(baseSepoliaProofValue.anchors[0])
    expect(decoded.anchors[0].startsWith('blink:base:sepolia:')).toBe(true)
  })

  test('base mainnet anchor also round-trips', () => {
    const mainnetProof = {
      ...baseSepoliaProofValue,
      anchors: [
        'blink:base:mainnet:e80a909ec865513e27e01af27c1599e67406e7d6bcf1280c10e3fb148e5702e0'
      ]
    }
    const encoded = new Encoder(mainnetProof).encode()
    const decoded = new Decoder(encoded).decode()

    expect(decoded).toEqual(mainnetProof)
  })
})
