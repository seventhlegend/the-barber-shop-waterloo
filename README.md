# The Barber Shop Waterloo

Next.js statik tanıtım sitesi ve Square'a bağlı site içi rezervasyon. Canlı ortam Cloudflare Pages + Worker + D1'dır. Rezervasyon seçimi `/book/`, gündüz akışı `/book/daytime/`, VIP akışı `/book/vip/` adresindedir; ödeme işletmede yapılır.

**Sistemin tüm mantığı, Square ayarları, sıfırdan kurulum, yayın, kurtarma ve sorun giderme:** [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

## Yerelde başlatma

Node.js 24 ve pnpm 12.16.1 kullan:

```sh
pnpm install --frozen-lockfile
pnpm env:init
# .env içine Square Access Token ve Location ID ekle.
pnpm env:check
pnpm book
```

`http://localhost:3000/book/` açılır. Yeni `.env` dosyasında gerçek rezervasyon kapalıdır (`BOOKING_ENABLED=false`). `env:init` mevcut `.env` dosyasını veya kurtarma anahtarını değiştirmez.

## Doğrulama ve yayın paketi

```sh
pnpm test
pnpm release:zip
```

Release komutu testleri, frontend/Worker build'ini, Cloudflare runtime kontrolünü ve ZIP güvenlik denetimini çalıştırır. Son ZIP'i Cloudflare Pages'e yükle. İlk kurulumda D1 şemasını ve runtime secret'larını ayrıca tanımla; adımlar rehberdedir.

`.env`, `.booking-data/`, build çıktıları ve ZIP'ler Git'e eklenmez. Hiçbir tokenı `NEXT_PUBLIC_*` değişkenine koyma. Mevcut D1 verisini kullanırken mevcut `CHECKOUT_RECOVERY_SECRET` değerini koru.
