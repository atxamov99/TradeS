import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: "products",
      columns: [
        { name: "name", type: "string" },
        { name: "buy_price", type: "number" },
        { name: "sell_price", type: "number" },
        { name: "stock_qty", type: "number" },
        { name: "unit", type: "string" },
        { name: "barcode", type: "string", isOptional: true },
        { name: "category_id", type: "string", isOptional: true },
        { name: "archived_at", type: "number", isOptional: true },
        { name: "is_synced", type: "boolean" },
        { name: "server_id", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "sales",
      columns: [
        { name: "product_id", type: "string", isIndexed: true },
        { name: "product_name", type: "string" },
        { name: "qty", type: "number" },
        { name: "sell_price", type: "number" },
        { name: "profit", type: "number" },
        { name: "note", type: "string", isOptional: true },
        { name: "sold_at", type: "number", isIndexed: true },
        { name: "is_synced", type: "boolean" },
        { name: "server_id", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "categories",
      columns: [
        { name: "name", type: "string" },
        { name: "color", type: "string" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "suppliers",
      columns: [
        { name: "name", type: "string" },
        { name: "phone", type: "string", isOptional: true },
        { name: "debt", type: "number" },
        { name: "notes", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "supplier_transactions",
      columns: [
        { name: "supplier_id", type: "string", isIndexed: true },
        { name: "supplier_name", type: "string" },
        { name: "amount", type: "number" },
        { name: "type", type: "string" }, // "debt" | "payment"
        { name: "note", type: "string", isOptional: true },
        { name: "date", type: "number" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "customers",
      columns: [
        { name: "name", type: "string" },
        { name: "phone", type: "string", isOptional: true },
        { name: "debt", type: "number" },
        { name: "notes", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "customer_transactions",
      columns: [
        { name: "customer_id", type: "string", isIndexed: true },
        { name: "customer_name", type: "string" },
        { name: "amount", type: "number" },
        { name: "type", type: "string" }, // "debt" | "payment"
        { name: "note", type: "string", isOptional: true },
        { name: "date", type: "number" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "employees",
      columns: [
        { name: "name", type: "string" },
        { name: "phone", type: "string", isOptional: true },
        { name: "pin", type: "string" },
        { name: "role", type: "string" }, // "admin" | "cashier"
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
});
