import React, {useEffect, useRef} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {useState, RefObject} from "react";

import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import HCaptcha from "@hcaptcha/react-hcaptcha";

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
  const hcaptchaRef = useRef<HCaptcha | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const onLoad = () => {
    // hcaptchaRef?.current?.execute();
  };
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
    if (hcaptchaRef.current) {
      console.log("Hcaptcha is ready");
    }
  }, []);

  const handleRequest = async () => {
    setLoading(true);

    if (hcaptchaRef.current === null) return console.log("hcaptchaRef is null");
    const hcaptchaValue = hcaptchaRef?.current?.getResponse();
    if (!hcaptchaValue) {
      setErrorMessage("Please complete hcaptcha verification.");
    } else {
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
    }

    hcaptchaRef.current.resetCaptcha();
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
                  left: "45%",
                  fontFamily: "TWKEverett-Regular",
                  zIndex: 10,
                }}
              />
            )}

            <div>
              <HCaptcha
                sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY ?? ""}
                onLoad={onLoad}
                onVerify={setToken}
                ref={hcaptchaRef as RefObject<any>}
              />
            </div>

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
            >
              {/*  */}
              Get MOVE
            </Button>
          </form>
          {success && (
            <Alert severity="success" sx={{width: 300}}>
              Funded account {_amount} MOVE
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{width: 300}}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      </Container>
    )
  );
}
