import React from 'react';
import { Box } from '@mui/system';

export default function Blocked () {
    return (
        <Box
      sx={{
        fontFamily: "TWKEverett-Regular",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        position: 'relative',
      }} >
            <h1>Move with the flow, you have been rate limited</h1>
        </Box>
        
    )
}