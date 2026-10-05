# BAL Ödevler

Bornova Anadolu Lisesi öğrencileri için ödev takip uygulaması. Next.js App Router, Prisma, Supabase PostgreSQL ve BAL ID OAuth kullanır. Ödevler `notlar.balogrenci.org` (BAL Notes) uygulamasından ayrı bir depo ve deployment olarak çalışır.

## Yerel kurulum

1. Node.js 24 ve pnpm kullanın.
2. `.env.example` dosyasını `.env.local` olarak kopyalayıp değerleri doldurun. Hem Next.js hem Prisma CLI bu dosyayı okur.
3. Bağımlılıkları ve Prisma istemcisini hazırlayın:

   ```bash
   pnpm install
   pnpm prisma generate
   ```

4. Uygulamayı başlatın:

   ```bash
   pnpm dev
   ```

## Veritabanı

Uygulama, BAL Notes ile aynı fiziksel Supabase veritabanındaki `balnotes` şemasındaki ödev tablolarını kullanır (`homework`, `homework_writers`, `homework_writer_sessions`, `homework_login_rate_limits`) ve yönetici kimliği için `balnotes_profile_info` tablosunu okur.

`prisma/migrations/20261005120000_baseline` tabloların mevcut durumunu yansıtır. Tablolar zaten oluşturulduğu için migration'ı uygulanmış olarak işaretleyin:

```bash
pnpm prisma migrate resolve --applied 20261005120000_baseline
```

Yeni migration'lar için:

```bash
pnpm prisma migrate dev --name <aciklama>
```

`DATABASE_URL` port 6543 transaction pooler olmalıdır. `DIRECT_URL`, migration geçmişini ayırmak için port 5432 ve `?schema=balnotes` kullanmalıdır.

## Özellikler

- Öğrenciler güncel ve geçmiş ödevleri giriş yapmadan okur.
- Her kartın solundaki kutu ile ödev "tamamlandı" olarak işaretlenir; işaretlenen ödev yerinde daralır ve daha az yer kaplama şekilde gösterilir. İşaretler `bal-odevler-tamamlanan` çerezinde saklanır; sunucu bu çerezi okuyup kartları ilk boyamada zaten daralmış halde ürettiği için sayfa yüklendiğinde düzen kaymaz. Çerez dolmaya yakınsa en eski işaretler atılır.
- "Tamamlananları gizle" düğmesi işaretlenen ödevleri gizler.
- Öğretmen ve akıllı tahta yazarları QR anahtarıyla `/login` üzerinden giriş yapar ve `/panel` üzerinden ödev paylaşır.
- Yöneticiler BAL ID ile giriş yapar ve `/admin` üzerinden yazar hesapları ile ödevleri yönetir.

## BAL ID OAuth kurulumu

Yönetici girişi BAL ID üzerinden yapılır. BAL ID'nin Supabase projesinde OAuth Server etkin olmalıdır. Uygulamayı **confidential client** olarak kaydedin ve şu yönlendirme adreslerini ekleyin:

- Yerel: `http://localhost:3000/auth/callback`
- Canlı: `https://odevler.balogrenci.org/auth/callback`

`BAL_ID_ISSUER_URL` değeri `https://PROJECT_REF.supabase.co/auth/v1` biçimindedir. Uygulama authorization code + PKCE akışında `email profile` kapsamlarını ister.

## Kontroller

```bash
pnpm test:run
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Sayfa oluşturma (render) modeli

Next.js `cacheComponents` (Partial Prerendering) kullanılır. Kural şu: kullanıcıya bağlı olan her şey
kendi `Suspense` sınırı içinde olmalı, ki statik kabuk (navbar, başlık, alt bilgi) ilk boyamada yer
alsın ve hiçbir düzen kaymasın.

- `/layout` içindeki `SiteHeader` statiktir; sadece oturuma bağlı olan yönetici bağlantısı kendi
  `Suspense` sınırında akıtılır. Navbar önceden üretilmiş HTML'de bulunur, geç yüklenmez.
- Ana sayfa (`app/page.tsx`) tamamlanan ödev çerezini okuduğu için `export const instant = false`
  ile engelleyici (blocking) rota olarak işaretlenmiştir. Böylece kartlar ilk HTML'de doğru
  boyutta gelir. Ödev verisinin kendisi `getPublicHomework` içinde `"use cache"` ile önbelleğe alınır,
  bu yüzden istek başına yalnızca çerez okuması ve önbellekten okuma yapılır.
