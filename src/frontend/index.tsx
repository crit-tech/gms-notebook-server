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

function processLogs(logs: string) {
  return logs
    .split("\n")
    .filter((line) => line)
    .map((line, index) => (
      <Box
        sx={{
          borderBottomStyle: "solid",
          borderBottomWidth: "1px",
          borderBottomColor: (theme) => theme.palette.grey[300],
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem",
          color: (theme) =>
            line.startsWith("ERROR:")
              ? theme.palette.error.dark
              : theme.palette.grey[800],
        }}
        key={`log${index}`}
      >
        {line}
      </Box>
    ));
}

export function Frontend() {
  const [loaded, setLoaded] = useState(false);
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [logMessages, setLogMessages] = useState<string>("");

  const addFolderHandler = useCallback(() => {
    window.GmsNotebook.chooseFolder().then((server) => {
      if (!server) return;
      alert(
        `Server added. Click OK to open your browser to connect to GM's Notebook.`
      );
      window.GmsNotebook.openConnect(server.port);
    });
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
      <Container
        sx={{
          width: "100%",
          minHeight: "100vh",
          maxHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "max-content max-content 1fr",
        }}
      >
        <Box>
          <Heading />
          <Button
            variant="contained"
            onClick={addFolderHandler}
            sx={{
              marginBottom: "2rem",
            }}
          >
            Add local folder
          </Button>
        </Box>
        <Box>
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
        </Box>
        <Box
          sx={{
            border: "solid 1px black",
            overflowY: "scroll",
            overflowX: "hidden",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            lineHeight: "1.1rem",
            padding: "0.5rem",
            backgroundColor: (theme) => theme.palette.grey[100],
            marginBottom: "2rem",
          }}
        >
          {processLogs(logMessages)}
        </Box>
      </Container>
    </ThemeProvider>
  );
}
