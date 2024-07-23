import React, { useState, useEffect } from 'react';
import { requestFromFaucet, requestFaucet, mevmRequestFaucet, m2RequestFaucet } from '../../api';
import { AptosClient, FaucetClient, CoinClient } from 'aptos';
import { Aptos, AptosConfig, TypeArgument } from '@aptos-labs/ts-sdk';
import { CircularProgress, Alert } from '@mui/material';

import Chain from '../../components/Chain';
import { ToggleButton, ToggleButtonGroup, Button, Select, FormControl, InputLabel, MenuItem } from '@mui/material';
import Box from "@mui/material/Box";
import "./hover.css"
import { InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletConnector } from "../../components/wallet/WalletConnector";
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useWriteContract } from 'wagmi'
import evmTokensAbi from '../../abi/evmTokensAbi.json';
import { Transaction } from "@mysten/sui/transactions";
import useSubmitTransaction from "../../api/hooks/useSubmitTransaction";
import { set } from 'lodash';

const aptosFaucetAddress = '0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f';
const CHAIN = {
  movement: { network: 'testnet', url: 'https://aptos.testnet.suzuka.movementlabs.xyz/v1', faucetUrl: 'https://faucet.testnet.suzuka.movementlabs.xyz', language: 'aptos' },
  m1: { network: 'devnet', url: 'https://aptos.devnet.m1.movementlabs.xyz', language: 'aptos' },
  mevm: { network: 'devnet', url: 'https://mevm.devnet.m1.movementlabs.xyz', language: 'evm' },
  m2: { network: 'devnet', url: 'https://sui.devnet.m2.movementlabs.xyz/faucet/web', language: 'sui' }
};


export default function LandingPage() {
  const [network, setNetwork] = useState('mevm');
  const [mock, setMock] = useState('aptos');
  const [token, setToken] = useState('USDC');
  const { data: hash, writeContractAsync } = useWriteContract()
  const { submitTransaction } = useSubmitTransaction()
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const PACKAGE_ID = "0x457abead7283c8af79b0902e71decf173f88624fe8dd2e76be97b6132c39e9c9";

  const handleMint = async () => {
    setLoading(true);

    let status = false;
    let res = null;
    if (mock == 'aptos') {
      res = aptosMint();
    } else if (mock == 'evm') {
      res = evmMint();
    } else if (mock == 'sui') {
      res = suiMint();
    }
    const response = await res;
    if (response == null) {
      setErrorMessage("Failed to mint token.");
    } else if (response) {
      {
        setSuccess(true);
        status = true;
      }
    }
    setLoading(false)
  }

  async function aptosMint() {
    console.log('minting aptos')
    const payload: InputTransactionData = {
      data: {
        function: `${aptosFaucetAddress}::faucet::mint`,
        typeArguments: [`${aptosFaucetAddress}::tokens::${token}` as TypeArgument],
        functionArguments: []
      }
    }
    const response = await submitTransaction(payload);
    setDigest(response);
  }

  async function evmMint() {
    const tokenAddresses = {
      USDC: '0xdfd318a689EF63833C4e9ab6Da17F0d5e3010013',
      USDT: '0x3150DC83cc9985f2433E546e725C9B5E6feb2E8c',
      WBTC: '0x8507bC108d0e8b8bd404d04084692B118B4F8332',
      WETH: '0x56c035c3f0e8e11fA34F79aaEf6a28A4cc8e31a8'
    }

    const response = await writeContractAsync({
      address: tokenAddresses[token as keyof typeof tokenAddresses] as `0x${string}`,
      abi: evmTokensAbi,
      functionName: 'mint',
    })

    setDigest(response);
  }

  async function suiMint() {
    const tokenMint = `${PACKAGE_ID}::${token.toLowerCase()}::${token}`
    const valueOpt = {
      'USDC': 60000000000,
      'USDT': 60000000000000,
      'WBTC': 1000000000,
      'WETH': 17000000000
    }

    const value = valueOpt[token as keyof typeof valueOpt]

    if (value === 0) {
      console.error('Unknown token type');
      return;
    }

    const treasury = {
      'WBTC': `0x0401a6b9b03b694d16fe9806389625beb6d801f64a188d39aecfc090c5dce2fd`,
      'USDC': `0x1292ab377437c97bc6dfead6b502c0a40c1cdd84d3b5c7c98ad6a303bec52897`,
      'WETH': `0x2edacfae4858522ae6cff36d8acc05a255b9b4403bd7e56d9b0ca6664edc25be`,
      'USDT': `0x54e04baa0fa5bf840efb48e44afb1c388690e8d52cf874a012edaa5fa487ab27`
    }
    console.log('minting sui', tokenMint)


    const transaction = new Transaction();
    const treasuryAddress = treasury[token as keyof typeof treasury];

    transaction.moveCall({
      target: '0x2::coin::mint_and_transfer',
      typeArguments: [tokenMint],
      arguments: [
        transaction.object(treasuryAddress),
        transaction.pure.u64(value),
        transaction.pure.address(account?.address as string)
      ],
    })

    await signAndExecuteTransaction(
      {
        transaction,
        //chain: 'sui:m2',
      },
      {
        onSuccess: (result) => {
          console.log('executed transaction', result);
          setDigest(result.digest);
          return result
        },
      },
    );

  }

  const handleNetwork = (event: any, value: any) => {
    if (value !== null) {
      setNetwork(value);
    }
  };

  const handleChange = (e: any) => {
    setMock(e.target.value);
  };

  const handleTokenChange = (e: any) => {
    setToken(e.target.value);
  };

  const movementFaucetRequest = async (address: string, token: string) => {
    const faucetClient = new FaucetClient(CHAIN.movement.url, CHAIN.movement.faucetUrl);
    const aptos = new Aptos(new AptosConfig({ fullnode: CHAIN.movement.url, faucet: CHAIN.movement.faucetUrl }));
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

  useEffect(() => {

    const timeout = setTimeout(() => {
        setSuccess(false);
        setErrorMessage(null);
    }, 3000);

    return () => {
        clearTimeout(timeout);
    };

}, [success, errorMessage]);

  const style = { width: "100%", height: "5rem", lineHeight: 0.5, fontFamily: "TWKEverett-Medium"}
  const text = { width: "100px", height: "5rem", lineHeight: 0.5, fontFamily: "TWKEverett-Medium" }
  const blockStyle = { backgroundColor: 'rgba(237, 234, 230, 0.01)', padding: '3rem', margin: '2rem', borderRadius: '2px', border: '1px solid #101010', boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)" }
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
      <div style={blockStyle}>
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
              <h3 style={{ color: "#FFDA34", fontSize: '1rem', fontFamily: "TWKEverett-Mono", textAlign: "left" }}>Testnets</h3>
            </div>
            <div className="network">

              {/* <Button
                href={'https://discord.com/channels/1101576619493167217/1255138490992037968'}
                target={'_blank'}
                sx={style}>
                <div style={style}><h2>Movement</h2>{"{APTOS}"}</div>
              </Button> */}
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
          <div style={{ margin: "0 2rem" }}>
            <div style={{ width: "250px" }}>
              <h3 style={{ color: "#FFDA34", fontSize: '1rem', fontFamily: "TWKEverett-Mono", textAlign: "left" }}>Legacy Devnets</h3>
            </div>
            <div
              className="network"
            >
              <ToggleButtonGroup
                color="primary"
                value={network}
                exclusive
                onChange={handleNetwork}
                style={{ borderRadius: "10px" }}
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
      </div>
      <div style={blockStyle}>
        <div>
          <h2 style={{ fontFamily: "TWKEverett-Regular", textAlign: "left" }}>Mock Tokens</h2>
        </div>
        <div>
          <p style={{ fontFamily: "TWKEverett-Regular", textAlign: "left" }}>Available for networks above. Hourly rate limit.</p>
        </div>
        <div style={{ display: "flex" }}>
          <FormControl fullWidth style={{ margin: '1rem' }}>
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
          <FormControl fullWidth style={{ margin: '1rem' }}>
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
        <div style={{ display: 'flex', justifyContent: "space-between", padding: '2rem' }}>

          {mock == 'aptos' && <WalletConnector
            networkSupport={"testnet"}
            handleNavigate={() => `https://explorer.movementlabs.xyz/account/${account?.address}`}
            modalMaxWidth="sm" />}
          {mock == 'evm' && <w3m-button />}
          {mock == 'sui' && <ConnectButton />}
          {loading && <CircularProgress sx={{ position: 'absolute', left: '60%', fontFamily: "TWKEverett-Regular" }} />}
          <Button sx={{
            fontFamily: "TWKEverett-Regular",
            width: 150,
            borderRadius: 0,
            marginLeft: '2rem',
            color: 'black',
            backgroundColor: '#EDEAE6',
            '&:hover': { backgroundColor: '#C4B8A5' }
          }} onClick={(handleMint)}>Mint</Button>
          </div>
          {success && <Alert severity="success" sx={{ width: 300, marginBottom: 2 }}>Minted {token}</Alert>}
          {digest && <Alert severity="error" sx={{ width: 300, marginBottom: 2 }}>{digest}</Alert>}
        </div>
      </div>
    </Box>
    </>
  );
}
