import { useEffect, useState } from "react";
import { employeesCollection } from "@/db";
import { Employee } from "@/db/models/Employee";
import { Q } from "@nozbe/watermelondb";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const sub = employeesCollection.query().observe().subscribe(setEmployees);
    return () => sub.unsubscribe();
  }, []);

  return employees;
}

export function useEmployee(id: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (!id) return;
    const sub = employeesCollection.query(Q.where("id", id)).observe().subscribe((rows) => {
      setEmployee(rows[0] ?? null);
    });
    return () => sub.unsubscribe();
  }, [id]);

  return employee;
}
