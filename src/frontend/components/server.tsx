import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import DeleteIcon from "@mui/icons-material/Delete";

import type { ServerPortAndFolderPath } from "../../types";

interface Props {
  server: ServerPortAndFolderPath;
  deleteHandler: (port: number) => void;
}

export function Server({ server, deleteHandler }: Props) {
  return (
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
  );
}
