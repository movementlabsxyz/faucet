import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useState,RefObject } from "react";

import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { Switch,useTheme } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";


export default function Chains({ name,eventName, language, amount, isEvm, network, faucetRequest }: any) {

    const [address, setAddress] = useState("");
    const [success, setSuccess] = useState(false);
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
    
    const checkRateLimit = async () => {
        try {
          const response = await fetch('/api/rate-limit');
          console.log("Response:", response);

          // Check if the response is an HTML page
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but received: ${text}`);
          }
      
          const rateLimitData = await response.json();
          console.log("Rate Limit Data:", rateLimitData);
      
          if (!response.ok) {
            // Handle rate limit exceeded
            console.warn('Rate limit exceeded. Please try again later.');
          } else {
            // Handle successful rate limit check
            console.log('Rate limit info:', rateLimitData);
          }
        } catch (error) {
          console.error('Error fetching rate limit data:', error);
        }
    };

    const checkCaptcha = async () => {
        try {
            const response = await fetch('/api/capctcha', {
                
            });
            console.log("Response:", response);
  
            // Check if the response is an HTML page
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text();
              throw new Error(`Expected JSON but received: ${text}`);
            }
        
            const rateLimitData = await response.json();
            console.log("Rate Limit Data:", rateLimitData);
        
            if (!response.ok) {
              // Handle rate limit exceeded
              console.warn('Rate limit exceeded. Please try again later.');
            } else {
              // Handle successful rate limit check
              console.log('Rate limit info:', rateLimitData);
            }
          } catch (error) {
            console.error('Error fetching rate limit data:', error);
          }
    }

    const handleRequest = async () => {
        
        checkRateLimit();
        
        setLoading(true);
        if (recaptchaRef.current === null) return;
        const captchaValue = recaptchaRef?.current.getValue()
        if (!captchaValue) {
            setErrorMessage("Please complete the captcha.");
            setLoading(false);
            return;
        }
        recaptchaRef.current?.reset();
        
        let status = false;
        const res = await faucetRequest(address,token);
        console.log(res)
        if (res.error) {
            setErrorMessage(res.error || "Failed to fund account.");
        } else if (res) {
            {
                setSuccess(true);
                status = true;
            }         
        }
        
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
        name?.toLowerCase() == network?.toLowerCase() && <Container sx={{ position: 'relative' }}>
            <Box
                sx={{
                    fontFamily: "TWKEverett-Regular",
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
                        label={language.toUpperCase() + " Address"}
                        variant="outlined"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        sx={{ width: 300, marginBottom: 2, fontFamily: "TWKEverett-Regular" }}
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

                    {loading && <CircularProgress sx={{ position: 'absolute', left: '50%', fontFamily: "TWKEverett-Regular" }} />}

                    <Button
                        onClick={handleRequest}
                        variant="contained"
                        sx={{
                            fontFamily: "TWKEverett-Regular",
                            width: 300,
                            borderRadius: 0,
                            color: 'black',
                            backgroundColor: '#EDEAE6',
                            '&:hover': { backgroundColor: '#C4B8A5' }
                        }}
                    >
                        {/*  */}
                        Get MOVE
                    </Button>
                    <div>
     
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={process.env.REACT_APP_APTOS_DEVNET_SITEKEY??"6LdPgxMqAAAAAByFdD5V8PiPKYZS4mSZWUUcZW6B"}
                                // size="invisible"
                                hl="en"
                                onChange={onChangeRe}
                                theme="dark"
                            />
                    </div>
                    {success && <Alert severity="success" sx={{ width: 300, marginBottom: 2 }}>Funded account {_amount} MOVE</Alert>}
                    {errorMessage && <Alert severity="error" sx={{ width: 300, marginBottom: 2 }}>{errorMessage}</Alert>}
                </form>
            </Box>
        </Container>
    );
}
