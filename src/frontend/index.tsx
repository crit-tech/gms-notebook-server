import React from "react";
import { Button, Container, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme } from "./theme";

export function Frontend() {
  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <Typography variant="h1">Hello from GM's Notebook!</Typography>
        <Button variant="contained">Let's do this.</Button>
      </Container>
    </ThemeProvider>
  );
}
