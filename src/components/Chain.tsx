import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useState } from "react";
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { requestFaucetWithGlobalSigner, mevmRequestFaucet, m2RequestFaucet } from "../api";
import { to } from "await-to-js";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { AptosClient, FaucetClient, CoinClient } from "aptos";
import { Switch } from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';

const RPC_URL = "https://seed-node1.movementlabs.xyz";
const FAUCET_URL = "https://seed-node1.movementlabs.xyz";
const MEVM_URL = "https://mevm.movementlabs.xyz/v1";
const M2_URL = "https://sui.movementlabs.xyz/faucet";
const faucetClient = new FaucetClient(FAUCET_URL, FAUCET_URL);
const aptosClient = new AptosClient(RPC_URL);
const coinClient = new CoinClient(aptosClient);

export default function LandingPage({name, amount, hasEvm, faucetRequest, evmRequest} : any) {

    const [mevm, setMevm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [address, setAddress] = useState("");
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


    const handleRequest = async () => {
        setLoading(true);
        const [err, success] = mevm ? await to(faucetRequest(address)) : await to(evmRequest(address));
        if (success) {
            setSuccess(true);
          } else if (err) {
            console.log(err);
            setErrorMessage(err.message || "Failed to fund account.");
          }
        setLoading(false);
    };

    const handleFormSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        handleRequest(); // Use the wrapper method
    };

    const isValidHex = (str: string, fractal: boolean = false) => {
        const regex = mevm ? fractal ? /^0x[a-fA-F0-9]{40}$/ : /^0x[a-fA-F0-9]{64}$/ : /^0x[a-fA-F0-9]{64}$/;
        return regex.test(str);
    };

    return (
        <Container sx={{ position: 'relative' }}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    poisition: 'relative'
                }}
            >
                <div style={{ width: "300px" }}>
                    <h1 style={{ textAlign: "left" }}>{name}</h1>
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
                    {hasEvm && <FormControlLabel
                        control={<Switch checked={mevm} onChange={() => setMevm(!mevm)} />}
                        label="MEVM account"
                        sx={{ marginBottom: 2 }}
                    />}
                    <br />

                    {loading && <CircularProgress sx={{ position: 'absolute', left: '50%' }} />}

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
                    {success && <Alert severity="success" sx={{ width: 300, marginBottom: 2 }}>Funded account {amount} MOV</Alert>}
                {errorMessage && <Alert severity="error" sx={{ width: 300, marginBottom: 2 }}>{errorMessage}</Alert>}
                </form>
            </Box>
        </Container>
    );
}
