import React from "react";
import ReactDOM from "react-dom";
import '@mysten/dapp-kit/dist/index.css';

import {BrowserRouter} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {
  AptosWalletAdapterProvider,
  NetworkName,
} from "@aptos-labs/wallet-adapter-react";
import {PetraWallet} from "petra-plugin-wallet-adapter";
import {PontemWallet} from "@pontem/wallet-adapter-plugin";
import {MartianWallet} from "@martianwallet/aptos-wallet-adapter";
import {RiseWallet} from "@rise-wallet/wallet-adapter";
import {FewchaWallet} from "fewcha-plugin-wallet-adapter";
// import {MSafeWalletAdapter} from "msafe-plugin-wallet-adapter";
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
import { arbitrum, mainnet } from 'wagmi/chains'
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
 
// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
	devnet: { url: 'https://sui.devnet.m2.movementlabs.xyz'},
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

const chains = [mainnet, arbitrum] as const
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})


import * as Sentry from "@sentry/react";
// import {BrowserTracing} from "@sentry/tracing";

import ReactGA from "react-ga4";
// import {initGTM} from "./api/hooks/useGoogleTagManager";
import {GTMEvents} from "./dataConstants";

// initGTM({
//   events: {
//     walletConnection: GTMEvents.WALLET_CONNECTION,
//     searchStats: GTMEvents.SEARCH_STATS,
//   },
// });

ReactGA.initialize(process.env.GA_TRACKING_ID || "G-8XH7V50XK7");

Sentry.init({
  dsn: "https://531160c88f78483491d129c02be9f774@o1162451.ingest.sentry.io/6249755",
  // integrations: [new BrowserTracing()],
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV == "production",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.5,
});

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
  // new MSafeWalletAdapter(),
  new NightlyWallet(),
  new OpenBlockWallet(),
  new TokenPocketWallet(),
  new TrustWallet(),
  new WelldoneWallet(),
  // Blocto supports Testnet/Mainnet for now.
  new BloctoWallet({
    network: NetworkName.Testnet,
    bloctoAppId: "6d85f56e-5f2e-46cd-b5f2-5cf9695b4d46",
  }),
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
        <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
        <WalletProvider>
          <BrowserRouter>
          </BrowserRouter>
          </WalletProvider>
          </SuiClientProvider>
          </AptosWalletAdapterProvider>
          </QueryClientProvider>
      </QueryClientProvider>
    </StatsigProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);