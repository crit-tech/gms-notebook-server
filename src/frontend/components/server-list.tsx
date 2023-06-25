import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import { Server } from "./server";

import type { ServerPortAndFolderPath } from "../../types";

interface Props {
  servers: ServerPortAndFolderPath[];
  deleteHandler: (port: number) => void;
}

export function ServerList({ servers, deleteHandler }: Props) {
  return (
    <>
      {servers.length === 0 && (
        <Typography variant="h3" sx={{ fontSize: "1rem", marginTop: "1rem" }}>
          No servers running. Click "ADD LOCAL FOLDER" to add one.
        </Typography>
      )}
      <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
        {servers
          .sort((a, b) => a.port - b.port)
          .map((server) => (
            <Server
              key={server.port}
              server={server}
              deleteHandler={deleteHandler}
            />
          ))}
      </List>
    </>
  );
}
