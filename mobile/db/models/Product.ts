import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export class Product extends Model {
  static table = "products";

  @field("name") declare name: string;
  @field("buy_price") declare buyPrice: number;
  @field("sell_price") declare sellPrice: number;
  @field("stock_qty") declare stockQty: number;
  @field("unit") declare unit: string;
  @field("barcode") declare barcode: string | null;
  @field("category_id") declare categoryId: string | null;
  @field("archived_at") declare archivedAt: number | null;
  @field("is_synced") declare isSynced: boolean;
  @field("server_id") declare serverId: string | null;
  @readonly @date("created_at") declare createdAt: Date;
  @readonly @date("updated_at") declare updatedAt: Date;

  get profit() {
    return this.sellPrice - this.buyPrice;
  }

  get isLowStock() {
    return this.stockQty <= 5;
  }
}
