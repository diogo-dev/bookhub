import 'tsconfig-paths/register';
import "dotenv/config";
import fs from "fs";
import z from "zod";
import cors from "cors";
import https from "https";
import express, { Request, Response } from "express";
import "./scripts/refresh_catalog";

import { env } from './config/env';
import { HttpError } from './errors/HttpError';
import routes from './routes';

const app = express();
app.use(express.json());
app.use(cors());

app.use(routes);

app.use((request: Request, response: Response) => {
  response.status(404).json({ message: "not found" });
});

app.use("/", (error: Error, request: Request, response: Response, next: Function) => {
  let code = 500;
  let message = "internal server error";
  let body: Record<string, string> | undefined = undefined;

  if (error instanceof SyntaxError && 'body' in error) {
    code = 400;
    message = "invalid JSON format in request body";
  }

  if (error instanceof z.ZodError) {
    code = 400;
    message = "validation error";

    body = {};
    for (const issue of error.issues) {
      body[issue.path.join(".")] = issue.message;
    }
  }

  if (error instanceof HttpError) {
    code = error.statusCode;
    message = error.message;
  }

  console.log(error);
  response.status(code).json({ message, body });
});

const PORT = env.PORT || 4000;

if (env.NODE_ENV == "production") {
  const options = {
    key: fs.readFileSync(env.HTTPS_KEY_PATH || "key.pem"),
    cert: fs.readFileSync(env.HTTPS_CERT_PATH || "cert.pem")
  }

  https
    .createServer(options, app)
    .listen(PORT, () => console.log(`server is running on port ${PORT}`));
} else app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
