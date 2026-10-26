# BAL Ödevler deployment

BAL Ödevler, BAL Notes'tan ayrı bir Next.js uygulamasıdır ve `odevler.balogrenci.org` adresine deploy edilir. Veritabanı olarak BAL Notes ile aynı fiziksel Supabase veritabanının `balnotes` şemasındaki ödev tablolarını kullanır.

## Vercel kurulumu

1. Depoyu GitHub'a bağlayın ve Vercel'de yeni bir proje olarak içe aktarın.
2. Production `APP_URL` değerini `https://odevler.balogrenci.org` olarak ayarlayın.
3. `.env.example` içindeki tüm değişkenleri Preview ve Production ortamlarına ekleyin:
   - `DATABASE_URL` (port 6543 transaction pooler)
   - `DIRECT_URL` (port 5432, `?schema=balnotes`)
   - `AUTH_SECRET`
   - `BAL_ID_ISSUER_URL`, `BAL_ID_CLIENT_ID`, `BAL_ID_CLIENT_SECRET`
   - `ADMIN_EMAILS`
4. `odevler.balogrenci.org` özel alan adını ekleyin ve HTTPS'in aktif olduğunu doğrulayın.
5. Production OAuth yönlendirme adresinin tam olarak `https://odevler.balogrenci.org/auth/callback` olduğunu doğrulayın.

## Yönetici oturumu

Yönetici kimliği BAL ID OAuth (authorization code + PKCE) ile doğrulanır. Callback, Supabase Auth/SSR oturumu yerine uygulamaya ait `bal_odevler_session` çerezini yazar. Çerez `HttpOnly`, production'da `Secure`, `SameSite=Lax`, `Path=/` ve 1 yıl (365 gün) ömürlüdür.

Çerez değeri `AUTH_SECRET` ile HMAC-SHA256 imzalanmış sürümlü bir tokendir; `{ sub, exp }` taşır. `AUTH_SECRET` değerinin başında/sonunda boşluk bırakmayın; değer tam olarak kullanılır ve mevcut yazar anahtarı hash'leri bu değere bağlıdır. Her istekte imza yerelde doğrulanır, kullanıcı `sub` ile veritabanından yüklenir ve `BANNED` hesaplar reddedilir. Yöneticilik, veritabanındaki e-posta ile `ADMIN_EMAILS` karşılaştırılarak her istekte yeniden hesaplanır.

Çıkış `POST /auth/cikis` ile yapılır; 303 döner ve çerezi siler. `GET /auth/cikis` 405 döner. Çıkış yalnızca tarayıcıdaki çerezi siler; kopyalanmış bir token 1 yıllık ömrü dolana veya `AUTH_SECRET` döndürülene kadar geçerli kalır. Sunucu tarafında oturum deposu yoktur. `BANNED` kullanıcılar hemen reddedilir çünkü `getCurrentUser` durumu her istekte veritabanından yeniden okur. `AUTH_SECRET` aynı zamanda OAuth state'ini ve yazar anahtarı hash'lerini imzalar; rotasyonu tüm yönetici oturumlarını ve tüm yazar QR anahtarlarını geçersiz kılar.

## Veritabanı migration'ı

Tablolar BAL Notes ile paylaşılan veritabanında zaten mevcuttur. İlk migration'ı uygulanmış olarak işaretleyin:

```bash
pnpm prisma migrate resolve --applied 20261005120000_baseline
```

## Yayınlama sonrası kontrol listesi

1. `ADMIN_EMAILS` içindeki bir e-posta ile BAL ID üzerinden giriş yapın ve `/admin` adresinin açıldığını doğrulayın.
2. Giriş yapmadan `/admin` isteyin; yanıtın gerçek bir 307 olduğunu ve önbelleğe alınmış bir HTML/hata belgesi dönmediğini doğrulayın.
3. Giriş sonrası `bal_odevler_session` çerezini kontrol edin; sayfayı yenilediğinizde OAuth akışının yeniden başlamadığını doğrulayın.
4. Çerezin `HttpOnly`, `Secure` ve `SameSite=Lax` olduğunu, tarayıcı konsolunda `document.cookie` ile görünmediğini doğrulayın.
5. `ADMIN_EMAILS` dışındaki bir hesapla ve `BANNED` bir hesapla `/admin` erişiminin reddedildiğini doğrulayın.
6. `POST /auth/cikis` isteğinin 303 döndürdüğünü ve `bal_odevler_session` çerezini sildiğini doğrulayın.
7. İlk ödev yazarı hesabını oluşturun ve QR bağlantısını hemen kaydedin.
8. Ödev yazarı QR ile giriş yapıp ödev paylaşın; herkese açık listede görüntülendiğini doğrulayın.
9. `/admin` üzerinden bir mutasyon yapın; `/admin` ve `/` sayfalarının güncellendiğini doğrulayın (çok örnekli ortamlarda kısa bir gecikme olabilir).
10. Öğrenci tarayıcısında bir ödevi tamamlandı olarak işaretleyin; kartın yerinde daraldığını ve sayfa yenilendiğinde işaretin korunduğunu doğrulayın.
11. Kimlik doğrulanmış `/admin` yanıtının CDN'de yönetici verisiyle önbelleğe alınmadığını doğrulayın.
12. Yönetici sayfası açılmazsa `/auth/bal-id?next=/admin` ile yeniden giriş yapın; e-posta normalizasyonu değiştiyse eski oturum yönetici sayılmaz.

`balnotes_profile_info.email` BAL Notes ile paylaşılır. İki uygulama da e-postayı ASCII `toLowerCase()` ile normalize etmelidir; aksi halde aynı kullanıcının e-postası dönüşümlü olarak farklı biçimlerde yazılabilir.

## Geri alma (rollback)

Bu sürüm veritabanı migration'ı içermez. Sorun durumunda önceki deployment'a dönebilirsiniz; ancak eski sürüm Supabase Auth/SSR oturumu kullandığı için Vercel'deki `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değişkenlerini en az bir sürüm boyunca silmeyin. Yeni sürüm bu değişkenleri kullanmaz, fakat rollback yapılan eski deployment bunlara ihtiyaç duyar.

## Önbellek gizliliği

`getHomeworkAdminData` istek bazında render edilir ve kendi içinde `requireAdmin()` uygular; yönetici verisi `"use cache"` ile önbelleğe alınmaz. Yalnızca herkese açık ödev listesi `homework` etiketiyle önbelleğe alınır.

`/admin` kimlik doğrulanmış yönetici verisi içerir; yanıt CDN'de ortak önbelleğe alınmamalıdır. Yayın sonrası kimlik doğrulanmış `/admin` yanıtının özel olduğunu doğrulayın. Yanıt CDN'de yönetici verisiyle önbelleğe alınmışsa CDN'i hemen temizleyin; `/admin` rotasını dinamik yapın veya bu yol için açık bir `private` başlık kuralı ekleyin ve yeniden deploy edin.
