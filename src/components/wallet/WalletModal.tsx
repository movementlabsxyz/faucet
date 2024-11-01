import React from "react";
import {
  AnyAptosWallet,
  AptosPrivacyPolicy,
  WalletItem,
  getAptosConnectWallets,
  isInstallRequired,
  partitionWallets,
  useWallet,
  WalletReadyState,
  SignMessageResponse
} from "@aptos-labs/wallet-adapter-react";
import { WalletName, SignMessagePayload } from '@aptos-labs/wallet-adapter-core';
import { OKXWallet } from "@okwallet/aptos-wallet-adapter";

import {
  Box,
  Breakpoint,
  Button,
  Collapse,
  Dialog,
  Divider,
  IconButton,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { grey } from "./aptosColorPalette";

// reported bug with loading mui icons with esm, therefore need to import like this https://github.com/mui/material-ui/issues/35233
import {
  Close as CloseIcon,
  ExpandMore,
  LanOutlined as LanOutlinedIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { disconnect } from "process";

interface WalletConnectorProps {
  networkSupport?: string;
  handleNavigate?: () => void;
  /**
   * An optional function for sorting wallets that are currently installed or
   * loadable in the wallet connector modal.
   */
  sortDefaultWallets?: (a: AnyAptosWallet, b: AnyAptosWallet) => number;
  /**
   * An optional function for sorting wallets that are NOT currently installed or
   * loadable in the wallet connector modal.
   */
  sortMoreWallets?: (a: AnyAptosWallet, b: AnyAptosWallet) => number;
  /** The max width of the wallet selector modal. Defaults to `xs`. */
  modalMaxWidth?: Breakpoint;
}
interface WalletsModalProps
  extends Pick<
    WalletConnectorProps,
    "networkSupport" | "sortDefaultWallets" | "sortMoreWallets"
  > {
  handleClose: () => void;
  modalOpen: boolean;
  maxWidth?: Breakpoint;
}

export default function WalletsModal({
  handleClose,
  modalOpen,
  networkSupport,
  sortDefaultWallets,
  sortMoreWallets,
  maxWidth,
}: WalletsModalProps): JSX.Element {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const { wallets = [] } = useWallet();

  const BybitWallet: AnyAptosWallet = {
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHZpZXdCb3g9IjAgMCA4OCA4OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMTguN0MwIDguMzcyMjcgOC4zNzIyOCAwIDE4LjcgMEg2OS4zQzc5LjYyNzcgMCA4OCA4LjM3MjI4IDg4IDE4LjdWNjkuM0M4OCA3OS42Mjc3IDc5LjYyNzcgODggNjkuMyA4OEgxOC43QzguMzcyMjcgODggMCA3OS42Mjc3IDAgNjkuM1YxOC43WiIgZmlsbD0iIzQwNDM0NyIvPgo8cGF0aCBkPSJNNy41NzYxNyAyNi44MDY3QzYuNzg1MTYgMjQuMDc4NyA4LjQ3NzUgMjEuMjUzMSAxMS4yNTU5IDIwLjY2M0w1Ny42MDg3IDEwLjgxNzNDNTkuODA5IDEwLjM1IDYyLjA0NDMgMTEuNDQ0MyA2My4wMjQ3IDEzLjQ2ODlMODMuODQ0MyA1Ni40NjU3TDI1LjE3NzYgODcuNTEwMUw3LjU3NjE3IDI2LjgwNjdaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMzEyXzE3NTM0KSIvPgo8cGF0aCBkPSJNOC4xODI0MiAzMC4xNjE4QzcuMzUwNDkgMjcuMjgzOCA5LjI3OTI1IDI0LjM0MTMgMTIuMjUwMiAyMy45NTU5TDczLjY4NjUgMTUuOTg4MUM3Ni4yMzkxIDE1LjY1NzEgNzguNjExMSAxNy4zNjE4IDc5LjExMTEgMTkuODg2N0w4OC4wMDAzIDY0Ljc3NzFMMjQuNjg5MiA4Ny4yNjY1TDguMTgyNDIgMzAuMTYxOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0wIDM0LjIyMjJDMCAyOC44MjIxIDQuMzc3NjYgMjQuNDQ0NSA5Ljc3Nzc4IDI0LjQ0NDVINjguNDQ0NEM3OS4yNDQ3IDI0LjQ0NDUgODggMzMuMTk5OCA4OCA0NFY2OC40NDQ1Qzg4IDc5LjI0NDcgNzkuMjQ0NyA4OCA2OC40NDQ0IDg4SDE5LjU1NTZDOC43NTUzMiA4OCAwIDc5LjI0NDcgMCA2OC40NDQ1VjM0LjIyMjJaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNNTguMjIwMSA2MS4xOTU5VjQyLjg3NTVINjEuNzkzN1Y2MS4xOTU5SDU4LjIyMDFaIiBmaWxsPSIjRjdBNjAwIi8+CjxwYXRoIGQ9Ik0xNy40Mzk1IDY2LjY2MzdIOS43Nzc5NVY0OC4zNDM0SDE3LjEzMTNDMjAuNzA0OSA0OC4zNDM0IDIyLjc4NzQgNTAuMzUwNSAyMi43ODc0IDUzLjQ4OTNDMjIuNzg3NCA1NS41MjE1IDIxLjQ1MDQgNTYuODM0NSAyMC41MjU3IDU3LjI3MjFDMjEuNjMxNSA1Ny43ODY5IDIzLjA0NTYgNTguOTQzOCAyMy4wNDU2IDYxLjM4ODVDMjMuMDQ1NiA2NC44MTA4IDIwLjcwNDkgNjYuNjYzNyAxNy40Mzk1IDY2LjY2MzdaTTE2Ljg0ODEgNTEuNTM0M0gxMy4zNTE2VjU1Ljc1NDhIMTYuODQ4MUMxOC4zNjQyIDU1Ljc1NDggMTkuMjEzOCA1NC45MDY0IDE5LjIxMzggNTMuNjQ1NUMxOS4yMTM4IDUyLjM4MjYgMTguMzY2MiA1MS41MzQzIDE2Ljg0ODEgNTEuNTM0M1pNMTcuMDc5MyA1OC45NzA4SDEzLjM1MTZWNjMuNDcyOEgxNy4wNzkzQzE4LjY5OTQgNjMuNDcyOCAxOS40NyA2Mi40NDMyIDE5LjQ3IDYxLjIwOTJDMTkuNDcyIDU5Ljk3MzMgMTguNjk5NCA1OC45NzA4IDE3LjA3OTMgNTguOTcwOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0zMi44OTI1IDU5LjE1MDFWNjYuNjYzN0gyOS4zNDM5VjU5LjE1MDFMMjMuODQxOSA0OC4zNDM0SDI3LjcyMzhMMzEuMTQzMiA1NS43Mjc4TDM0LjUxMDcgNDguMzQzNEgzOC4zOTI2TDMyLjg5MjUgNTkuMTUwMVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00OC41NjMzIDY2LjY2MzdINDAuOTAxN1Y0OC4zNDM0SDQ4LjI1NTFDNTEuODI4NyA0OC4zNDM0IDUzLjkxMTIgNTAuMzUwNSA1My45MTEyIDUzLjQ4OTNDNTMuOTExMiA1NS41MjE1IDUyLjU3NDIgNTYuODM0NSA1MS42NDk1IDU3LjI3MjFDNTIuNzU1MyA1Ny43ODY5IDU0LjE2OTMgNTguOTQzOCA1NC4xNjkzIDYxLjM4ODVDNTQuMTY3NCA2NC44MTA4IDUxLjgyNjggNjYuNjYzNyA0OC41NjMzIDY2LjY2MzdaTTQ3Ljk3MTkgNTEuNTM0M0g0NC40NzUzVjU1Ljc1NDhINDcuOTcxOUM0OS40ODggNTUuNzU0OCA1MC4zMzc2IDU0LjkwNjQgNTAuMzM3NiA1My42NDU1QzUwLjMzNTcgNTIuMzgyNiA0OS40ODggNTEuNTM0MyA0Ny45NzE5IDUxLjUzNDNaTTQ4LjIwMzEgNTguOTcwOEg0NC40NzUzVjYzLjQ3MjhINDguMjAzMUM0OS44MjMyIDYzLjQ3MjggNTAuNTkzOCA2Mi40NDMyIDUwLjU5MzggNjEuMjA5MkM1MC41OTM4IDU5Ljk3MzQgNDkuODIxMyA1OC45NzA4IDQ4LjIwMzEgNTguOTcwOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik03My40MzkgNTEuNTM0M1Y2Ni42NjM3SDY5Ljg2NTRWNTEuNTM0M0g2NS4wODM5VjQ4LjM0MzRINzguMjIyNFY1MS41MzQzSDczLjQzOVoiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMzEyXzE3NTM0IiB4MT0iNy4zMzMwOCIgeTE9IjI1LjU5NCIgeDI9Ijg0LjYzODEiIHkyPSIyMS43MjE2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNGRkQ3NDgiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRjdBNjAwIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg==",
    name: "Bybit Wallet" as WalletName<string>,
    url: "https://www.bybit.com/web3/home",
    readyState: WalletReadyState.NotDetected,
    isAIP62Standard: false,
    provider: null, // Replace with actual provider if available
    connect: async () => {
        console.log("Connecting to Bybit Wallet...");
    },
    disconnect: async () => {
        console.log("Disconnecting from Bybit Wallet...");
    },
    network: async () => null, // Set to an appropriate network
    signMessage(message: SignMessagePayload): Promise<SignMessageResponse> { return Promise.resolve({} as SignMessageResponse) },
    onNetworkChange: async (callback: any) => {},
    onAccountChange: async (callback: any) => {},
  };

  const walletOrder = [
    "Binance Wallet",
    "OKX Wallet",
    "Bybit Wallet",
    "Pontem",
    "Nightly",
    "Razor Wallet"
  ]

  const {
    /** Wallets that use social login to create an account on the blockchain */
    aptosConnectWallets,
    /** Wallets that use traditional wallet extensions */
    otherWallets,
  } = getAptosConnectWallets(wallets);
  const walletsToInstall = [BybitWallet]
  const walletsToAdd = [new OKXWallet, ];
  otherWallets.push(...walletsToAdd);
  const walletsToRemove = ["Fewcha", "Rise Wallet"]
  
  const {
    /** Wallets that are currently installed or loadable. */
    defaultWallets,
    /** Wallets that are NOT currently installed or loadable. */
    moreWallets,
  } = partitionWallets(otherWallets);
  for (const wallet of defaultWallets) {
    for (const walletToInstall of walletsToInstall) {
      if (wallet.name === walletToInstall.name) {
        walletsToInstall.splice(walletsToInstall.indexOf(walletToInstall), 1);
      }
    }
  }
  const orderWallets = (a: { name: string }, b: { name: string }) => {
    const indexA = walletOrder.indexOf(a.name);
    const indexB = walletOrder.indexOf(b.name);
  
    // Wallets in walletOrder are sorted by their order in walletOrder array
    // Wallets not in walletOrder are placed at the end, keeping original relative order
    if (indexA === -1 && indexB === -1) return 0; // Neither in walletOrder, keep original order
    if (indexA === -1) return 1; // `a` is not in walletOrder, place it after `b`
    if (indexB === -1) return -1; // `b` is not in walletOrder, place it after `a`
    return indexA - indexB; // Both in walletOrder, sort by their order in the array
  };

  moreWallets.push(...walletsToInstall);
  defaultWallets.sort(orderWallets);
  moreWallets.sort(orderWallets);

  for (const wallet of moreWallets) {
    if (walletsToRemove.includes(wallet.name)) {
      moreWallets.splice(moreWallets.indexOf(wallet), 1);
    }
  }

  const hasAptosConnectWallets = !!aptosConnectWallets.length;

  return (
    <Dialog
      open={modalOpen}
      onClose={handleClose}
      aria-label="wallet selector modal"
      sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
      maxWidth={maxWidth ?? "xs"}
      fullWidth
    >
      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          top: "50%",
          left: "50%",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 3,
          gap: 2,
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: grey[450],
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography
          align="center"
          variant="h5"
          pt={2}
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {false ? (
            <>
              <span>Log in or sign up</span>
              <span>with Social + Aptos Connect</span>
            </>
          ) : (
            "Connect Wallet"
          )}
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* {networkSupport && (
            <>
              <LanOutlinedIcon
                sx={{
                  fontSize: "0.9rem",
                  color: grey[400],
                }}
              />
              <Typography
                sx={{
                  display: "inline-flex",
                  fontSize: "0.9rem",
                  color: grey[400],
                }}
                align="center"
              >
                {networkSupport} only
              </Typography>
            </>
          )} */}
        </Box>
        {/* {hasAptosConnectWallets && (
          <>
            <Stack sx={{ gap: 1 }}>
              {aptosConnectWallets.map((wallet) => (
                <AptosConnectWalletRow
                  key={wallet.name}
                  wallet={wallet}
                  onConnect={handleClose}
                />
              ))}
            </Stack>
            <Stack component={AptosPrivacyPolicy} alignItems="center">
              <Typography component="p" fontSize="12px" lineHeight="20px">
                <AptosPrivacyPolicy.Disclaimer />{" "}
                <Box
                  component={AptosPrivacyPolicy.Link}
                  sx={{
                    color: grey[400],
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                  }}
                />
                <span>.</span>
              </Typography>
              <Box
                component={AptosPrivacyPolicy.PoweredBy}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  fontSize: "12px",
                  lineHeight: "20px",
                  color: grey[400],
                }}
              />
            </Stack> 
            <Divider sx={{ color: grey[400], pt: 2 }}>Or</Divider>
          </>
        )}*/}
        <Stack sx={{ gap: 1 }}>
          {defaultWallets.map((wallet : any) => (
            <WalletRow
              key={wallet.name}
              wallet={wallet}
              onConnect={handleClose}
            />
          ))}
          {!!moreWallets.length && (
            <>
              <Button
                variant="text"
                size="small"
                onClick={() => setExpanded((prev) => !prev)}
                endIcon={<ExpandMore sx={{ height: "20px", width: "20px" }} />}
              >
                More Wallets
              </Button>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Stack sx={{ gap: 1 }}>
                  {moreWallets.map((wallet : any) => (
                    <WalletRow
                      key={wallet.name}
                      wallet={wallet}
                      onConnect={handleClose}
                    />
                  ))}
                </Stack>
              </Collapse>
            </>
          )}
        </Stack>
      </Stack>
    </Dialog>
  );
}

interface WalletRowProps {
  wallet: AnyAptosWallet;
  onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  const theme = useTheme();
  return (
    <WalletItem wallet={wallet} onConnect={onConnect} asChild>
      <ListItem disablePadding>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            px: 2,
            py: 1.5,
            gap: 2,
            border: "solid 1px",
            borderColor: theme.palette.mode === "dark" ? grey[700] : grey[200],
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        >
          <Box component={WalletItem.Icon} sx={{ width: 32, height: 32 }} />
          <ListItemText
            primary={wallet.name}
            primaryTypographyProps={{ fontSize: "1.125rem" }}
          />
          {isInstallRequired(wallet) ? (
            <WalletItem.InstallLink asChild>
              <Button
                LinkComponent={"a"}
                size="small"
                className="wallet-connect-install"
              >
                Install
              </Button>
            </WalletItem.InstallLink>
          ) : (
            <WalletItem.ConnectButton asChild>
              <Button
                variant="contained"
                size="small"
                className="wallet-connect-button"
              >
                Connect
              </Button>
            </WalletItem.ConnectButton>
          )}
        </Box>
      </ListItem>
    </WalletItem>
  );
}

function AptosConnectWalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem wallet={wallet} onConnect={onConnect} asChild>
      <WalletItem.ConnectButton asChild>
        <Button
          size="large"
          variant="outlined"
          sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
        >
          <Box component={WalletItem.Icon} sx={{ width: 20, height: 20 }} />
          <WalletItem.Name />
        </Button>
      </WalletItem.ConnectButton>
    </WalletItem>
  );
}