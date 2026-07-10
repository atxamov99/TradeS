import { Model } from "@nozbe/watermelondb";
import { field, readonly, date } from "@nozbe/watermelondb/decorators";

export class CustomerTransaction extends Model {
  static table = "customer_transactions";

  @field("customer_id") declare customerId: string;
  @field("customer_name") declare customerName: string;
  @field("amount") declare amount: number;
  @field("type") declare type: "debt" | "payment";
  @field("note") declare note: string | null;
  @field("date") declare date: number;
  @readonly @date("created_at") declare createdAt: Date;
  @readonly @date("updated_at") declare updatedAt: Date;
}
