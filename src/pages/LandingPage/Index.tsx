import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import HeaderSearch from "../layout/Search/Index";
import Box from "@mui/material/Box";
import NetworkInfo from "../Analytics/NetworkInfo/NetworkInfo";
import UserTransactionsPreview from "./UserTransactionsPreview";
import Button from "@mui/material/Button";
import { useState } from "react";
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { requestFaucet, requestFaucetWithGlobalSigner } from "../../api"; 
import { to } from "await-to-js";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { AptosClient, FaucetClient, CoinClient } from "aptos";
import { Wallet, useWallet } from "@aptos-labs/wallet-adapter-react";

const RPC_URL = "https://seed-node1.movementlabs.xyz";
const FAUCET_URL = "https://seed-node1.movementlabs.xyz"
const faucetClient = new FaucetClient(FAUCET_URL, FAUCET_URL);
const aptosClient = new AptosClient(RPC_URL);
const coinClient = new CoinClient(aptosClient);

export default function LandingPage() {

  const [success, setSuccess] = useState(false);
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState<string|null>(null);
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
    } else if(err) {
      console.log(err);
      setErrorMessage(err.message || "Failed to fund account.");
    }
    setLoading(false);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleFaucetRequest();
  };

  const isValidHex = (str: string) => {
    const regex = /^0x[a-fA-F0-9]{64}$/;
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
        {success && <Alert severity="success" sx={{ width: 300, marginBottom: 2 }}>Funded account 10 MOV.</Alert>}
        {errorMessage && <Alert severity="error" sx={{ width: 300, marginBottom: 2 }}>{errorMessage}</Alert>}
        <form onSubmit={handleFormSubmit}>
          <TextField 
            label="Account Address" 
            variant="outlined" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            sx={{ width: 300, marginBottom: 2 }}
            disabled={loading}
            error={!isValidHex(address) && address !== ""}
            helperText={!isValidHex(address) && address !== "" ? `Invalid address. Should be of the form: 0xab12... and be 32 bytes in length` : ""}
          />
          <br/>
          <Button
            onClick={handleFaucetRequest}
            variant="contained"
            sx={{
              width: 300,
              borderRadius: 0,
              color: 'white',
              backgroundColor: '#1737FF',
              '&:hover': {backgroundColor: 'rgb(16, 38, 178)'}
            }}
            disabled={loading}
          >
            <WaterDropIcon sx={{mr:1}} />
            Get MOV
          </Button>
        </form>
      </Box>
    </Container>
  );
}
