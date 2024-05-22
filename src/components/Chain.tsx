import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useState,RefObject } from "react";
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { to } from "await-to-js";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { AptosClient, FaucetClient, CoinClient } from "aptos";
import { Switch,useTheme } from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';
import { Network } from "../utils";
import ReCAPTCHA from "react-google-recaptcha";

export default function Chains({ name,eventName, language, amount, isEvm, hasTestnet, network, faucetRequest }: any) {

    const [success, setSuccess] = useState(false);
    const [address, setAddress] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string|null>(null);

    const theme = useTheme();
    const [isDark, setIsDark] = useState(theme.palette.mode === "dark");
    useEffect(() => {
        setIsDark(theme.palette.mode === "dark");
    }, [theme]);
  

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

    const onChangeRe = (value:string|null)=> {
        // console.log("Captcha value:", value);
        setToken(value);
      }

    const recaptchaRef: RefObject<ReCAPTCHA> = React.createRef();


    const handleRequest = async () => {


        setLoading(true);
        recaptchaRef.current?.reset();
        
        let status = false;
        const res = await faucetRequest(address,token);
        
        if (res && res.success) {
            setSuccess(true);
            status = true;
        } else{
            setErrorMessage(res.error || "Failed to fund account.");
        }

        // (window as any).dataLayer.push({'event':eventName,'request_success':status});

        (window as any).gtag('event', eventName, {
            'gtagIP': (window as any).gtagIP,
            'href': location.href,
            'time': Date.now(),
            'address': address,
            'value': status,
            'token': token,
            'type': name,
            'error': res.error||"none",
          });
        setToken(null);
        setLoading(false);
    };

    const handleFormSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        handleRequest(); // Use the wrapper method
    };

    const isValidHex = (str: string, fractal: boolean = false) => {
        const regex = isEvm ? fractal ? /^0x[a-fA-F0-9]{40}$/ : /^0x[a-fA-F0-9]{64}$/ : /^0x[a-fA-F0-9]{64}$/;
        return regex.test(str);
    };

    const _amount = amount;

    return (
        name?.toLowerCase() == language?.toLowerCase() && <Container sx={{ position: 'relative' }}>
            <Box
                sx={{
                    fontFamily: "TWKEverett-Medium",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    poisition: 'relative',
                    padding: "2rem"
                }}
            >

                <form name={name} onSubmit={handleFormSubmit}>
                    <TextField
                        label={name + " Address"}
                        variant="outlined"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        sx={{ width: 300, marginBottom: 2, fontFamily: "TWKEverett-Medium" }}
                        disabled={loading}
                        error={!isValidHex(address, true) && address !== ""}
                        helperText={!isValidHex(address, true) && address !== "" ? `Invalid address. Should be of the form: 0xab12... and be ${isEvm ? '20' : '32'} bytes in length` : ""}
                    />
                    <br />
                    {/* {hasTestnet && <FormControlLabel
                        control={<Switch checked={network == Network.Testnet} onChange={() => toggleNetwork()} />}
                        label={"Testnet"}
                        sx={{ marginBottom: 2 }}
                    />} */}
                    <br />

                    {loading && <CircularProgress sx={{ position: 'absolute', left: '50%', fontFamily: "TWKEverett-Medium" }} />}

                    <Button
                        onClick={handleRequest}
                        variant="contained"
                        sx={{
                            fontFamily: "TWKEverett-Medium",
                            width: 300,
                            borderRadius: 0,
                            color: 'white',
                            backgroundColor: '#1737FF',
                            '&:hover': { backgroundColor: 'rgb(16, 38, 178)' }
                        }}
                        disabled={loading||token===null||!isValidHex(address, true)}
                    >
                        <WaterDropIcon sx={{ mr: 1}} />
                        Get MOVE
                    </Button>
                    <div>
                    {isDark &&
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey="6LeNltspAAAAAECHmsdf8w29UFF3ZiIrvscSkMTi"
                            // size="invisible"
                            hl="en"
                            onChange={onChangeRe}
                            theme="dark"
                        />}
                        {!isDark &&
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey="6LeNltspAAAAAECHmsdf8w29UFF3ZiIrvscSkMTi"
                                // size="invisible"
                                hl="en"
                                onChange={onChangeRe}
                                theme="light"
                            />
                        }
                    </div>
                    {success && <Alert severity="success" sx={{ width: 300, marginBottom: 2 }}>Funded account {_amount} MOVE</Alert>}
                    {errorMessage && <Alert severity="error" sx={{ width: 300, marginBottom: 2 }}>{errorMessage}</Alert>}
                </form>
            </Box>
        </Container>
    );
}
