import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Header from "./Header";
import Footer from "./Footer";
import {GlobalStateProvider} from "../../global-config/GlobalConfig";
import {ProvideColorMode} from "../../context";
// import {GraphqlClientProvider} from "../../api/hooks/useGraphqlClient";

interface LayoutProps {
  children: React.ReactNode;
}

export default function ExplorerLayout({children}: LayoutProps) {
  return (
    <ProvideColorMode>
      <CssBaseline />
      <GlobalStateProvider>
        {/* <GraphqlClientProvider> */}
        <Box
          component="main"
          sx={{
            minHeight: "100vh",
            backgroundColor: "transparent",
            backgroundAttachment: "fixed",
            backgroundImage: "url('/background3.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Header />
          <Container
            maxWidth="xl"
            sx={{
              flexGrow: 4,
              paddingTop: "2rem",
              display: "flex", // Make the Container a flex container
              flexDirection: "column",
              justifyContent: "center", // Center the content vertically
            }}
          >
            {children}
          </Container>
          <Footer />
        </Box>
        {/* </GraphqlClientProvider> */}
      </GlobalStateProvider>
    </ProvideColorMode>
  );
}
