import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roti Sahabat - Fresh • Enak • Terpercaya',
  description: 'Katalog Digital dan Kasir Toko Roti Sahabat Kebumen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
