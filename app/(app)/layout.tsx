import { ClientProviders } from "@/components/ClientProviders";

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientProviders>{children}</ClientProviders>;
}
