import { useEffect, useState } from "react";
import { customersCollection, customerTxCollection } from "@/db";
import { Customer } from "@/db/models/Customer";
import { CustomerTransaction } from "@/db/models/CustomerTransaction";
import { Q } from "@nozbe/watermelondb";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const sub = customersCollection.query().observe().subscribe(setCustomers);
    return () => sub.unsubscribe();
  }, []);

  return customers;
}

export function useCustomer(id: string) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!id) return;
    const sub = customersCollection.query(Q.where("id", id)).observe().subscribe((rows) => {
      setCustomer(rows[0] ?? null);
    });
    return () => sub.unsubscribe();
  }, [id]);

  return customer;
}

export function useCustomerTransactions(customerId: string) {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);

  useEffect(() => {
    if (!customerId) return;
    const sub = customerTxCollection
      .query(Q.where("customer_id", customerId), Q.sortBy("date", Q.desc))
      .observe()
      .subscribe(setTransactions);
    return () => sub.unsubscribe();
  }, [customerId]);

  return transactions;
}
