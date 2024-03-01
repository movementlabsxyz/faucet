import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Assuming you're using React Router v6
import { requestFaucet, mevmRequestFaucet, m2RequestFaucet } from '../../api';
import { AptosClient, FaucetClient, CoinClient } from 'aptos';
import Chain from '../../components/Chain';
import { FormControlLabel } from '@mui/material';
import { Switch } from '@mui/material';
import { Container } from '@mui/system';
import { Network } from '../../utils';

const NETWORK_URLS = {
  testnet: {
    M1_URL: 'https://aptos.testnet.m1.movementlabs.xyz',
    M1_FAUCET_URL: 'https://aptos.testnet.m1.movementlabs.xyz',
    MEVM_M1_URL: 'https://mevm.testnet.m1.movementlabs.xyz',
    M2_URL: 'https://sui.devnet.m2.movementlabs.xyz/faucet',
  },
  devnet: {
    M1_URL: 'https://aptos.devnet.m1.movementlabs.xyz',
    M1_FAUCET_URL: 'https://aptos.devnet.m1.movementlabs.xyz',
    MEVM_M1_URL: 'https://mevm.devnet.m1.movementlabs.xyz',
    M2_URL: 'https://sui.devnet.m2.movementlabs.xyz/faucet',
  },
};

export default function LandingPage() {
  const [searchParams] = useSearchParams(); // Reads the network param from the URL
  const network = searchParams.get('network');
  const navigate = useNavigate();
  const [currentNetwork, setCurrentNetwork] = useState(Network.Devnet);

  // URLs based on the current network
  const { M1_URL, M1_FAUCET_URL, MEVM_M1_URL, M2_URL } = NETWORK_URLS[currentNetwork] || NETWORK_URLS.devnet;

  const faucetClient = new FaucetClient(M1_URL, M1_FAUCET_URL);
  const aptosClient = new AptosClient(M1_URL);
  const coinClient = new CoinClient(aptosClient);

  useEffect(() => {
    // Update state based on the URL parameter
    if (network && Object.values(Network).includes(network as Network)) {
      setCurrentNetwork(network as Network);
    }
  }, [network]);

  const toggleNetwork = () => {
    const newNetwork = currentNetwork === Network.Devnet ? Network.Testnet : Network.Devnet;
    setCurrentNetwork(newNetwork);
    navigate(`/?network=${newNetwork}`); // Update the URL to reflect the new network
  };

  const m1FaucetRequest = async (address: string) => {
    return requestFaucet(
      aptosClient,
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
      <Chain name="M1" amount={10} hasEvm={true} hasTestnet={true} network={currentNetwork} toggleNetwork={toggleNetwork} set faucetRequest={m1FaucetRequest} evmRequest={handleM1evmFaucetRequest} />
      <Chain name="M2" amount={1000} hasEvm={false} faucetRequest={m2FaucetRequest} evmRequest={handleM1evmFaucetRequest} />
    </>
  );
}
