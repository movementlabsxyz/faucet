import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Assuming you're using React Router v6
import { requestFromFaucet, requestFaucet, mevmRequestFaucet, m2RequestFaucet } from '../../api';
import { AptosClient, FaucetClient, CoinClient } from 'aptos';
import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';
import Chain from '../../components/Chain';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Network } from '../../utils';
import Box from "@mui/material/Box";
import "./hover.css"


const CHAIN = {
  movement: {network: 'testnet', url: 'https://green.aptos.testnet.suzuka.movementlabs.xyz/v1', faucetUrl: 'https://green.faucet.testnet.suzuka.movementlabs.xyz', language: 'aptos'},
  m1: {network: 'devnet', url: 'https://aptos.devnet.m1.movementlabs.xyz', language: 'aptos'},
  mevm: {network: 'devnet', url: 'https://mevm.devnet.m1.movementlabs.xyz', language: 'evm'},
  m2: {network: 'devnet', url: 'https://sui.devnet.m2.movementlabs.xyz/faucet/web', language: 'sui'}
};


export default function LandingPage() {
  const [network, setNetwork] = useState('movement');
  const handleNetwork = (event: any, value: any) => {
    if (value !== null) {
      setNetwork(value);
    }
  };

  const movementFaucetRequest = async (address: string, token: string) => {
    const faucetClient = new FaucetClient(CHAIN.movement.url, CHAIN.movement.faucetUrl);
    const aptos = new Aptos(new AptosConfig({fullnode: CHAIN.movement.url, faucet: CHAIN.movement.faucetUrl}));
      return requestFromFaucet(
        faucetClient,
        aptos,
        address
      );
    };


  const m1FaucetRequest = async (address: string, token: string) => {
  const aptosClient = new AptosClient(CHAIN.movement.url);
    return requestFaucet(
      aptosClient,
      CHAIN.m1.url,
      address,
      token
    );
  };

  const m2FaucetRequest = async (address: string, token: string) => {
    return m2RequestFaucet(
      CHAIN.m2.url,
      address,
      token
    )
  };

  const handleM1evmFaucetRequest = async (address: string, token: string) => {
    return mevmRequestFaucet(
      CHAIN.mevm.url,
      address,
      token
    )
  };

  const style = { width: "100%", height: "5rem", lineHeight: 0.5, fontFamily: "TWKEverett-Medium" }
  const text = { width: "100px", height: "5rem", lineHeight: 0.5, fontFamily: "TWKEverett-Medium" }

  return (
    <><Box
      sx={{
        fontFamily: "TWKEverett-Regular",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        position: 'relative',

      }} >
      <div style={{ width: "300px" }}>
        <h1 style={{ textAlign: "left" }}>Faucets</h1>
      </div>
      <Chain name="Movement" eventName="movement_apt_request" language={CHAIN.movement.language} amount={10} isEvm={false} network={network} faucetRequest={movementFaucetRequest} />
      {/* <Chain name="M1" eventName="m1_apt_request" language={CHAIN.m1.language} amount={1} isEvm={false} network={network} faucetRequest={m1FaucetRequest} />
      <Chain name="MEVM" eventName="m1_evm_request" language={CHAIN.mevm.language} amount={1} isEvm={true} network={network} faucetRequest={handleM1evmFaucetRequest} />
      <Chain name="M2" eventName="m2_sui_request" language={CHAIN.m2.language} amount={1} isEvm={false} network={network} faucetRequest={m2FaucetRequest} /> */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        <div>
          <div>
            <h3 style={{ fontFamily: "TWKEverett-Regular", textAlign: "left" }}>Testnets</h3>
          </div>
          <div className="network">
          <ToggleButtonGroup
            color="primary"
            value={network}
            exclusive
            onChange={handleNetwork}
          >
            <ToggleButton
              sx={style} value="movement">
              <div style={style}><h2>Movement</h2>{"{APTOS}"}</div>
            </ToggleButton>
          </ToggleButtonGroup>
          </div>
        </div>
        {/* <div style={{ margin: "0 2rem" }}>
          <div style={{ width: "250px" }}>
            <h3 style={{ fontFamily: "TWKEverett-Regular", textAlign: "left"}}>Legacy Devnets</h3>
          </div>
          <div
            className="network"
          >
            <ToggleButtonGroup
              color="primary"
              value={network}
              exclusive
              onChange={handleNetwork}
            >
              <ToggleButton sx={{ ...style }} value="m1">
                <div style={text}><h2>M1</h2>{"{APTOS}"}</div>
              </ToggleButton>
              <ToggleButton sx={{ ...style }} value="mevm">
                <div style={text}><h2>M1</h2>{"{MEVM}"}</div>
              </ToggleButton>
              <ToggleButton sx={{ ...style }} value="m2">
                <div style={text}><h2>M2</h2>{"{SUI}"}</div>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div> */}
      </div>
    </Box>
    </>
  );
}
