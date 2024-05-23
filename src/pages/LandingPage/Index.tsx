import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Assuming you're using React Router v6
import { requestFaucet, mevmRequestFaucet, m2RequestFaucet } from '../../api';
import { AptosClient, FaucetClient, CoinClient } from 'aptos';
import Chain from '../../components/Chain';
import { FormControlLabel } from '@mui/material';
import { Switch } from '@mui/material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Network } from '../../utils';
import Box from "@mui/material/Box";


const NETWORK_URLS = {
  testnet: {
    M1_URL: 'https://aptos.testnet.m1.movementlabs.xyz',
    M1_FAUCET_URL: 'https://aptos.testnet.m1.movementlabs.xyz',
    MEVM_M1_URL: 'https://mevm.testnet.m1.movementlabs.xyz',
    M2_URL: 'https://sui.devnet.m2.movementlabs.xyz/faucet/web',
  },
  devnet: {
    M1_URL: 'https://aptos.devnet.m1.movementlabs.xyz',
    M1_FAUCET_URL: process.env.APTOS_DEVNET_M1_FAUCET_URL||'https://aptos.devnet.m1.movementlabs.xyz/batch_mint',
    MEVM_M1_URL: process.env.APTOS_DEVNET_MEVM_M1_URL||'https://mevm.devnet.m1.movementlabs.xyz',
    M2_URL: process.env.APTOS_DEVNET_M2_FAUCET_URL||'https://sui.devnet.m2.movementlabs.xyz/faucet/web',
  },
};


export default function LandingPage() {
  const [searchParams] = useSearchParams(); // Reads the network param from the URL
  const network = searchParams.get('network');
  const navigate = useNavigate();
  const [currentNetwork, setCurrentNetwork] = useState(Network.Devnet);
  const [language, setLanguage] = useState('aptos');

  

  const handleLanguage = (event: any, newLanguage: any) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage);
    }
  };

  // URLs based on the current network
  const { M1_URL, M1_FAUCET_URL, MEVM_M1_URL, M2_URL } = NETWORK_URLS[currentNetwork] || NETWORK_URLS.devnet;

  // const faucetClient = new FaucetClient(M1_URL, M1_FAUCET_URL);
  const aptosClient = new AptosClient(M1_URL);
  const coinClient = new CoinClient(aptosClient);

  const toggleNetwork = () => {
    const newNetwork = currentNetwork === Network.Devnet ? Network.Testnet : Network.Devnet;
    setCurrentNetwork(newNetwork);
    navigate(`/?network=${newNetwork}`); // Update the URL to reflect the new network
  };

  const m1FaucetRequest = async (address: string,token:string) => {
    return requestFaucet(
      aptosClient,
      M1_FAUCET_URL,
      address,
      token
    );
  };

  const m2FaucetRequest = async (address: string,token:string) => {
    return m2RequestFaucet(
      M2_URL,
      address,
      token
    )
  };

  const handleM1evmFaucetRequest = async (address: string,token:string) => {
    return mevmRequestFaucet(
      MEVM_M1_URL,
      address,
      token
    )
  };

  const style = { width: "100%", height: "5rem", lineHeight: 0.5, fontFamily: "TWKEverett-Medium" }
  const text = { width: "100px", height: "5rem", lineHeight: 0.5, fontFamily: "TWKEverett-Medium" }

  return (
    <><Box
    sx={{
      fontFamily: "TWKEverett-Medium",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      poisition: 'relative',

    }} >
      <div style={{ width: "300px" }}>
          <h1 style={{ textAlign: "left" }}>Faucets</h1>
      </div>
      <Chain name="Aptos" eventName="m1_apt_request" language={language} amount={1} isEvm={false} hasTestnet={false} network={currentNetwork} faucetRequest={m1FaucetRequest} /> 
      <Chain name="MEVM" eventName="m1_evm_request" language={language} amount={1} isEvm={true} hasTestnet={false} network={currentNetwork}faucetRequest={handleM1evmFaucetRequest} />
      <Chain name="Sui" eventName="m2_sui_request" language={language} amount={1} isEvm={false} hasTestnet={false} network={currentNetwork} faucetRequest={m2FaucetRequest} />
            
      <ToggleButtonGroup
      color="primary"

        value={language}
        exclusive
        onChange={handleLanguage}
      >
        <ToggleButton  
          sx={style} value="aptos">
          <div style={text}><h1>M1</h1>{"{APTOS}"}</div>
        </ToggleButton>
        <ToggleButton sx={style} value="mevm">
          <div style={text}><h1>M1</h1>{"{MEVM}"}</div>
        </ToggleButton>
        <ToggleButton sx={style} value="sui">
          <div style={text}><h1>M2</h1>{"{SUI}"}</div>
        </ToggleButton>
      </ToggleButtonGroup>
      </Box>
    </>
  );
}
