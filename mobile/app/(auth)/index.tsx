import { Redirect } from "expo-router";

// Landing/hero olib tashlandi — login qilinmagan holatda to'g'ridan-to'g'ri login ekrani ochiladi.
export default function AuthIndex() {
  return <Redirect href="/login" />;
}
