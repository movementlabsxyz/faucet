import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import HeaderSearch from "../layout/Search/Index";
import Box from "@mui/material/Box";
import NetworkInfo from "../Analytics/NetworkInfo/NetworkInfo";
import UserTransactionsPreview from "./UserTransactionsPreview";
import Button from "@mui/material/Button";
import { useState } from "react";
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { requestFaucet, requestFaucetWithGlobalSigner, mevmRequestFaucet, m2RequestFaucet } from "../../api";
import { to } from "await-to-js";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { AptosClient, FaucetClient, CoinClient } from "aptos";
import { Wallet, useWallet } from "@aptos-labs/wallet-adapter-react";
import { Switch } from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';

const RPC_URL = "https://seed-node1.movementlabs.xyz";
const FAUCET_URL = "https://seed-node1.movementlabs.xyz";
const MEVM_URL = "https://mevm.movementlabs.xyz/v1";
const M2_URL = "https://sui.movementlabs.xyz/faucet";
const faucetClient = new FaucetClient(FAUCET_URL, FAUCET_URL);
const aptosClient = new AptosClient(RPC_URL);
const coinClient = new CoinClient(aptosClient);

export default function LandingPage() {

  const [mevm, setMevm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [address, setAddress] = useState("");
  const [addressM2, setAddressM2] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // decay the success state
  useEffect(() => {

    const timeout = setTimeout(() => {
      setSuccess(false);
      setErrorMessage(null);
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };

  }, [success, errorMessage]);

  const handleFaucetRequest = async () => {
    setLoading(true);
    const [err, success] = await to(requestFaucetWithGlobalSigner(
      aptosClient,
      faucetClient,
      coinClient,
      FAUCET_URL,
      address
    ));
    if (success) {
      setSuccess(true);
    } else if (err) {
      console.log(err);
      setErrorMessage(err.message || "Failed to fund account.");
    }
    setLoading(false);
  };

  const handleM2FaucetRequest = async () => {
    setLoading(true);
    const [err, success] = await to(m2RequestFaucet(
      M2_URL,
      addressM2
    ));
    if (success) {
      setSuccess(true);
    } else if (err) {
      console.log(err);
      setErrorMessage(err.message || "Failed to fund account.");
    }
    setLoading(false);
  };

  const handleMevmFaucetRequest = async () => {
    setLoading(true);
    const [err, success] = await to(mevmRequestFaucet(
      MEVM_URL,
      address
    ));
    if (success) {
      setSuccess(true);
    } else if (err) {
      console.log(err);
      setErrorMessage(err.message || "Failed to fund account.");
    }
    setLoading(false);
  };

  const handleRequest = async () => {
    if (mevm) await handleMevmFaucetRequest();
    else await handleFaucetRequest();
  };

  const handleM2Request = async () => {
    await handleM2FaucetRequest();
  }

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleRequest(); // Use the wrapper method
  };

  const isValidHex = (str: string, fractal: boolean = false) => {
    const regex = mevm ? fractal ? /^0x[a-fA-F0-9]{40}$/ : /^0x[a-fA-F0-9]{64}$/ : /^0x[a-fA-F0-9]{64}$/;
    return regex.test(str);
  };

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%"
        }}
      >
        {loading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
        {success && <Alert severity="success" sx={{ width: 300, marginBottom: 2 }}>Funded account {mevm ? 1 : 10} MOV.</Alert>}
        {errorMessage && <Alert severity="error" sx={{ width: 300, marginBottom: 2 }}>{errorMessage}</Alert>}

        <div style={{ width: "300px" }}>
          <h1 style={{ textAlign: "left" }}>M1</h1>
        </div>

        <form onSubmit={handleFormSubmit}>
          <TextField
            label="Account Address"
            variant="outlined"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            sx={{ width: 300, marginBottom: 2 }}
            disabled={loading}
            error={!isValidHex(address, true) && address !== ""}
            helperText={!isValidHex(address, true) && address !== "" ? `Invalid address. Should be of the form: 0xab12... and be ${mevm ? '20' : '32'} bytes in length` : ""}
          />
          <br />
          <FormControlLabel
            control={<Switch checked={mevm} onChange={() => setMevm(!mevm)} />}
            label="MEVM account"
            sx={{ marginBottom: 2 }}
          />
          <br />
          <Button
            onClick={handleRequest}
            variant="contained"
            sx={{
              width: 300,
              borderRadius: 0,
              color: 'white',
              backgroundColor: '#1737FF',
              '&:hover': { backgroundColor: 'rgb(16, 38, 178)' }
            }}
            disabled={loading}
          >
            <WaterDropIcon sx={{ mr: 1 }} />
            Get MOV
          </Button>
        </form>

        <div style={{ width: "300px" }}>
          <h1 style={{ textAlign: "left" }}>M2</h1>
        </div>

        <form onSubmit={handleFormSubmit}>
          <TextField
            label="Account Address"
            variant="outlined"
            value={addressM2}
            onChange={(e) => setAddressM2(e.target.value)}
            sx={{ width: 300, marginBottom: 2 }}
            disabled={loading}
            error={!isValidHex(addressM2) && addressM2 !== ""}
            helperText={!isValidHex(addressM2) && addressM2 !== "" ? `Invalid address. Should be of the form: 0xab12... and be 32 bytes in length` : ""}
          />
          <br />

          <Button
            onClick={handleM2Request}
            variant="contained"
            sx={{
              width: 300,
              borderRadius: 0,
              color: 'white',
              backgroundColor: '#1737FF',
              '&:hover': { backgroundColor: 'rgb(16, 38, 178)' }
            }}
            disabled={loading}
          >
            <WaterDropIcon sx={{ mr: 1 }} />
            Get MOV
          </Button>
        </form>
      </Box>
    </Container>
  );
}
