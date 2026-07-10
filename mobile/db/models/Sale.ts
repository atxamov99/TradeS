import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export class Sale extends Model {
  static table = "sales";

  @field("product_id") declare productId: string;
  @field("product_name") declare productName: string;
  @field("qty") declare qty: number;
  @field("sell_price") declare sellPrice: number;
  @field("profit") declare profit: number;
  @field("note") declare note: string | null;
  @field("sold_at") declare soldAt: number;
  @field("is_synced") declare isSynced: boolean;
  @field("server_id") declare serverId: string | null;
  @readonly @date("created_at") declare createdAt: Date;
  @readonly @date("updated_at") declare updatedAt: Date;

  get totalAmount() {
    return this.sellPrice * this.qty;
  }
}
