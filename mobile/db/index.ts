import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
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

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: false,
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
