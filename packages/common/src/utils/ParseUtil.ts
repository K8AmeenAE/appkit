import type { CaipAddress, CaipNetworkId, ChainId, ChainNamespace } from './TypeUtil.js'

type ParsedCaipAddress = {
  chainNamespace: ChainNamespace
  chainId: ChainId
  address: string
}

type ParsedCaipNetworkId = {
  chainNamespace: ChainNamespace
  chainId: ChainId
}

export const ParseUtil = {
  parseCaipAddress(caipAddress: CaipAddress): ParsedCaipAddress {
    const parts = caipAddress.split(':')
    if (parts.length !== 3) {
      throw new Error(`Invalid CAIP-10 address: ${caipAddress}`)
    }

    const [chainNamespace, chainId, address] = parts

    if (!chainNamespace || !chainId || !address) {
      throw new Error(`Invalid CAIP-10 address: ${caipAddress}`)
    }

    return { chainNamespace, chainId, address }
  },
  parseCaipNetworkId(caipNetworkId: CaipNetworkId): ParsedCaipNetworkId {
    const [chainNamespace, chainId] = caipNetworkId.split(':')

    if (!chainNamespace || !chainId) {
      throw new Error(`Invalid CAIP-2 network id: ${caipNetworkId}`)
    }

    return { chainNamespace, chainId }
  }
}