Aşağıda **The Barber Shop – Waterloo Landing Page Planı (Next.js SPA)** için detaylı proje planını `.md` formatında bulabilirsin. Bu plan tasarım, içerik, renk teması, UX akışı ve geliştirici yapısına göre optimize edilmiştir.

---

# 🧔‍♂️ The Barber Shop – Waterloo

**Sharp. Light. Elegant.**
Premium grooming experience in the heart of London.

---

## 🎨 Design & Brand Identity

**Renk Paleti**

| Renk             | Kod       | Kullanım                            |
| ---------------- | --------- | ----------------------------------- |
| Siyah (Mat)      | `#0E0E0E` | Arka plan, navbar, footer           |
| Altın            | `#D4AF37` | Başlıklar, ikonlar, hover efektleri |
| Krem Beyaz       | `#F5F5F5` | Metin, kontrast alanlar             |
| Gri              | `#B8B8B8` | Alt başlıklar, yardımcı yazılar     |
| Ek Ton (Logodan) | `#5A3E2B` | Arkaplan blokları, kutular          |

> 💡 Minimal animasyon: fade-in girişler, hover’da altın tonlu geçiş efektleri
> Yazı tipi: **Playfair Display (titles)** + **Inter (body)**
> Stil: **Modern London elegance** – minimal, sessiz lüks.

---

## 🧭 Site Haritası / Bölümler

### 1. Hero Section

**Amaç:** Markayı ilk bakışta premium ve modern göstermek.

**İçerik:**

```
THE BARBER SHOP
Sharp. Light. Elegant.
Experience refined grooming in the heart of London.
[Book an Appointment]  [Explore Services]
```

**Arka Plan:**
Koyu siyah degrade üzerinde, altın tonda silik _London Eye_ silueti.
Text animasyonu: fade-in + parlayan altın geçiş.
CTA hover’da altın çerçeveye dönüşür.

---

### 2. About Section

**Başlık:** About Us
**Metin:**

> Located near the London Eye, The Barber Shop blends traditional craftsmanship with modern elegance.
> Our mission: redefine men’s grooming — refined, calm, and sophisticated.

Arka plan: blur’lu iç mekan fotoğrafı (gold overlay)
3 sütunlu yapı: “Craftsmanship”, “Calm Atmosphere”, “Refined Style”

---

### 3. Services Section

**Başlık:** Our Services
Alt metin: “Premium grooming, designed for the modern gentleman.”

**Servis kartları (grid)**

- Classic Haircut – £36
- The Skin Fade – £38
- Scissor Precision Cut – £38
- Traditional Hot Towel Shave – £28
- Beard Trim “Gimgim Style” – £28
- Total Relaxing – £70

> 💡 Alt kısım:
> “All services come with complimentary drinks — coffee, wine or whisky.”

Hover’da altın kenar + subtle zoom animasyonu.

---

### 4. Experience Section (Extras)

> Enjoy complimentary drinks — from artisan coffee to fine whisky — while you unwind.
> More than a haircut. A ritual.

Arka plan: koyu kahve ton + bokeh fotoğraf efekti
İkonlar: coffee ☕ whisky 🥃 towel 💆

---

### 5. Gallery Section

**Başlık:** Inside The Barber Shop
Küçük video (auto-play muted) + grid galeri (mekan, ekip, ürünler, detaylar)
Hover’da fade overlay ve “View” ikonu.

---

### 6. Location Section

**Başlık:** Find Us in Waterloo
Google Maps embed

> Just steps from the London Eye and Waterloo Station.

Adres:
📍 123 York Road, Waterloo, London SE1
Button: [Open in Maps]

---

### 7. Footer

**İçerik:**

```
🕰 Opening Hours
Mon–Fri: 9:30 – 19:00
Sat–Sun: 10:00 – 17:00

✉️ cut@waterloobarber.shop
📍 London Waterloo
📱 @thebarbershop.london

THE BARBER SHOP
Sharp. Light. Refined.
```

Alt bar:
“© 2025 The Barber Shop – Designed in London.”

---

## ⚙️ Teknik Yapı (Next.js + Tailwind)

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS + Framer Motion (animasyon)
- **Fontlar:** Google Fonts – Playfair Display, Inter
- **Video Player:** ReactPlayer (auto-muted, loop)
- **Map:** Google Maps embed (responsive container)
- **SEO:** Meta tags (title, description, open graph)
- **Responsive:** Full mobile-first design (flex-col → flex-row transition)
- **Deployment:** Vercel

---

## 📞 CTA & Aksiyonlar

- `Book an Appointment → mailto:cut@waterloobarber.shop`
- “Free Membership” butonu (opsiyonel, şimdilik kapalı)
- “Follow us” → Instagram / TikTok ikonları

---

## 🔧 Dosya & Klasör Yapısı (önerilen)

```
/app
 ├─ page.tsx
 ├─ components/
 │   ├─ Hero.tsx
 │   ├─ About.tsx
 │   ├─ Services.tsx
 │   ├─ Experience.tsx
 │   ├─ Gallery.tsx
 │   ├─ Location.tsx
 │   ├─ Footer.tsx
 │   └─ Navbar.tsx
 ├─ styles/
 │   ├─ globals.css
 │   └─ animations.css
 └─ public/
     ├─ logo.svg
     ├─ gallery/
     └─ video.mp4
```

---

## 📸 İçerik Gereksinimleri

- 5–6 iç mekan fotoğrafı (berber koltuğu, whisky servisi, detaylar)
- 1 kısa tanıtım videosu (sessiz, 10–15 sn)
- London Eye veya Waterloo çevresinden 1 dış çekim fotoğrafı (arka plan için)
- Logo (veya SVG hali)

---

## 🚀 Geliştirme Akışı

4. Font ve renk teması global CSS’e eklenir
5. Section bileşenleri tek sayfada sıralanır (SPA)
