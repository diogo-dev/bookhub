import { Readable } from "stream";
import { createGunzip } from "zlib";
import { createInterface, Interface } from "readline";

export async function fetchDump(url: string): Promise<Interface> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.statusText);
  if (!response.body) throw new Error("Missing body stream at response");

  const gunzip = createGunzip();

  const inputStream = createInterface({
    input: Readable.fromWeb(response.body).pipe(gunzip),
    crlfDelay: Infinity
  });

  return inputStream;
}
