import { Address } from "./Address";

class Publisher {
  public ID: string;
  public name: string;
  public address: Address;
  public createdAt: number;

  constructor() {
    this.ID = crypto.randomUUID();
    this.createdAt = Date.now();
  }
}

export { Publisher };
