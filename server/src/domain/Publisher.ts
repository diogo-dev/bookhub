import { Address } from "./Address";

class Publisher {
  public ID: string;
  public name: string;
  public address: Address;
  public createdAt: number;

  constructor(ID?: string, createdAt?: number) {
    this.ID = ID || crypto.randomUUID();
    this.createdAt = createdAt || Date.now();
  }
}

export { Publisher };
