import React, { useEffect } from "react";
import { requestFaucetWithGlobalSigner, mevmRequestFaucet, m2RequestFaucet } from "../../api";
import { AptosClient, FaucetClient, CoinClient } from "aptos";
import Chain from "../../components/Chain";

const M1_URL = "https://devnet.m1.movementlabs.xyz/v1";
const M1_FAUCET_URL = "https://devnet.m1.movementlabs.xyz/v1";
const MEVM_M1_URL = "https://mevm.devnet.m1.movementlabs.xyz/v1";
const M2_URL = "https://devnet.m2.movementlabs.xyz/faucet";
const faucetClient = new FaucetClient(M1_URL, M1_FAUCET_URL);
const aptosClient = new AptosClient(M1_URL);
const coinClient = new CoinClient(aptosClient);

export default function LandingPage() {


  const m1FaucetRequest = async (address: string) => {
    return requestFaucetWithGlobalSigner(
      aptosClient,
      faucetClient,
      coinClient,
      M1_FAUCET_URL,
      address
    );
  };

  const m2FaucetRequest = async (address: string) => {
    return m2RequestFaucet(
      M2_URL,
      address
    )
  };

  const handleM1evmFaucetRequest = async (address: string) => {
    return mevmRequestFaucet(
      MEVM_M1_URL,
      address
    )
  };

  return (
    <>
      <Chain name="M1" amount={10} hasEvm={true} faucetRequest={m1FaucetRequest} evmRequest={handleM1evmFaucetRequest} />
      <Chain name="M2" amount={1000} hasEvm={false} faucetRequest={m2FaucetRequest} evmRequest={handleM1evmFaucetRequest} />
    </>
  );
}
