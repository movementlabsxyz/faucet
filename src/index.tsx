import React from "react";
import ReactDOM from "react-dom";
import '@mysten/dapp-kit/dist/index.css';
import { type Chain } from 'viem'
import FaucetRoutes from "./FaucetRoutes";
import { http } from 'wagmi'

import {BrowserRouter} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {
  AptosWalletAdapterProvider,
} from "@aptos-labs/wallet-adapter-react";
import {PetraWallet} from "petra-plugin-wallet-adapter";
import {PontemWallet} from "@pontem/wallet-adapter-plugin";
import {MartianWallet} from "@martianwallet/aptos-wallet-adapter";
import {RiseWallet} from "@rise-wallet/wallet-adapter";
import {FewchaWallet} from "fewcha-plugin-wallet-adapter";
import {StatsigProvider} from "statsig-react";
import {BloctoWallet} from "@blocto/aptos-wallet-adapter-plugin";
import {NightlyWallet} from "@nightlylabs/aptos-wallet-adapter-plugin";
import {OpenBlockWallet} from "@openblockhq/aptos-wallet-adapter";
import {TokenPocketWallet} from "@tp-lab/aptos-wallet-adapter";
import {TrustWallet} from "@trustwallet/aptos-wallet-adapter";
import {WelldoneWallet} from "@welldone-studio/aptos-wallet-adapter";

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'

import { WagmiProvider } from 'wagmi'
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
 
// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
	m2: { url: 'https://sui.devnet.m2.movementlabs.xyz', language: 'sui' },
});


// 1. Your WalletConnect Cloud project ID
const projectId = '47763f0426c0cb4279a4ccfae07b46bf'

// 2. Create wagmiConfig
const metadata = {
  name: 'Movement Faucet',
  description: 'AppKit Example',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const mevmLegacy = {
  id: 30730,
  name: 'MEVM Legacy',
  nativeCurrency: {
    name:'Move', symbol: 'MOVE', decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://mevm.devnet.m1.movementlabs.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Movement Explorer', url: 'https://explorer.movementlabs.xyz' },
  },
} as const satisfies Chain

const chains = [mevmLegacy] as const
const config = defaultWagmiConfig({
  chains: chains,
  transports: {[mevmLegacy.id] : http('https://mevm.devnet.m1.movementlabs.xyz')},
  projectId,
  metadata,
})


createWeb3Modal({
  wagmiConfig: config,
  projectId,
})

// inform the compiler of the existence of the window.aptos API
declare global {
  interface Window {
    aptos: any;
  }
}

const queryClient = new QueryClient();

const wallets = [
  new PetraWallet(),
  new PontemWallet(),
  new MartianWallet(),
  new FewchaWallet(),
  new RiseWallet(),
  new NightlyWallet(),
  new OpenBlockWallet(),
  new TokenPocketWallet(),
  new TrustWallet(),
  new WelldoneWallet(),
];

ReactDOM.render(
  <React.StrictMode>
    <StatsigProvider
      sdkKey={
        process.env.REACT_APP_STATSIG_SDK_KEY ||
        "client-gQ2Zhz3hNYRf6CSVaczkQcZfK0yUBv5ln42yCDzTwbr"
      }
      waitForInitialization={true}
      options={{
        environment: {tier: process.env.NODE_ENV},
      }}
      user={{}}
    >
      <QueryClientProvider client={queryClient}>
        <QueryClientProvider client={queryClient}>
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="m2">
        <WalletProvider>
        <WagmiProvider config={config}>
          <BrowserRouter>
          <FaucetRoutes />
          </BrowserRouter>
          </WagmiProvider>
          </WalletProvider>
          </SuiClientProvider>
          </AptosWalletAdapterProvider>
          </QueryClientProvider>
      </QueryClientProvider>
    </StatsigProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);