import React, { useState, useEffect, useMemo } from 'react';
import { requestFromFaucet, requestFaucet, mevmRequestFaucet, suiRequestFaucet } from '../../api';
import { AptosClient, FaucetClient, CoinClient } from 'aptos';
import { Aptos, AptosConfig, TypeArgument } from '@aptos-labs/ts-sdk';
import { CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

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

import { ipAddress, next } from '@vercel/edge'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'


const aptosFaucetAddress = '0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f';
const PACKAGE_ID = "0x8ac626e474c33520a815175649fefcbb272678c8c37a7b024e7171fa45d47711";

const CHAIN = {
  aptos: { network: 'testnet', url: 'https://aptos.testnet.suzuka.movementlabs.xyz/v1', faucetUrl: 'https://faucet.testnet.suzuka.movementlabs.xyz', language: 'aptos' },
  m1: { network: 'devnet', url: 'https://aptos.devnet.m1.movementlabs.xyz', language: 'aptos' },
  mevmM1: { network: 'devnet', url: 'https://mevm.devnet.m1.movementlabs.xyz', language: 'evm' },
  m2: { network: 'devnet', url: 'https://sui.devnet.m2.movementlabs.xyz/faucet/web', language: 'sui' },
  mevm: { network: 'devnet', url: 'https://mevm.devnet.imola.movementlabs.xyz', language: 'evm' },
  sui: { network: 'devnet', url: 'https://faucet.devnet.baku.movementlabs.xyz/faucet/web', language: 'sui' }
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
  const [init, setInit] = useState(false);
  const navigate = useNavigate();

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
    if (token === 'ALL') {
      const payload: InputTransactionData = {
        data: {
          function: `${aptosFaucetAddress}::faucet::mintAll`,
          typeArguments: [`${aptosFaucetAddress}::tokens::USDT` as TypeArgument,
          `${aptosFaucetAddress}::tokens::USDC` as TypeArgument,
          `${aptosFaucetAddress}::tokens::WBTC` as TypeArgument,
          `${aptosFaucetAddress}::tokens::WETH` as TypeArgument],
          functionArguments: []
        }
      }
      const response = await submitTransaction(payload);
      setDigest(response);
    } else {
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
  }

  async function evmMint() {
    const tokenAddresses = {
      USDC: '0xaFE0732F985659986Cc3f27AeF76f419BAae5Cde',
      USDT: '0x846B2EaEC7D9A21cf073F4dDa79C6aEa0919c867',
      WBTC: '0x852d5ecB513f8F1928539AaF7217F7e6E0Bfdaa3',
      WETH: '0x4114E6516413c5BA631002A0cF95E828714F8f18',
      ALL: '0x4A6af60286C778514AFB95639B0A74a0adC24711'
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
      'USDT': 60000000000,
      'WBTC': 100000000,
      'WETH': 1700000000
    }

    const value = valueOpt[token as keyof typeof valueOpt]

    if (value === 0) {
      console.error('Unknown token type');
      return;
    }

    const treasury = {
      'WBTC': `0xd2c1127a16494f9df5b6f973baebd78e093d66b3c06463c4e930c8545a9b6df2`,
      'WETH': `0xe02ba3510a9240ba970aed72e0c6188989c3e6d6bd316edfa12bd04da8ebf675`,
      'USDC': `0x6bad1a88caef6f9ea56680cd31315b2cfeb6018b105471320407559042e6d067`,
      'USDT': `0x8cacf2fd727720db5fc11006786fbcf69408decda4611921da791cc8ed844878`
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
      navigate(`?network=${value}`);
    }
  };

  const handleChange = (e: any) => {
    setMock(e.target.value);
  };

  const handleTokenChange = (e: any) => {
    setToken(e.target.value);
  };

  const aptosFaucetRequest = async (address: string, token: string) => {
    const faucetClient = new FaucetClient(CHAIN.aptos.url, CHAIN.aptos.faucetUrl);
    // const aptos = new Aptos(new AptosConfig({ fullnode: CHAIN.aptos.url, faucet: CHAIN.aptos.faucetUrl }));
    return requestFromFaucet(
      faucetClient,
      address
    );
  };


  const m1FaucetRequest = async (address: string, token: string) => {
    const aptosClient = new AptosClient(CHAIN.m1.url);
    return requestFaucet(
      aptosClient,
      CHAIN.m1.url,
      address,
      token
    );
  };

  const suiFaucetRequest = async (address: string, token: string) => {
    return suiRequestFaucet(
      CHAIN.sui.url,
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
    const params = new URLSearchParams(location.search);
    const networkParam = params.get('network');
    if (networkParam) {
      setNetwork(networkParam);
    }
  }, [location]);

  useEffect(() => {

    const timeout = setTimeout(() => {
      setSuccess(false);
      setErrorMessage(null);
      setDigest('');
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };

  }, [success, errorMessage]);

  const style = { width: "100%", height: "2rem", fontFamily: "TWKEverett-Regular" }
  const blockStyle = { backgroundColor: 'rgba(237, 234, 230, 0.01)', padding: '3rem', margin: '2rem', borderRadius: '2px', boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)" }
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
        <Chain name="aptos" eventName="movement_apt_request" language={CHAIN.aptos.language} amount={10} isEvm={false} network={network} faucetRequest={aptosFaucetRequest} />
        {/* <Chain name="M1" eventName="m1_apt_request" language={CHAIN.m1.language} amount={1} isEvm={false} network={network} faucetRequest={m1FaucetRequest} /> */}
        <Chain name="MEVM" eventName="m1_evm_request" language={CHAIN.mevm.language} amount={1} isEvm={true} network={network} faucetRequest={handleM1evmFaucetRequest} />
        <Chain name="Sui" eventName="sui_sui_request" language={CHAIN.sui.language} amount={1} isEvm={false} network={network} faucetRequest={suiFaucetRequest} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
          <div>
            <div className="network">
              {/* <Button
                href={'https://discord.com/channels/1101576619493167217/1255138490992037968'}
                target={'_blank'}
                sx={style}>
                <div style={style}><h2>Movement</h2>{"{APTOS Move}"}</div>
              </Button> */}
              <ToggleButtonGroup
                color="primary"
                value={network}
                exclusive
                onChange={handleNetwork}>
                <ToggleButton
                  value="aptos">
                  <h3 style={style}>{"{Aptos Move}"}</h3>
                </ToggleButton>
                <ToggleButton value="mevm">
                  <h3 style={style}>{"{MEVM}"}</h3>
                </ToggleButton>
                <ToggleButton value="sui">
                  <h3 style={style}>{"{Sui Move}"}</h3>
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
              {mock != 'sui' && <MenuItem value={'ALL'}>ALL</MenuItem>}
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


export async function getServerSideProps(context: any) {
  const ratelimit = new Ratelimit({
    redis: kv,
    // 5 requests from the same IP in 10 seconds
    limiter: Ratelimit.slidingWindow(5, '10 s'),
  })
  
  // Define which routes you want to rate limit
  const config = {
    matcher: '/',
  }
  
    // You could alternatively limit based on user ID or similar
    const ip = ipAddress(context) || '127.0.0.1'
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(
      ip
    )
  
    return success ? next() : Response.redirect(new URL('/blocked', context.url))
  
}