import { Platform } from "react-native";
import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { schema } from "./schema";
import { migrations } from "./migrations";
import { Product } from "./models/Product";
import { Sale } from "./models/Sale";
import { Category } from "./models/Category";
import { Supplier } from "./models/Supplier";
import { SupplierTransaction } from "./models/SupplierTransaction";
import { Customer } from "./models/Customer";
import { CustomerTransaction } from "./models/CustomerTransaction";
import { Employee } from "./models/Employee";

// LokiJS — web va Expo Go (native modul mavjud bo'lmaganda fallback).
// SQLite — haqiqiy dev build'larda ishlatiladi (sovuq restart'da ma'lumot saqlanadi).
// Expo Go'da SQLiteAdapter `WMDatabaseBridge` native modulini talab qiladi, u mavjud emas —
// shuning uchun avval SQLiteAdapter'ni sinab ko'ramiz, xato bo'lsa LokiJS'ga tushamiz.
let adapter;
const LOKI_FALLBACK = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: false,
});

try {
  if (Platform.OS === "web") {
    adapter = LOKI_FALLBACK;
  } else {
    adapter = new SQLiteAdapter({
      schema,
      migrations,
      onSetUpError: (error) => {
        console.warn("WatermelonDB SQLite init xatosi — LokiJS fallback:", error);
      },
    });
  }
} catch (_e) {
  // Native modul topilmasa (Expo Go) — LokiJS bilan davom etamiz.
  console.warn("SQLiteAdapter yarata olmadi, LokiJS ishlatilmoqda (Expo Go?)");
  adapter = LOKI_FALLBACK;
}

export const database = new Database({
  adapter,
  modelClasses: [Product, Sale, Category, Supplier, SupplierTransaction, Customer, CustomerTransaction, Employee],
});

export const productsCollection    = database.collections.get<Product>("products");
export const salesCollection       = database.collections.get<Sale>("sales");
export const categoriesCollection  = database.collections.get<Category>("categories");
export const suppliersCollection   = database.collections.get<Supplier>("suppliers");
export const supplierTxCollection  = database.collections.get<SupplierTransaction>("supplier_transactions");
export const customersCollection   = database.collections.get<Customer>("customers");
export const customerTxCollection  = database.collections.get<CustomerTransaction>("customer_transactions");
export const employeesCollection   = database.collections.get<Employee>("employees");
