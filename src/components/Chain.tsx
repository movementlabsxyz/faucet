import React, {useEffect, useRef} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {useState, RefObject} from "react";

import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import {Switch, useTheme} from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";

export default function Chains({
  name,
  eventName,
  language,
  amount,
  isEvm,
  network,
  faucetRequest,
}: any) {
  const [address, setAddress] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [token, setToken] = useState<string | null>(null);
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

  useEffect(() => {
    if (recaptchaRef.current) {
      // If you need to do anything with the recaptchaRef, you can do it here
      console.log("ReCAPTCHA is ready");
    }
  }, []);

  const onChangeRe = (value: string | null) => {
    setToken(value);
  };

  const handleRequest = async () => {
    setLoading(true);

    // if (recaptchaRef.current === null)
    //   return console.log("recaptchaRef is null");
    // const captchaValue = recaptchaRef?.current.getValue();
    // if (!captchaValue) {
    //   setErrorMessage("Please complete the captcha.");
    // } else {
      let status = false;
      const res = await faucetRequest(address, token, name);
      console.log(res);
      if (res.error) {
        try {
            setErrorMessage(res.error || "Failed to fund account.");
        } catch (e) {
            setErrorMessage("Unexpected error.");
        }
      } else if (res) {
        setSuccess(true);
        status = true;
      }
    // }
    // recaptchaRef.current?.reset();
    setToken(null);
    setLoading(false);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleRequest(); // Use the wrapper method
  };

  const isValidHex = (str: string, fractal: boolean = false) => {
    const regex = isEvm
      ? fractal
        ? /^0x[a-fA-F0-9]{40}$/
        : /^0x[a-fA-F0-9]{64}$/
      : /^0x[a-fA-F0-9]{64}$/;
    return regex.test(str);
  };

  const _amount = amount;

  return (
    name?.toLowerCase() == network?.toLowerCase() && (
      <Container sx={{position: "relative"}}>
        <Box
          sx={{
            fontFamily: "TWKEverett-Regular",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            poisition: "relative",
            padding: "2rem",
          }}
        >
          <form name={name} onSubmit={handleFormSubmit}>
            <TextField
              label={language.toUpperCase() + " Address"}
              variant="outlined"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              sx={{
                width: 300,
                marginBottom: 2,
                fontFamily: "TWKEverett-Regular",
              }}
              disabled={loading}
              error={!isValidHex(address, true) && address !== ""}
              helperText={
                !isValidHex(address, true) && address !== ""
                  ? `Invalid address. Should be of the form: 0xab12... and be ${
                      isEvm ? "20" : "32"
                    } bytes in length`
                  : ""
              }
            />
            <br />

            {loading && (
              <CircularProgress
                sx={{
                  position: "absolute",
                  left: "50%",
                  fontFamily: "TWKEverett-Regular",
                }}
              />
            )}

            <Button
              onClick={handleRequest}
              variant="contained"
              sx={{
                fontFamily: "TWKEverett-Regular",
                width: 300,
                borderRadius: 0,
                color: "black",
                backgroundColor: "#EDEAE6",
                "&:hover": {backgroundColor: "#C4B8A5"},
              }}
            >
              {/*  */}
              Get MOVE
            </Button>
            {/* <div>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={
                  language == "aptos"
                    ? process.env.REACT_APP_RECAPTCHA_APTOS_PUBLIC_KEY ?? ""
                    : "6LdPgxMqAAAAAByFdD5V8PiPKYZS4mSZWUUcZW6B"
                }
                // size="invisible"
                hl="en"
                onChange={onChangeRe}
                theme="dark"
              />
            </div> */}
            {success && (
              <Alert severity="success" sx={{width: 300, marginBottom: 2}}>
                Funded account {_amount} MOVE
              </Alert>
            )}
            {errorMessage && (
              <Alert severity="error" sx={{width: 300, marginBottom: 2}}>
                {errorMessage}
              </Alert>
            )}
          </form>
        </Box>
      </Container>
    )
  );
}
