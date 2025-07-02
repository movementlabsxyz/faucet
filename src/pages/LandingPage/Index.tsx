import React, {useState, useEffect} from "react";
import {movementRequestFaucet, mevmRequestFaucet} from "../../api";
import {TypeArgument} from "@aptos-labs/ts-sdk";
import {AccountBalanceWalletOutlined as AccountBalanceWalletOutlinedIcon} from "@mui/icons-material";
import {
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Avatar,
} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {useWeb3Modal} from "@web3modal/wagmi/react";
import {useAccount} from "wagmi";

import Chain from "../../components/Chain";
import {
  Button,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import "./hover.css";
import {
  InputTransactionData,
  truncateAddress,
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

const moveFaucetAddress =
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
    faucetUrl: "https://faucet.testnet.bardock.movementnetwork.xyz",
    language: "movement",
  },
  porto: {
    network: "testnet",
    url: "https://testnet.porto.movementnetwork.xyz/v1",
    faucetUrl: "https://fund.testnet.porto.movementnetwork.xyz",
    language: "movement",
  },
  mevm: {
    network: "devnet",
    url: "https://mevm.devnet.imola.movementlabs.xyz",
    language: "evm",
  },
};

export default function LandingPage() {
  const [network, setNetwork] = useState("bardock");
  const [mock, setMock] = useState("bardock");
  const [token, setToken] = useState("MOVE");
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
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("md"));
  const [mintFunction, setMintFunction] = useState<
    (() => Promise<boolean>) | null
  >(null);
  const {open} = useWeb3Modal();
  const {address, isConnected, connector} = useAccount();

  const handleMint = async () => {
    setLoading(true);
    if (mock == "bardock" && token === "MOVE") {
      if (mintFunction) {
        const success = await mintFunction();
        if (success) {
          setSuccess(true);
        } else {
          setErrorMessage("Failed to mint token.");
        }
      } else {
        setErrorMessage("Mint function not initialized");
      }
      setLoading(false);
      return;
    }

    let status = false;
    let res;
    if (mock == "holesky") {
      res = handleL1Faucet();
    } else if (mock == "porto" || mock == "bardock") {
      res = moveMint();
    } else if (mock == "evm") {
      res = evmMint();
    } else if (mock == "sui") {
      res = suiMint();
    }
    const response = await res;
    if (response == null) {
      setErrorMessage("Failed to mint token.");
    } else if (response) {
      setSuccess(true);
      status = true;
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

  async function moveMint() {
    console.log("minting move");
    if (token === "ALL") {
      const payload: InputTransactionData = {
        data: {
          function: `${moveFaucetAddress}::faucet::mintAll`,
          typeArguments: [
            `${moveFaucetAddress}::tokens::USDT` as TypeArgument,
            `${moveFaucetAddress}::tokens::USDC` as TypeArgument,
            `${moveFaucetAddress}::tokens::WBTC` as TypeArgument,
            `${moveFaucetAddress}::tokens::WETH` as TypeArgument,
          ],
          functionArguments: [],
        },
      };
      const response = await submitTransaction(payload);
      setDigest(response);
    } else {
      const payload: InputTransactionData = {
        data: {
          function: `${moveFaucetAddress}::faucet::mint`,
          typeArguments: [
            `${moveFaucetAddress}::tokens::${token}` as TypeArgument,
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
    padding: "3rem",
    margin: "2rem",
    borderRadius: "2px",
    boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)",
    width: "500px",
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
        <div>
          <h2 style={{fontFamily: "TWKEverett-Regular", textAlign: "left"}}>
            Tokens
          </h2>
        </div>
        <div>
          <p
            style={{
              fontFamily: "TWKEverett-Regular",
              textAlign: "left",
              fontSize: "0.75rem",
            }}
          >
            Daily rate limit.
          </p>
        </div>
        <div style={{display: "flex"}}>
          <FormControl fullWidth style={{margin: "1rem", width: "220px"}}>
            <InputLabel id="demo-simple-select-label">Network</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={mock}
              label="Network"
              onChange={handleChange}
            >
              {/* <MenuItem value={"porto"}>Movement Porto</MenuItem> */}
              <MenuItem value={"bardock"}>Movement Bardock</MenuItem>
              <MenuItem value={"holesky"}>Ethereum Holesky</MenuItem>
              {/* <MenuItem value={"evm"}>MEVM</MenuItem> */}
            </Select>
          </FormControl>
          {mock == "holesky" ? (
            <FormControl fullWidth style={{margin: "1rem", width: "100px"}}>
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
            <FormControl fullWidth style={{margin: "1rem", width: "100px"}}>
              <InputLabel id="token-label">Token</InputLabel>
              <Select
                labelId="token-label"
                id="token-select"
                value={token}
                label="Token"
                onChange={handleTokenChange}
              >
                <MenuItem value={"MOVE"}>MOVE</MenuItem>
                <MenuItem value={"USDC"}>USDC</MenuItem>
                <MenuItem value={"USDT"}>USDT</MenuItem>
                <MenuItem value={"WBTC"}>WBTC</MenuItem>
                <MenuItem value={"WETH"}>WETH</MenuItem>
              </Select>
            </FormControl>
          )}
        </div>
        <div>
          {/* chain specific descriptor text */}
          {mock == "holesky" && (
            <p style={{fontFamily: "TWKEverett-Regular", textAlign: "left"}}>
              MOVE token on Ethereum Holesky Testnet. Costs 0.1 HoleskyETH to
              claim.
            </p>
          )}
          {mock == "bardock" && token === "MOVE" && (
            <Chain
              name="bardock"
              eventName="movement_apt_request"
              language={CHAIN.bardock.language}
              amount={10}
              isEvm={false}
              network={network}
              faucetRequest={movementFaucetRequest}
              setMintFunction={setMintFunction}
            />
          )}
          {mock == "bardock" && token !== "MOVE" && (
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

          {/* connect wallet buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "2rem",
            }}
          >
            {mock == "holesky" && (
              <Button
                size="large"
                variant="contained"
                onClick={() => open()}
                className="wallet-button"
                disabled={loading}
                sx={{borderRadius: "10px"}}
              >
                {isConnected ? (
                  <>
                    <Avatar
                      alt={connector?.name}
                      src={connector?.icon}
                      sx={{width: 24, height: 24}}
                    />
                    <Typography noWrap ml={2}>
                      {address ? truncateAddress(address) : "Unknown"}
                    </Typography>
                  </>
                ) : (
                  <>
                    <AccountBalanceWalletOutlinedIcon sx={{marginRight: 1}} />
                    <Typography noWrap>Connect</Typography>
                  </>
                )}
              </Button>
            )}
            {(mock == "porto" || mock == "bardock") && (
              <WalletConnector
                networkSupport={"testnet"}
                handleNavigate={() =>
                  `https://explorer.movementnetwork.xyz/account/${account?.address}?network=${mock}+testnet`
                }
                modalMaxWidth="sm"
              />
            )}
            {mock == "evm" && (
              <Button
                size="large"
                variant="contained"
                onClick={() => open()}
                className="wallet-button"
                disabled={loading}
                sx={{borderRadius: "10px"}}
              >
                {isConnected ? (
                  <>
                    <Avatar
                      alt={connector?.name}
                      src={connector?.icon}
                      sx={{width: 24, height: 24}}
                    />
                    <Typography noWrap ml={2}>
                      {address ? truncateAddress(address) : "Unknown"}
                    </Typography>
                  </>
                ) : (
                  <>
                    <AccountBalanceWalletOutlinedIcon sx={{marginRight: 1}} />
                    <Typography noWrap>Connect</Typography>
                  </>
                )}
              </Button>
            )}
            {mock == "sui" && <ConnectButton />}

            {/* Claim button */}
            <Button
              disabled={loading}
              sx={{
                fontFamily: "TWKEverett-Regular",
                width: 150,
                borderRadius: 0,
                marginLeft: "2rem",
                color: "black",
                backgroundColor: "#EDEAE6",
                "&:hover": {backgroundColor: "#C4B8A5"},
                position: "relative",
                "&:before": {
                  content: "''",
                  position: "absolute",
                  bottom: "5px",
                  left: "5px",
                  backgroundImage:
                    'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="29" height="21" viewBox="0 0 29 21" fill="none"><line x1="20.7866" y1="11.0709" x2="15.8956" y2="11.0709" stroke="black" stroke-width="0.733645"/><line x1="17.9745" y1="13.1494" x2="17.9745" y2="8.25845" stroke="black" stroke-width="0.733645"/><line x1="20.7866" y1="18.4076" x2="15.8956" y2="18.4076" stroke="black" stroke-width="0.733645"/><line x1="17.9745" y1="20.4861" x2="17.9745" y2="15.5951" stroke="black" stroke-width="0.733645"/><line x1="28.856" y1="18.4073" x2="23.965" y2="18.4073" stroke="black" stroke-width="0.733645"/><line x1="26.0439" y1="20.4858" x2="26.0439" y2="15.5949" stroke="black" stroke-width="0.733645"/><line x1="12.7162" y1="11.0709" x2="7.82522" y2="11.0709" stroke="black" stroke-width="0.733645"/><line x1="9.90411" y1="13.1494" x2="9.90411" y2="8.25845" stroke="black" stroke-width="0.733645"/><line x1="12.7162" y1="3.7345" x2="7.82522" y2="3.7345" stroke="black" stroke-width="0.733645"/><line x1="9.90411" y1="5.81299" x2="9.90411" y2="0.922025" stroke="black" stroke-width="0.733645"/><line x1="12.7162" y1="18.4076" x2="7.82522" y2="18.4076" stroke="black" stroke-width="0.733645"/><line x1="9.90411" y1="20.4861" x2="9.90411" y2="15.5951" stroke="black" stroke-width="0.733645"/><line x1="4.89111" y1="11.0709" x2="0.000149695" y2="11.0709" stroke="black" stroke-width="0.733645"/><line x1="2.07904" y1="13.1494" x2="2.07904" y2="8.25845" stroke="black" stroke-width="0.733645"/><line x1="4.89111" y1="3.7345" x2="0.000149695" y2="3.7345" stroke="black" stroke-width="0.733645"/><line x1="2.07904" y1="5.81299" x2="2.07904" y2="0.922025" stroke="black" stroke-width="0.733645"/><line x1="4.89111" y1="18.4076" x2="0.000149695" y2="18.4076" stroke="black" stroke-width="0.733645"/><line x1="2.07904" y1="20.4861" x2="2.07904" y2="15.5951" stroke="black" stroke-width="0.733645"/></svg>\')',
                  backgroundSize: "contain",
                  pointerEvents: "none",
                  width: "29px",
                  height: "21px",
                },
                "&:after": {
                  content: "''",
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  backgroundImage:
                    'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="29" height="20" viewBox="0 0 29 20" fill="none"><line x1="8.0694" y1="9.41516" x2="12.9604" y2="9.41516" stroke="black" stroke-width="0.733645"/><line x1="10.8815" y1="7.33667" x2="10.8815" y2="12.2276" stroke="black" stroke-width="0.733645"/><line x1="8.0694" y1="2.07849" x2="12.9604" y2="2.07849" stroke="black" stroke-width="0.733645"/><line x1="10.8815" y1="3.64429e-08" x2="10.8815" y2="4.89096" stroke="black" stroke-width="0.733645"/><line x1="-3.04972e-05" y1="2.07873" x2="4.89093" y2="2.07873" stroke="black" stroke-width="0.733645"/><line x1="2.81204" y1="0.000244177" x2="2.81204" y2="4.89121" stroke="black" stroke-width="0.733645"/><line x1="16.1398" y1="9.41516" x2="21.0308" y2="9.41516" stroke="black" stroke-width="0.733645"/><line x1="18.9519" y1="7.33667" x2="18.9519" y2="12.2276" stroke="black" stroke-width="0.733645"/><line x1="16.1398" y1="16.7516" x2="21.0308" y2="16.7516" stroke="black" stroke-width="0.733645"/><line x1="18.9519" y1="14.6731" x2="18.9519" y2="19.5641" stroke="black" stroke-width="0.733645"/><line x1="16.1398" y1="2.07849" x2="21.0308" y2="2.07849" stroke="black" stroke-width="0.733645"/><line x1="18.9519" y1="3.64429e-08" x2="18.9519" y2="4.89096" stroke="black" stroke-width="0.733645"/><line x1="23.9649" y1="9.41516" x2="28.8559" y2="9.41516" stroke="black" stroke-width="0.733645"/><line x1="26.777" y1="7.33667" x2="26.777" y2="12.2276" stroke="black" stroke-width="0.733645"/><line x1="23.9649" y1="16.7516" x2="28.8559" y2="16.7516" stroke="black" stroke-width="0.733645"/><line x1="26.777" y1="14.6731" x2="26.777" y2="19.5641" stroke="black" stroke-width="0.733645"/><line x1="23.9649" y1="2.07849" x2="28.8559" y2="2.07849" stroke="black" stroke-width="0.733645"/><line x1="26.777" y1="3.64429e-08" x2="26.777" y2="4.89096" stroke="black" stroke-width="0.733645"/></svg>\')',
                  backgroundSize: "contain",
                  pointerEvents: "none",
                  height: "19.564px",
                  width: "28.856px",
                },
              }}
              onClick={handleMint}
            >
              Claim
            </Button>
            {loading && (
              <CircularProgress
                sx={{
                  position: "absolute",
                  left: "60%",
                  fontFamily: "TWKEverett-Regular",
                }}
              />
            )}
          </div>
          {success && (
            <Alert severity="success" sx={{width: 300, marginBottom: 2}}>
              Minted {token}
            </Alert>
          )}
          {digest && (
            <Alert severity="error" sx={{width: 300, marginBottom: 2}}>
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
        </div>
      </div>
    </Box>
  );
}
