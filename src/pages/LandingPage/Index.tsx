import React, { useState } from 'react';
import { requestFromFaucet, requestFaucet, mevmRequestFaucet, m2RequestFaucet } from '../../api';
import { AptosClient, FaucetClient, CoinClient } from 'aptos';
import { Aptos, AptosConfig, AccountAddressInput } from '@aptos-labs/ts-sdk';
import Chain from '../../components/Chain';
import { ToggleButton, ToggleButtonGroup, Button, Select, FormControl,InputLabel,MenuItem } from '@mui/material';
import { Network } from '../../utils';
import Box from "@mui/material/Box";
import "./hover.css"
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {WalletConnector} from "../../components/wallet/WalletConnector";
import { ConnectButton } from '@mysten/dapp-kit';
import { useWriteContract } from 'wagmi'
import evmTokensAbi from '../../abi/evmTokensAbi.json';

const aptosFaucetAddress = '0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f';

const CHAIN = {
  movement: {network: 'testnet', url: 'https://aptos.testnet.suzuka.movementlabs.xyz/v1', faucetUrl: 'https://faucet.testnet.suzuka.movementlabs.xyz', language: 'aptos'},
  m1: {network: 'devnet', url: 'https://aptos.devnet.m1.movementlabs.xyz', language: 'aptos'},
  mevm: {network: 'devnet', url: 'https://mevm.devnet.m1.movementlabs.xyz', language: 'evm'},
  m2: {network: 'devnet', url: 'https://sui.devnet.m2.movementlabs.xyz/faucet/web', language: 'sui'}
};


export default function LandingPage() {
  const [network, setNetwork] = useState('mevm');
  const [mock, setMock] = useState('aptos');
  const [token, setToken] = useState('USDC');
  const {account} = useWallet();
  const { data: hash, writeContract } = useWriteContract()

  const handleMint =() => {
    if (mock == 'aptos') {
      aptosMint();
    } else if (mock == 'evm') {
      evmMint();
    } else if (mock == 'sui') {
      suiMint();
    }
  }

  function aptosMint() {
    const aptosClient = new Aptos(new AptosConfig({fullnode: CHAIN.movement.url, faucet: CHAIN.movement.faucetUrl}));
    aptosClient.transaction.build.simple({
      sender: account?.address as AccountAddressInput,
      data: {
        function: `${aptosFaucetAddress}::tokens::mint`,
        typeArguments: [`${aptosFaucetAddress}::tokens::${token}`],
        functionArguments: []
      }
    })
  }

  function evmMint() {
    const tokenAddresses = {
      USDC: '0xdfd318a689EF63833C4e9ab6Da17F0d5e3010013',
      USDT: '0x3150DC83cc9985f2433E546e725C9B5E6feb2E8c',
      WBTC: '0x8507bC108d0e8b8bd404d04084692B118B4F8332',
      WETH: '0x56c035c3f0e8e11fA34F79aaEf6a28A4cc8e31a8'
    }

    writeContract({
      address: tokenAddresses[token as keyof typeof tokenAddresses] as `0x${string}`,
      abi: evmTokensAbi,
      functionName: 'mint',
    })
    
  }

  function suiMint() {

  }

  const handleNetwork = (event: any, value: any) => {
    if (value !== null) {
      setNetwork(value);
    }
  };

  const handleChange = (e : any) => {
    setMock(e.target.value);
  };

  const handleTokenChange = (e : any) => {
    setToken(e.target.value);
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

  const style = { width: "100%", height: "5rem", lineHeight: 0.5, fontFamily: "TWKEverett-Medium", textAlign: "center", color: "white" }
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
      <Chain name="M1" eventName="m1_apt_request" language={CHAIN.m1.language} amount={1} isEvm={false} network={network} faucetRequest={m1FaucetRequest} />
      <Chain name="MEVM" eventName="m1_evm_request" language={CHAIN.mevm.language} amount={1} isEvm={true} network={network} faucetRequest={handleM1evmFaucetRequest} />
      <Chain name="M2" eventName="m2_sui_request" language={CHAIN.m2.language} amount={1} isEvm={false} network={network} faucetRequest={m2FaucetRequest} /> 
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        <div>
          <div>
            <h3 style={{ fontFamily: "TWKEverett-Regular", textAlign: "left" }}>Testnets</h3>
          </div>
          <div className="network">
          
            <Button
              href={'https://discord.com/channels/1101576619493167217/1255138490992037968'}
              target={'_blank'}
              sx={style}>
               {/* @ts-ignore */}
              <div style={style}><h2>Movement</h2>{"{APTOS}"}</div>
            </Button>
          </div>
        </div>
        <div style={{ margin: "0 2rem" }}>
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
              {/* <ToggleButton sx={{ ...style }} value="m1">
                <div style={text}><h2>M1</h2>{"{APTOS}"}</div>
              </ToggleButton> */}
              <ToggleButton sx={{ ...style }} value="mevm">
                <div style={text}><h2>M1</h2>{"{MEVM}"}</div>
              </ToggleButton>
              <ToggleButton sx={{ ...style }} value="m2">
                <div style={text}><h2>M2</h2>{"{SUI}"}</div>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>
      </div>
      <div>
          <div>
            <h3 style={{ fontFamily: "TWKEverett-Regular", textAlign: "left" }}>Mint Mock Tokens</h3>
          </div>
          <div>
            <p style={{ fontFamily: "TWKEverett-Regular", textAlign: "left" }}>Mock tokens available for networks above. Hourly rate limit.</p>
          </div>
          <div style={{ display: "flex"}}>
          <FormControl fullWidth style={{margin: '1rem'}}>
            <InputLabel id="demo-simple-select-label">Network</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={mock}
              label="Network"
              onChange={handleChange}
            >
              <MenuItem value={'aptos'}>Aptos</MenuItem>
              <MenuItem value={'evm'}>EVM</MenuItem>
              <MenuItem value={'sui'}>Sui</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth style={{margin: '1rem'}}>
            <InputLabel id="token-label">Token</InputLabel>
            <Select
              labelId="token-label"
              id="token-select"
              value={token}
              label="Token"
              onChange={handleTokenChange}
            >
              <MenuItem value={'USDC'}>USDC</MenuItem>
              <MenuItem value={'USDT'}>USDT</MenuItem>
              <MenuItem value={'WBTC'}>WBTC</MenuItem>
              <MenuItem value={'WETH'}>WETH</MenuItem>
            </Select>
          </FormControl>
          </div>

          <div>

            {mock == 'aptos' && <><WalletConnector
            networkSupport={"testnet"}
            handleNavigate={() => `https://explorer.movementlabs.xyz/account/${account?.address}`}
            modalMaxWidth="sm" /><Button sx={style} onClick={(handleMint)}>Mint</Button></>}
            {mock == 'evm' && <w3m-button />}
            {mock == 'sui' && <ConnectButton />}
          </div>
        
      </div>
    </Box>
    </>
  );
}
