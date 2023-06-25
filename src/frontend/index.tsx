import React, { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";

import { lightTheme } from "./theme";
import { Heading } from "./components/heading";
import { ServerList } from "./components/server-list";

import type { ServerConfig } from "../types";

export function Frontend() {
  const [servers, setServers] = useState<ServerConfig[]>(
    window.GmsNotebook.getServers()
  );

  const clickHandler = useCallback(async () => {
    const item = await window.GmsNotebook.chooseFolder();
    if (item) {
      setServers((servers) => [...servers, item]);
      window.GmsNotebook.saveSettings();
    }
  }, []);

  const deleteHandler = useCallback(async (port: number) => {
    await window.GmsNotebook.stopServer(port);
    setServers((servers) => servers.filter((s) => s.port !== port));
    window.GmsNotebook.saveSettings();
  }, []);

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <Heading />
        <Button
          variant="contained"
          onClick={clickHandler}
          sx={{
            marginBottom: "2rem",
          }}
        >
          Add local folder
        </Button>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Typography variant="h2" sx={{ fontSize: "1.5rem" }}>
            Running servers:
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", textAlign: "right" }}
            id="switch-list-label"
          >
            Search
            <br />
            enabled?
          </Typography>
        </Box>
        <ServerList servers={servers} deleteHandler={deleteHandler} />
      </Container>
    </ThemeProvider>
  );
}
