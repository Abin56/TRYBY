import { getFooterColumns } from "@/lib/content";
import { FooterClient } from "./footer-client";

// Server component — fetches footer link columns from DB.
export async function Footer() {
  const columns = await getFooterColumns();
  return <FooterClient columns={columns} />;
}
