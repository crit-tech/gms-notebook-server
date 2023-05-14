import React, { useCallback, useState } from "react";
import { Button, Container, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme } from "./theme";

import type { ServerPortAndFolderPath } from "../types";

export function Frontend() {
  console.log("Hello from Frontend!", window.GmsNotebook);
  const [servers, setServers] = useState<ServerPortAndFolderPath[]>([]);

  const clickHandler = useCallback(async () => {
    const item = await window.GmsNotebook.chooseFolder();
    if (item) {
      setServers((servers) => [...servers, item]);
    }
  }, []);

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <Typography variant="h1">Hello from GM's Notebook!</Typography>
        <Button variant="contained" onClick={clickHandler}>
          Let's do this.
        </Button>
        <ul>
          {servers.map((server) => (
            <li key={server.port}>
              {server.port}: {server.folderPath}
            </li>
          ))}
        </ul>
      </Container>
    </ThemeProvider>
  );
}
