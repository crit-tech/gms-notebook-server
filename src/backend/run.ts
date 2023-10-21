import dotenv from "dotenv";

import { startServer } from "./server";
import { testFilesPath } from "./utils";

dotenv.config();

const port: number = parseInt(process.env.PORT ?? "3001", 10);
const folder: string = process.env.LOCAL_FOLDER ?? testFilesPath;
const indexingKey: string | undefined = process.env.INDEXING_KEY;

startServer(
  {
    port,
    folder,
    indexingEnabled: Boolean(indexingKey),
    indexingKey,
    providerId: "local_1",
  },
  "."
);
