import React, {useState, useEffect} from "react";
import {
  movementRequestFaucet,
  mevmRequestFaucet,
} from "../../api";
import {TypeArgument} from "@aptos-labs/ts-sdk";
import {CircularProgress, Alert, useTheme, useMediaQuery} from "@mui/material";
import {useNavigate} from "react-router-dom";

import Chain from "../../components/Chain";
import {
  Button,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
} from "@mui/material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import "./hover.css";
import {
  InputTransactionData,
} from "@aptos-labs/wallet-adapter-react";
import {WalletConnector} from "../../components/wallet/WalletConnector";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import {waitForTransactionReceipt} from "@wagmi/core";
import {useWriteContract, useSwitchChain, useChainId} from "wagmi";
import evmTokensAbi from "../../abi/evmTokensAbi.json";
import moveL1FaucetAbi from "../../abi/moveL1FaucetAbi.json";
import {Transaction} from "@mysten/sui/transactions";
import useSubmitTransaction from "../../api/hooks/useSubmitTransaction";
import {Link} from "@mui/material";
import {config} from "../../index";
import { Translate } from "@mui/icons-material";

const aptosFaucetAddress =
  "0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f";
const PACKAGE_ID =
  "0x8ac626e474c33520a815175649fefcbb272678c8c37a7b024e7171fa45d47711";
const moveL1FaucetAddress = "0x8Ef16FFDe7fc18F2E6d4Ca338AA0F318fd61e848";

const CHAIN = {
  holesky: {
    network: "testnet",
    url: "https://holesky.gateway.tenderly.co",
    language: "evm",
  },
  bardock: {
    network: "testnet",
    url: "https://testnet.bardock.movementnetwork.xyz/v1",
    faucetUrl: "https://fund.testnet.bardock.movementnetwork.xyz",
    language: "aptos",
  },
  porto: {
    network: "testnet",
    url: "https://testnet.porto.movementnetwork.xyz/v1",
    faucetUrl: "https://fund.testnet.porto.movementnetwork.xyz",
    language: "aptos",
  },
  mevm: {
    network: "devnet",
    url: "https://mevm.devnet.imola.movementlabs.xyz",
    language: "evm",
  },
};

export default function LandingPage() {
  const [network, setNetwork] = useState("porto");
  const [mock, setMock] = useState("porto");
  const [token, setToken] = useState("USDC");
  const {data: hash, writeContractAsync} = useWriteContract();
  const {submitTransaction} = useSubmitTransaction();
  const account = useCurrentAccount();
  const {mutate: signAndExecuteTransaction} = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bridgePopup, setBridgePopup] = useState(false);
  const [init, setInit] = useState(false);
  const navigate = useNavigate();
  const chain = useChainId();
  const {chains, switchChainAsync} = useSwitchChain();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const handleMint = async () => {
    setLoading(true);

    let status = false;
    let res;
    if (mock == "holesky") {
      res = handleL1Faucet();
    } else if (mock == "porto" || mock == "bardock") {
      res = aptosMint();
    } else if (mock == "evm") {
      res = evmMint();
    } else if (mock == "sui") {
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
    setLoading(false);
  };

  const handleL1Faucet = async () => {
    console.log("requesting move on l1");
    await switchChainAsync({chainId: 17000});
    const hash = await writeContractAsync({
      address: moveL1FaucetAddress,
      abi: moveL1FaucetAbi,
      functionName: "faucet",
      value: 100000000000000000n,
    });
    try {
      const data = await waitForTransactionReceipt(config, {
        hash,
      });
      console.log(data.transactionHash);
      setDigest("Transaction successful");
      setBridgePopup(true);
    } catch (e) {
      console.error(e);
      setDigest("Transaction reverted");
    }
  };

  async function aptosMint() {
    console.log("minting aptos");
    if (token === "ALL") {
      const payload: InputTransactionData = {
        data: {
          function: `${aptosFaucetAddress}::faucet::mintAll`,
          typeArguments: [
            `${aptosFaucetAddress}::tokens::USDT` as TypeArgument,
            `${aptosFaucetAddress}::tokens::USDC` as TypeArgument,
            `${aptosFaucetAddress}::tokens::WBTC` as TypeArgument,
            `${aptosFaucetAddress}::tokens::WETH` as TypeArgument,
          ],
          functionArguments: [],
        },
      };
      const response = await submitTransaction(payload);
      setDigest(response);
    } else {
      const payload: InputTransactionData = {
        data: {
          function: `${aptosFaucetAddress}::faucet::mint`,
          typeArguments: [
            `${aptosFaucetAddress}::tokens::${token}` as TypeArgument,
          ],
          functionArguments: [],
        },
      };
      const response = await submitTransaction(payload);
      setDigest(response);
    }
  }

  async function evmMint() {
    const tokenAddresses = {
      USDC: "0xaFE0732F985659986Cc3f27AeF76f419BAae5Cde",
      USDT: "0x846B2EaEC7D9A21cf073F4dDa79C6aEa0919c867",
      WBTC: "0x852d5ecB513f8F1928539AaF7217F7e6E0Bfdaa3",
      WETH: "0x4114E6516413c5BA631002A0cF95E828714F8f18",
      ALL: "0x4A6af60286C778514AFB95639B0A74a0adC24711",
    };
    await switchChainAsync({chainId: 30732});
    const response = await writeContractAsync({
      address: tokenAddresses[
        token as keyof typeof tokenAddresses
      ] as `0x${string}`,
      abi: evmTokensAbi,
      functionName: "mint",
    });

    setDigest(response);
  }

  async function suiMint() {
    const tokenMint = `${PACKAGE_ID}::${token.toLowerCase()}::${token}`;
    const valueOpt = {
      USDC: 60000000000,
      USDT: 60000000000,
      WBTC: 100000000,
      WETH: 1700000000,
    };

    const value = valueOpt[token as keyof typeof valueOpt];

    if (value === 0) {
      console.error("Unknown token type");
      return;
    }

    const treasury = {
      WBTC: `0xd2c1127a16494f9df5b6f973baebd78e093d66b3c06463c4e930c8545a9b6df2`,
      WETH: `0xe02ba3510a9240ba970aed72e0c6188989c3e6d6bd316edfa12bd04da8ebf675`,
      USDC: `0x6bad1a88caef6f9ea56680cd31315b2cfeb6018b105471320407559042e6d067`,
      USDT: `0x8cacf2fd727720db5fc11006786fbcf69408decda4611921da791cc8ed844878`,
    };
    console.log("minting sui", tokenMint);

    const transaction = new Transaction();
    const treasuryAddress = treasury[token as keyof typeof treasury];

    transaction.moveCall({
      target: "0x2::coin::mint_and_transfer",
      typeArguments: [tokenMint],
      arguments: [
        transaction.object(treasuryAddress),
        transaction.pure.u64(value),
        transaction.pure.address(account?.address as string),
      ],
    });

    await signAndExecuteTransaction(
      {
        transaction,
        //chain: 'sui:m2',
      },
      {
        onSuccess: (result) => {
          console.log("executed transaction", result);
          setDigest(result.digest);
          return result;
        },
      },
    );
  }

  const handleNetwork = (event: any, value: any) => {
    if (value !== null) {
      setNetwork(event.target.value);
      navigate(`?network=${event.target.value}`);
    }
  };

  const handleChange = (e: any) => {
    setMock(e.target.value);
  };

  const handleTokenChange = (e: any) => {
    setToken(e.target.value);
  };

  const movementFaucetRequest = async (
    address: string,
    token: string,
    network: string,
  ) => {
    return movementRequestFaucet(address, token, network, CHAIN);
  };

  const handleM1evmFaucetRequest = async (
    address: string,
    token: string,
    network: string,
  ) => {
    // return mevmRequestFaucet(CHAIN.mevm.url,address, token);
    return mevmRequestFaucet(address, token, CHAIN);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const networkParam = params.get("network");
    if (networkParam) {
      setNetwork(networkParam);
    }
  }, [location]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSuccess(false);
      setErrorMessage(null);
      setDigest("");
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [success, errorMessage]);

  const style = {
    width: "100%",
    height: "2rem",
    fontFamily: "TWKEverett-Regular",
  };
  const blockStyle = {
    backgroundColor: "rgba(237, 234, 230, 0.01)",
    padding: window.innerWidth < 600 ? "2rem 2rem" : "3rem 2rem",
    margin: "2rem",
    borderRadius: "2px",
    boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)",
    maxWidth: "500px",
    width: "100%",
  };
  return (
    <Box
      sx={{
        fontFamily: "TWKEverett-Regular",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        position: "relative",

      }}
    >
      <div style={blockStyle}>
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <h1 style={{textAlign: "left"}}>Faucets</h1>
          <div className="network" style={{maxWidth: "220px", width: "100%",}}>
            <FormControl fullWidth>
              <InputLabel>Network</InputLabel>
              <Select value={network} label="Network" onChange={handleNetwork}>
                {/* <MenuItem value={"bardock"}>Movement Bardock</MenuItem> */}
                <MenuItem value={"porto"}>Movement Porto</MenuItem>
                <MenuItem value={"mevm"}>MEVM</MenuItem>
              </Select>
            </FormControl>
          </div>
        </Box>
        {/* <Chain
          name="bardock"
          eventName="movement_apt_request"
          language={CHAIN.bardock.language}
          amount={10}
          isEvm={false}
          network={network}
          faucetRequest={movementFaucetRequest}
        /> */}
        <Chain
          name="porto"
          eventName="movement_apt_request"
          language={CHAIN.porto.language}
          amount={10}
          isEvm={false}
          network={network}
          faucetRequest={movementFaucetRequest}
        />
        <Chain
          name="MEVM"
          eventName="m1_evm_request"
          language={CHAIN.mevm.language}
          amount={1}
          isEvm={true}
          network={network}
          faucetRequest={handleM1evmFaucetRequest}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        ></div>
      </div>
      <div style={blockStyle}>
        <Box sx={{
                marginTop: 4,
              }}>
          <h2 style={{fontFamily: "TWKEverett-Regular", textAlign: "left"}}>
            Tokens
          </h2>
        
          <p
            style={{
              fontFamily: "TWKEverett-Regular",
              textAlign: "left",
              fontSize: "0.75rem",
            }}
          >
            Daily rate limit.
          </p>
        </Box>
        <Box sx={{
            display: "flex", 
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}>
          <FormControl fullWidth style={{ maxWidth: "220px", width: "100%", marginBottom: "2rem",}}>
            <InputLabel id="demo-simple-select-label">Network</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={mock}
              label="Network"
              onChange={handleChange}
            >
              <MenuItem value={"porto"}>Movement Porto</MenuItem>
              <MenuItem value={"bardock"}>Movement Bardock</MenuItem>
              <MenuItem value={"holesky"}>Ethereum Holesky</MenuItem>
              <MenuItem value={"evm"}>MEVM</MenuItem>

            </Select>
          </FormControl>
          {mock == "holesky" ? (
            <FormControl fullWidth style={{maxWidth: "100px", width: "100%", marginBottom: "2rem",}}>
              <InputLabel id="token-label">Token</InputLabel>
              <Select
                labelId="token-label"
                id="token-select"
                value={token}
                label="Token"
                onChange={handleTokenChange}
              >
                <MenuItem value={"MOVE"}>MOVE</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth style={{maxWidth: "100px", width: "100%", marginBottom: "0rem",}}>
              <InputLabel id="token-label">Token</InputLabel>
              <Select
                labelId="token-label"
                id="token-select"
                value={token}
                label="Token"
                onChange={handleTokenChange}
              >
                <MenuItem value={"USDC"}>USDC</MenuItem>
                <MenuItem value={"USDT"}>USDT</MenuItem>
                <MenuItem value={"WBTC"}>WBTC</MenuItem>
                <MenuItem value={"WETH"}>WETH</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
        <Box>
          {mock == "holesky" && (
            <p style={{fontFamily: "TWKEverett-Regular", textAlign: "left"}}>
              MOVE token on Ethereum Holesky Testnet. Costs 0.1 HoleskyETH to
              claim.
            </p>
          )}
          {mock == "bardock" && (
            <p style={{fontFamily: "TWKEverett-Regular", textAlign: "left"}}>
              USDC, USDT, ETH and BTC on Bardock Testnet.{" "}
            </p>
          )}
          {mock == "evm" && (
            <p style={{fontFamily: "TWKEverett-Regular", textAlign: "left"}}>
              USDC, USDT, ETH and BTC on MEVM Testnet.{" "}
            </p>
          )}
          {mock == "porto" && (
            <p style={{fontFamily: "TWKEverett-Regular", textAlign: "left"}}>
              USDC, USDT, ETH and BTC on Porto Testnet.{" "}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between", 
              paddingTop: "2rem 0",
              flexWrap: "wrap",
            }}
          >
            {mock == "holesky" && <w3m-button />}
            {(mock == "porto" || mock == "bardock") && (
              <WalletConnector
                networkSupport={"testnet"}
                handleNavigate={() =>
                  `https://explorer.movementnetwork.xyz/account/${account?.address}?network=${mock}+testnet`
                }
                modalMaxWidth="sm"
              />
            )}
            {mock == "evm" && <w3m-button />}
            {mock == "sui" && <ConnectButton />}
           
            <Button
              sx={{
                fontFamily: "TWKEverett-Regular",
                maxWidth: window.innerWidth < 600 ? "100%" : "150px",
                marginTop: window.innerWidth < 600 ? "1rem" : "0",
                width: "100%",
                minHeight: "40px",
                borderRadius: 0,
                color: "black",
                backgroundColor: "#EDEAE6",
                position: "relative",
                "&:hover": {backgroundColor: "#C4B8A5"},
              }}
              onClick={handleMint}
            >
            
              
              {loading ? (
                <CircularProgress
                  size={24}
                  sx={{
                    position: "absolute",
                    
                  }}
                />
              ) : (
                "Claim"
              )}
            </Button>
          </div>
          {success && (
            <Alert severity="success" sx={{Maxwidth: 300, width: "100%", marginBottom: 2}}>
              Minted {token}
            </Alert>
          )}
          {digest && (
            <Alert severity="error" sx={{Maxwidth: 300, width: "100%", marginBottom: 2}}>
              {digest}
            </Alert>
          )}
          <Modal
            open={bridgePopup}
            onClose={() => setBridgePopup(false)}
            aria-labelledby="parent-modal-title"
            aria-describedby="parent-modal-description"
          >
            <Box
              sx={{
                ...blockStyle,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                bgcolor: "background.paper",
                border: "2px solid #000",
                boxShadow: 24,
                p: 4,
              }}
            >
              <h2 id="parent-modal-title">Success</h2>
              <p id="parent-modal-description">
                You have successfully minted MOVE on Holesky. <br />
                <Link href="https://bridge.movementnetwork.xyz" target="_blank">
                  Bridge it
                </Link>{" "}
                now to Movement.
              </p>
            </Box>
          </Modal>
        </Box>
      </div>
    </Box>
  );
}
