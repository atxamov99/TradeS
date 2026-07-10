import { Model } from "@nozbe/watermelondb";
import { field, readonly, date } from "@nozbe/watermelondb/decorators";

export class Customer extends Model {
  static table = "customers";

  @field("name") declare name: string;
  @field("phone") declare phone: string | null;
  @field("debt") declare debt: number;
  @field("notes") declare notes: string | null;
  @readonly @date("created_at") declare createdAt: Date;
  @readonly @date("updated_at") declare updatedAt: Date;
}
