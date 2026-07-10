import { Model } from "@nozbe/watermelondb";
import { field, readonly, date } from "@nozbe/watermelondb/decorators";

export class Employee extends Model {
  static table = "employees";

  @field("name") declare name: string;
  @field("phone") declare phone: string | null;
  @field("pin") declare pin: string;
  @field("role") declare role: "admin" | "cashier";
  @readonly @date("created_at") declare createdAt: Date;
  @readonly @date("updated_at") declare updatedAt: Date;
}
