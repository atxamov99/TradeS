import { Model } from "@nozbe/watermelondb";
import { field, readonly, date } from "@nozbe/watermelondb/decorators";

export class Shop extends Model {
  static table = "shops";

  @field("server_id") declare serverId: string;
  @field("name") declare name: string;
  @field("description") declare description: string | null;
  @field("is_blocked") declare isBlocked: boolean;
  @field("is_synced") declare isSynced: boolean;
  @readonly @date("created_at") declare createdAt: Date;
  @readonly @date("updated_at") declare updatedAt: Date;
}
