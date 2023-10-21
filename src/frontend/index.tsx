import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { ThemeProvider, styled } from "@mui/material/styles";

import { lightTheme } from "./theme";
import { Heading } from "./components/heading";
import { ServerList } from "./components/server-list";

import type { ServerConfig } from "../types";

const LogContainer = styled("pre")(({ theme }) => ({
  ...theme.typography.body2,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1),
  margin: theme.spacing(1),
  overflow: "auto",
  maxHeight: "5.75rem",
}));

export function Frontend() {
  const [loaded, setLoaded] = useState(false);
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [logMessages, setLogMessages] = useState<string>("");

  const clickHandler = useCallback(() => {
    window.GmsNotebook.chooseFolder();
  }, []);

  const deleteHandler = useCallback((port: number) => {
    window.GmsNotebook.stopServer(port);
  }, []);

  const toggleIndexingHandler = useCallback((port: number) => {
    window.GmsNotebook.toggleIndexing(port);
  }, []);

  const loadingHandler = useCallback(async () => {
    if (!window.GmsNotebook) {
      setTimeout(loadingHandler, 100);
      return;
    }

    if (loaded) return;

    window.GmsNotebook.onServersRefreshed((newServers: ServerConfig[]) => {
      setServers(() => [...newServers]);
    });
    window.GmsNotebook.onLogMessage((message: string) => {
      setLogMessages((prev) => message + (prev ? "\n" : "") + prev);
    });

    setServers(() => [...window.GmsNotebook.getServers()]);
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    loadingHandler();
  }, [loadingHandler]);

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
        <ServerList
          servers={servers}
          deleteHandler={deleteHandler}
          toggleIndexingHandler={toggleIndexingHandler}
        />
        <Box sx={{ marginTop: "2rem" }}>
          <Typography variant="body2" component="div">
            <LogContainer>{logMessages}</LogContainer>
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
