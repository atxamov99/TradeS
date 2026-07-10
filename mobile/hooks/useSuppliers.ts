import { useEffect, useState } from "react";
import { suppliersCollection, supplierTxCollection } from "@/db";
import { Supplier } from "@/db/models/Supplier";
import { SupplierTransaction } from "@/db/models/SupplierTransaction";
import { Q } from "@nozbe/watermelondb";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const sub = suppliersCollection.query().observe().subscribe(setSuppliers);
    return () => sub.unsubscribe();
  }, []);

  return suppliers;
}

export function useSupplier(id: string) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!id) return;
    const sub = suppliersCollection.query(Q.where("id", id)).observe().subscribe((rows) => {
      setSupplier(rows[0] ?? null);
    });
    return () => sub.unsubscribe();
  }, [id]);

  return supplier;
}

export function useSupplierTransactions(supplierId: string) {
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);

  useEffect(() => {
    if (!supplierId) return;
    const sub = supplierTxCollection
      .query(Q.where("supplier_id", supplierId), Q.sortBy("date", Q.desc))
      .observe()
      .subscribe(setTransactions);
    return () => sub.unsubscribe();
  }, [supplierId]);

  return transactions;
}
