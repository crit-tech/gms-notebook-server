import React, { useCallback, useState } from "react";
import {
  Avatar,
  Button,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme } from "./theme";

import type { ServerPortAndFolderPath } from "../types";

export function Frontend() {
  const [servers, setServers] = useState<ServerPortAndFolderPath[]>(
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
        <Typography
          variant="h1"
          sx={{
            fontSize: "2rem",
            marginTop: "2rem",
            marginBottom: "2rem",
          }}
        >
          GM's Notebook Local Server
        </Typography>
        <Button
          variant="contained"
          onClick={clickHandler}
          sx={{
            marginBottom: "2rem",
          }}
        >
          Add local folder
        </Button>
        <Typography variant="h2" sx={{ fontSize: "1.5rem" }}>
          Running servers:
        </Typography>
        {servers.length === 0 && (
          <Typography variant="h3" sx={{ fontSize: "1rem", marginTop: "1rem" }}>
            No servers running. Click "ADD LOCAL FOLDER" to add one.
          </Typography>
        )}
        <List
          sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
        >
          {servers
            .sort((a, b) => a.port - b.port)
            .map((server) => (
              <ListItem key={server.port}>
                <ListItemAvatar>
                  <Avatar>
                    <IconButton onClick={() => deleteHandler(server.port)}>
                      <DeleteIcon />
                    </IconButton>
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`http://localhost:${server.port}`}
                  secondary={server.folderPath}
                />
              </ListItem>
            ))}
        </List>
      </Container>
    </ThemeProvider>
  );
}
