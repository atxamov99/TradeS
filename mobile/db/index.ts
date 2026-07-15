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

// LokiJS faqat web'da (IndexedDB'ga tayanadi) — native (iOS/Android)da endi WatermelonDB'ning
// o'z SQLite adapteri ishlatiladi (audit: CRITICAL#4). LokiJS native platformada sovuq
// restart'da ma'lumot yo'qotishi mumkin edi; SQLite haqiqiy fayl bazasi bo'lgani uchun
// bunday xavf yo'q. Native modul (`WMDatabaseBridge`) allaqachon autolink qilingan —
// qo'shimcha sozlash shart emas. `jsi` ataylab berilmagan — standart async bridge yetarli.
const adapter = Platform.OS === "web"
  ? new LokiJSAdapter({
      schema,
      migrations,
      useWebWorker: false,
      useIncrementalIndexedDB: false,
    })
  : new SQLiteAdapter({
      schema,
      migrations,
      onSetUpError: (error) => {
        console.warn("WatermelonDB SQLite init xatosi:", error);
      },
    });

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
