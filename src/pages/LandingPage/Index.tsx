import React, { useEffect, useState } from "react";
import { requestFaucet, mevmRequestFaucet, m2RequestFaucet } from "../../api";
import { AptosClient, FaucetClient, CoinClient } from "aptos";
import Chain from "../../components/Chain";


export default function LandingPage() {

  const [network, setNetwork] = useState("DEVNET" as string);

  // TODO: make RPCs dynamic
  const buildRPC = (chain: string, language: string) => {
    return `https://${language.toLowerCase()}.${network.toLowerCase()}.${chain.toLowerCase()}.movementlabs.xyz`;
  }

  type RPCType = {
    [key: string]: {
      [key: string]: {
        [key: string]: string;
      };
    };
  };

  const RPC : RPCType = {
    DEVNET: {
      M1: {
        APTOS: "https://devnet.m1.movementlabs.xyz/v1",
        MEVM: "https://mevm.devnet.m1.movementlabs.xyz/v1",
      },
      M2: {
        SUI: "https://devnet.m2.movementlabs.xyz/faucet",
      }
    },
    TESTNET: {
      M1: {
        APTOS: "https://aptos.testnet.m1.movementlabs.xyz",
        MEVM: "https://mevm.testnet.m1.movementlabs.xyz",
      },
      M2: {
        SUI: "https://sui.testnet.m2.movementlabs.xyz/faucet",
      }
    },
  };

  const m1FaucetRequest = async (address: string) => {
    return requestFaucet(
      RPC[network]["M1"]["APTOS"],
      address
    );
  };

  const m2FaucetRequest = async (address: string) => {
    return m2RequestFaucet(
      RPC[network]["M2"]["SUI"],
      address
    )
  };

  const handleM1evmFaucetRequest = async (address: string) => {
    return mevmRequestFaucet(
      RPC[network]["M1"]["MEVM"],
      address
    )
  };

  return (
    <>
      {/* <select onChange={(e) => setNetwork(e.target.value)} value={network}>
        <option value="DEVNET">DEVNET</option>
        <option value="TESTNET">TESTNET</option>
        <option value="MAINNET">MAINNET</option>
      </select> */}
      <Chain name="M1" amount={10} hasEvm={true} faucetRequest={m1FaucetRequest} evmRequest={handleM1evmFaucetRequest} />
      <Chain name="M2" amount={1000} hasEvm={false} faucetRequest={m2FaucetRequest} evmRequest={handleM1evmFaucetRequest} />
    </>
  );
}
