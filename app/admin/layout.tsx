import type { Metadata } from "next";

export const metadata: Metadata = { title: "Yönetim" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root" lang="tr" dir="ltr">
      {children}
    </div>
  );
}
