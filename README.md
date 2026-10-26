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

Yönetici girişi BAL ID üzerinden authorization code + PKCE akışıyla yapılır. BAL ID'nin Supabase projesinde OAuth Server etkin olmalıdır. Uygulamayı **confidential client** olarak kaydedin ve şu yönlendirme adreslerini ekleyin:

- Yerel: `http://localhost:3000/auth/callback`
- Canlı: `https://odevler.balogrenci.org/auth/callback`

`BAL_ID_ISSUER_URL` değeri `https://PROJECT_REF.supabase.co/auth/v1` biçimindedir. Uygulama `email profile` kapsamlarını ister. Supabase bu kurulumda yalnızca PostgreSQL barındırıcısı ve BAL ID OAuth issuer'ı olarak kullanılır; uygulama Supabase Auth/SSR oturumu kullanmaz. Callback, oturumu uygulamaya ait `bal_odevler_session` çerezine yazar.

### Yönetici oturumu

- Çerez `bal_odevler_session` adıyla gönderilir; `HttpOnly`, production'da `Secure`, `SameSite=Lax`, `Path=/` ve 1 yıl (365 gün) ömürlüdür.
- Değer, `AUTH_SECRET` ile HMAC-SHA256 imzalanmış sürümlü bir tokendir ve `{ sub, exp }` taşır. Her kimlik doğrulanmış istekte imza yerelde doğrulanır; kullanıcı `sub` ile veritabanından yüklenir ve `BANNED` hesaplar reddedilir. Yöneticilik, veritabanındaki e-posta ile `ADMIN_EMAILS` karşılaştırılarak her istekte yeniden hesaplanır.
- Çıkış `POST /auth/cikis` ile yapılır; 303 döner ve çerezi siler. `GET /auth/cikis` 405 döner. Çıkış yalnızca tarayıcıdaki çerezi siler; kopyalanmış bir token 1 yıllık ömrü dolana veya `AUTH_SECRET` döndürülene kadar geçerli kalır. Sunucu tarafında oturum deposu yoktur. `BANNED` kullanıcılar hemen reddedilir çünkü `getCurrentUser` durumu her istekte veritabanından yeniden okur.
- `AUTH_SECRET` aynı zamanda OAuth state'ini ve yazar anahtarı hash'lerini imzalar. Rotasyonu tüm yönetici oturumlarını ve tüm yazar QR anahtarlarını geçersiz kılar.

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
- Yönetim (`app/admin/page.tsx`) kısmi (partial) bir rotadır: statik kabuk ilk boyamada yayınlanır,
  oturum doğrulaması ve yönetici verisi kendi `Suspense` sınırında akıtılır. Rota artık
  `instant = false` kullanmaz. Anonim `/admin` istekleri `proxy.ts` tarafından render başlamadan
  gerçek bir 307 ile yönlendirilir; sayfa ve server action'lar yetkilendirmenin asıl sınırıdır.
- Yönetici verisi `getHomeworkAdminData` içinde istek bazında render edilir; fonksiyon kendi
  içinde `requireAdmin()` uygular ve `"use cache"` kullanmaz. Yalnızca herkese açık ödev verisi
  `getPublicHomework` içinde `homework` etiketiyle önbelleğe alınır. Mutasyonlar `updateTag` ile
  bu etiketi geçersiz kılar, böylece `/` bir sonraki istekte güncel veriyi görür (çok örnekli
  ortamlarda kısa bir gecikme olabilir). Kimlik doğrulanmış `/admin` yanıtı yönetici verisi
  içerdiğinden CDN'de ortak önbelleğe alınmamalıdır.
- Ana sayfa (`app/page.tsx`) tamamlanan ödev çerezini okuduğu için `export const instant = false`
  ile engelleyici (blocking) rota olarak işaretlenmiştir. Böylece kartlar ilk HTML'de doğru
  boyutta gelir. Ödev verisinin kendisi `getPublicHomework` içinde `"use cache"` ile önbelleğe alınır,
  bu yüzden istek başına yalnızca çerez okuması ve önbellekten okuma yapılır.
