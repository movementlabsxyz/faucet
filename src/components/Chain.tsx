import React, {useEffect, useRef} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {useState, RefObject} from "react";

import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {useWallet} from "@aptos-labs/wallet-adapter-react";

export default function Chains({
  name,
  eventName,
  language,
  amount,
  isEvm,
  network,
  faucetRequest,
  setMintFunction,
}: any) {
  const {account} = useWallet();
  const address = account?.address;
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

  const createMintFunction = () => {
    return async () => {
      if (hcaptchaRef.current === null) {
        setErrorMessage("Captcha not initialized");
        return false;
      }

      const hcaptchaValue = hcaptchaRef.current.getResponse();
      if (!hcaptchaValue) {
        setErrorMessage("Please complete captcha verification.");
        return false;
      }

      setLoading(true);
      let status = false;
      console.log(account, address, token, name);
      const res = await faucetRequest(address, token, name);
      console.log(res);

      if (res.error) {
        try {
          setErrorMessage(res.error || "Failed to fund account.");
        } catch (e) {
          setErrorMessage("Unexpected error.");
        }
        status = false;
      } else if (res) {
        setSuccess(true);
        status = true;
      }

      hcaptchaRef.current.resetCaptcha();
      setToken(null);
      setLoading(false);
      return status;
    };
  };

  useEffect(() => {
    if (setMintFunction) {
      // Only create the function, don't execute it
      const mintFn = createMintFunction();
      setMintFunction(() => mintFn);
    }
  }, [address, token, name]);

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
        </Box>
      </Container>
    )
  );
}
