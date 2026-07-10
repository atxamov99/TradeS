import { schemaMigrations, addColumns, createTable } from "@nozbe/watermelondb/Schema/migrations";

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: "products",
          columns: [{ name: "category_id", type: "string", isOptional: true }],
        }),
        createTable({
          name: "categories",
          columns: [
            { name: "name", type: "string" },
            { name: "color", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
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
        createTable({
          name: "supplier_transactions",
          columns: [
            { name: "supplier_id", type: "string", isIndexed: true },
            { name: "supplier_name", type: "string" },
            { name: "amount", type: "number" },
            { name: "type", type: "string" },
            { name: "note", type: "string", isOptional: true },
            { name: "date", type: "number" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
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
        createTable({
          name: "customer_transactions",
          columns: [
            { name: "customer_id", type: "string", isIndexed: true },
            { name: "customer_name", type: "string" },
            { name: "amount", type: "number" },
            { name: "type", type: "string" },
            { name: "note", type: "string", isOptional: true },
            { name: "date", type: "number" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        createTable({
          name: "employees",
          columns: [
            { name: "name", type: "string" },
            { name: "phone", type: "string", isOptional: true },
            { name: "pin", type: "string" },
            { name: "role", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: "products",
          columns: [{ name: "barcode", type: "string", isOptional: true }],
        }),
      ],
    },
  ],
});
