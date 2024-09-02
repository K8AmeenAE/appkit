import type { CaipNetwork } from '@web3modal/common'
import {
  AccountController,
  AssetUtil,
  ChainController,
  CoreHelperUtil,
  EventsController,
  NetworkController,
  RouterController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'
import { NetworkUtil } from '../../utils/NetworkUtil.js'

@customElement('w3m-networks-view')
export class W3mNetworksView extends LitElement {
  public static override styles = styles
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() public network = NetworkController.state.caipNetwork

  @state() public requestedCaipNetworks = NetworkController.getRequestedCaipNetworks()

  @state() private filteredNetworks?: CaipNetwork[]

  @state() private search = ''

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
    this.unsubscribe.push(
      NetworkController.subscribeKey('caipNetwork', val => (this.network = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      ${this.templateSearchInput()}
      <wui-flex
        class="container"
        .padding=${['0', 's', 's', 's'] as const}
        flexDirection="column"
        gap="xs"
      >
        ${this.networksTemplate()}
      </wui-flex>

      <wui-separator></wui-separator>

      <wui-flex padding="s" flexDirection="column" gap="m" alignItems="center">
        <wui-text variant="small-400" color="fg-300" align="center">
          Your connected wallet may not support some of the networks available for this dApp
        </wui-text>
        <wui-link @click=${this.onNetworkHelp.bind(this)}>
          <wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></wui-icon>
          What is a network
        </wui-link>
      </wui-flex>
    `
  }

  // Private Methods ------------------------------------- //
  private templateSearchInput() {
    return html`
      <wui-flex gap="xs" .padding=${['0', 's', 's', 's'] as const}>
        <wui-input-text
          @inputChange=${this.onInputChange.bind(this)}
          class="network-search-input"
          size="md"
          placeholder="Search network"
          icon="search"
        ></wui-input-text>
      </wui-flex>
    `
  }

  private onInputChange(event: CustomEvent<string>) {
    this.onDebouncedSearch(event.detail)
  }

  private onDebouncedSearch = CoreHelperUtil.debounce((value: string) => {
    this.search = value
  }, 100)

  private onNetworkHelp() {
    EventsController.sendEvent({ type: 'track', event: 'CLICK_NETWORK_HELP' })
    RouterController.push('WhatIsANetwork')
  }

  private networksTemplate() {
    const requestedCaipNetworks = NetworkController.getRequestedCaipNetworks()

    const approvedCaipNetworkIds = NetworkController.state.approvedCaipNetworkIds
    const supportsAllNetworks = NetworkController.state.supportsAllNetworks

    const walletId = localStorage.getItem('@w3m/wallet_id')
    const connectorId = localStorage.getItem('@w3m/connected_connector')

    const sortedNetworks = CoreHelperUtil.sortRequestedNetworks(
      approvedCaipNetworkIds,
      requestedCaipNetworks
    )

    if (this.search) {
      this.filteredNetworks = sortedNetworks?.filter(
        network => network?.name?.toLowerCase().includes(this.search.toLowerCase())
      )
    } else {
      this.filteredNetworks = sortedNetworks
    }

    return this.filteredNetworks?.map(
      network => html`
        <wui-list-network
          .selected=${this.network?.id === network.id}
          imageSrc=${ifDefined(AssetUtil.getNetworkImage(network))}
          type="network"
          name=${network.name ?? network.id}
          @click=${() => this.onSwitchNetwork(network)}
          .disabled=${walletId === 'walletConnect' || connectorId === 'WALLET_CONNECT'
            ? !supportsAllNetworks && !approvedCaipNetworkIds?.includes(network.id)
            : !supportsAllNetworks &&
              !approvedCaipNetworkIds?.includes(network.id) &&
              network.chainNamespace === ChainController.state.activeChain}
          data-testid=${`w3m-network-switch-${network.name ?? network.id}`}
        ></wui-list-network>
      `
    )
  }

  private async onSwitchNetwork(network: CaipNetwork) {
    console.log(network, 'Switch Network 1')

    const isConnected = AccountController.state.isConnected
    const isNetworkChainConnected = AccountController.getChainIsConnected(network.chainNamespace)
    const allApprovedCaipNetworks = ChainController.getAllApprovedCaipNetworks()
    const walletId = localStorage.getItem('@w3m/wallet_id')
    const connectorId = localStorage.getItem('@w3m/connected_connector')

    const supportsAllNetworks = NetworkController.state.supportsAllNetworks
    const caipNetwork = NetworkController.state.caipNetwork
    const routerData = RouterController.state.data

    if (isConnected && caipNetwork?.id !== network.id) {
      console.log(network, 'Switch Network 2')
      if (!isNetworkChainConnected && walletId !== 'walletConnect') {
        console.log(network, 'Switch Network 3')
        RouterController.push('SwitchActiveChain', {
          switchToChain: network.chainNamespace,
          navigateTo: 'Connect',
          navigateWithReplace: true,
          network
        })
      } else if (
        allApprovedCaipNetworks?.includes(network.id) ||
        walletId === 'walletConnect' ||
        connectorId === 'WALLET_CONNECT'
      ) {
        console.log(network, 'Switch Network 4')
        await NetworkController.switchActiveNetwork(network)
        await NetworkUtil.onNetworkChange()
      } else if (supportsAllNetworks) {
        console.log(network, 'Switch Network 5')
        RouterController.push('SwitchNetwork', { ...routerData, network })
      } else {
        console.log(network, 'Switch Network 6')
        await NetworkController.switchActiveNetwork(network)
        await NetworkUtil.onNetworkChange()
      }
    } else if (!isConnected) {
      NetworkController.setActiveCaipNetwork(network)
      if (!isNetworkChainConnected) {
        if (ChainController.state.noAdapters) {
          RouterController.push('ConnectingWalletConnect')
        } else {
          RouterController.push('Connect')
        }
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-networks-view': W3mNetworksView
  }
}
