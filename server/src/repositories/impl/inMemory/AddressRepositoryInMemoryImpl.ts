import { AddressRepository } from "@/repositories/AddressRepository";
import { Address } from "@/domain/Address";

export class AddressRepositoryInMemoryImpl implements AddressRepository {
  private addresses: Map<string, Address> = new Map();

  public async find(id: string): Promise<Address | null> {
    return this.addresses.get(id) || null;
  }

  public async save(address: Address): Promise<void> {
    this.addresses.set(address.ID, address);
  }
}
