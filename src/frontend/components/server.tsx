import { useCallback, useState } from "react";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Switch from "@mui/material/Switch";

import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOffIcon from "@mui/icons-material/FolderOff";

import type { ServerConfig } from "../../types";

interface Props {
  server: ServerConfig;
  deleteHandler: (port: number) => void;
}

export function Server({ server, deleteHandler }: Props) {
  const [checked, setChecked] = useState<boolean>(!!server.indexingKey);

  const handleToggle = useCallback(() => {
    setChecked((prev) => !prev);
  }, []);

  return (
    <ListItem key={server.port}>
      <ListItemAvatar>
        <Avatar>
          (
          {server.connected ? (
            <FolderIcon />
          ) : (
            <IconButton
              onClick={() => alert("connect!")}
              title="Not connected. Click to connect."
            >
              <FolderOffIcon />
            </IconButton>
          )}
          )
        </Avatar>
      </ListItemAvatar>{" "}
      <ListItemText
        primary={`http://localhost:${server.port}`}
        secondary={server.folderPath}
      />
      <IconButton onClick={() => deleteHandler(server.port)} title="Delete">
        <DeleteIcon />
      </IconButton>
      <Switch
        edge="end"
        onChange={handleToggle}
        checked={checked}
        inputProps={{
          "aria-labelledby": "switch-list-label",
        }}
        title="Search enabled"
      />
    </ListItem>
  );
}
