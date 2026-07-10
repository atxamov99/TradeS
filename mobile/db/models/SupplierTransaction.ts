import { Model } from "@nozbe/watermelondb";
import { field, readonly, date } from "@nozbe/watermelondb/decorators";

export class SupplierTransaction extends Model {
  static table = "supplier_transactions";

  @field("supplier_id") declare supplierId: string;
  @field("supplier_name") declare supplierName: string;
  @field("amount") declare amount: number;
  @field("type") declare type: "debt" | "payment";
  @field("note") declare note: string | null;
  @field("date") declare date: number;
  @readonly @date("created_at") declare createdAt: Date;
  @readonly @date("updated_at") declare updatedAt: Date;
}
