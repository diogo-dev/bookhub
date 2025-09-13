import { AddressRepository } from "@/repositories/AddressRepository";
import { Address } from "@/domain/Address";
import { Client } from "pg";

export interface AddressRecord {
  id: string;
  postal_code: string;
  place_name: string;
  street_name: string;
  street_number: number;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
}

export class AddressRepositoryPostgresImpl implements AddressRepository {
  constructor(private client: Client) {}

  public async find(id: string): Promise<Address | null> {
    const result = await this.client.query("SELECT * FROM address WHERE id = $1;", [id]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async save(address: Address): Promise<void> {
    const result = await this.client.query("SELECT * FROM address WHERE id = $1;", [address.ID]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE address SET postal_code = $2, place_name = $3, street_name = $4, street_number = $5, complement = $6, neighborhood = $7, city = $8, state = $9, country = $10 WHERE id = $1;",
        [address.ID, address.postalCode, address.placeName, address.streetName, address.streetNumber, address.complement, address.neighborhood, address.city, address.state, address.country]
      );
    } else {
      await this.client.query(
        "INSERT INTO address (id, postal_code, place_name, street_name, street_number, complement, neighborhood, city, state, country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);",
        [address.ID, address.postalCode, address.placeName, address.streetName, address.streetNumber, address.complement, address.neighborhood, address.city, address.state, address.country]
      );
    }
  }

  private deserialize(record: AddressRecord): Address {
    const address = new Address(record.id);
    address.postalCode = record.postal_code;
    address.placeName = record.place_name;
    address.streetName = record.street_name;
    address.streetNumber = record.street_number;
    address.complement = record.complement;
    address.neighborhood = record.neighborhood;
    address.city = record.city;
    address.state = record.state;
    address.country = record.country;
    return address;
  }
}
