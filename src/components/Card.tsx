import React, {useContext} from "react";
import {Box, BoxProps, useTheme} from "@mui/material";
import {grey} from "../themes/colors/aptosColorPalette";

interface CardProps extends BoxProps {
  children: React.ReactNode;
}

export function CardWithStyle({children, ...props}: CardProps) {

  return  (
    <Card {...props}>{children}</Card>
  )
}

export function Card({children, ...props}: CardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        background: theme.palette.mode === "dark" ? grey[800] : grey[100],
        padding: 2.5,
        borderRadius: 1,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

export function CardOutline({children, ...props}: CardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        padding: 2.5,
        borderRadius: 1,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0px 0px 5px 2px rgba(256, 256, 256, 0.15)"
            : "0px 0px 5px 2px rgba(0, 0, 0, 0.05)",
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
