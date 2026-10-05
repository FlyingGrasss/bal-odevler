# BAL Ödevler deployment

BAL Ödevler, BAL Notes'tan ayrı bir Next.js uygulamasıdır ve `odevler.balogrenci.org` adresine deploy edilir. Veritabanı olarak BAL Notes ile aynı fiziksel Supabase veritabanının `balnotes` şemasındaki ödev tablolarını kullanır.

## Vercel kurulumu

1. Depoyu GitHub'a bağlayın ve Vercel'de yeni bir proje olarak içe aktarın.
2. Production `APP_URL` değerini `https://odevler.balogrenci.org` olarak ayarlayın.
3. `.env.example` içindeki tüm değişkenleri Preview ve Production ortamlarına ekleyin:
   - `DATABASE_URL` (port 6543 transaction pooler)
   - `DIRECT_URL` (port 5432, `?schema=balnotes`)
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `BAL_ID_ISSUER_URL`, `BAL_ID_CLIENT_ID`, `BAL_ID_CLIENT_SECRET`
   - `ADMIN_EMAILS`
4. `odevler.balogrenci.org` özel alan adını ekleyin ve HTTPS'in aktif olduğunu doğrulayın.
5. Production OAuth yönlendirme adresinin tam olarak `https://odevler.balogrenci.org/auth/callback` olduğunu doğrulayın.

## Veritabanı migration'ı

Tablolar BAL Notes ile paylaşılan veritabanında zaten mevcuttur. İlk migration'ı uygulanmış olarak işaretleyin:

```bash
pnpm prisma migrate resolve --applied 20261005120000_baseline
```

## Yayınlama sonrası kontrol listesi

1. `ADMIN_EMAILS` içindeki bir e-posta ile BAL ID üzerinden giriş yapın.
2. `/admin` adresinin yalnızca yöneticilere açık olduğunu doğrulayın.
3. İlk ödev yazarı hesabını oluşturun ve QR bağlantısıyı hemen kaydedin.
4. Ödev yazarı QR ile giriş yapıp ödev paylaşın; herkese açık listede görüntülendiğini doğrulayın.
5. Öğrenci tarayıcısında bir ödevi tamamlandı olarak işaretleyin; kartın yerinde daraldığını ve sayfa yenilendiğinde işaretin korunduğunu doğrulayın.
