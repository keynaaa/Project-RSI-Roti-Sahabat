export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Roti Sahabat Kebumen</h1>
      <p>Backend API siap digunakan. Silakan uji endpoint via Postman.</p>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/produk">/api/produk</a></li>
      </ul>
    </main>
  );
}
