import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useReservations, type Reservation } from "@/hooks/useReservations";
import { getDeviceId } from "@/lib/device";
import { TableCell } from "@/components/TableCell";
import { BookingDialog } from "@/components/BookingDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiDocs } from "@/components/ApiDocs";
import { toast } from "sonner";
import {
  Code2,
  LayoutGrid,
  Flame,
  Star,
  MapPin,
  Clock,
  Phone,
  Sparkles,
  Beef,
  Fish,
  Soup,
} from "lucide-react";
import logo from "@/assets/logo.png";
import heroImg from "@/assets/hero-shabu.jpg";
import menuBeef from "@/assets/menu-beef.jpg";
import menuSeafood from "@/assets/menu-seafood.jpg";
import menuBroth from "@/assets/menu-broth.jpg";

const FIXED_SLOT = "all";
const FLOORS = [1, 2] as const;
const TABLES_PER_FLOOR = 20;

const Index = () => {
  const deviceId = useMemo(() => getDeviceId(), []);
  const { reservations, loading } = useReservations();
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [dialogTable, setDialogTable] = useState<number | null>(null);

  const floorReservations = reservations.filter((r) => r.floor === activeFloor);
  const totalSeats = FLOORS.length * TABLES_PER_FLOOR;
  const totalBooked = reservations.length;
  const totalAvailable = totalSeats - totalBooked;
  const floorAvailable = TABLES_PER_FLOOR - floorReservations.length;

  const findReservation = (table: number): Reservation | undefined =>
    floorReservations.find((r) => r.table_number === table);

  const handleTableClick = async (table: number) => {
    const existing = findReservation(table);
    if (!existing) return setDialogTable(table);
    if (existing.device_id !== deviceId) {
      toast.error("โต๊ะนี้คนอื่นจองไว้แล้ว");
      return;
    }
    const { data, error } = await supabase.functions.invoke("cancel-reservation", {
      body: { reservation_id: existing.id, device_id: deviceId },
    });
    if (error || (data && data.error)) {
      toast.error("ยกเลิกไม่สำเร็จ: " + (error?.message || data?.error));
    } else {
      toast.success("ยกเลิกการจองแล้ว");
    }
  };

  const handleBookConfirm = async (nickname: string) => {
    if (dialogTable == null) return;
    const { error } = await supabase.from("reservations").insert({
      floor: activeFloor,
      table_number: dialogTable,
      time_slot: FIXED_SLOT,
      nickname,
      device_id: deviceId,
    });
    if (error) {
      if (error.code === "23505") toast.error("โต๊ะนี้เพิ่งถูกจองไปแล้ว");
      else toast.error("จองไม่สำเร็จ: " + error.message);
      throw error;
    }
    toast.success(`จองโต๊ะ #${dialogTable} เรียบร้อย!`);
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2">
            <img src={logo} alt="Joy Joy Shabu logo" width={36} height={36} className="w-9 h-9" />
            <span className="font-display font-bold text-lg text-[hsl(var(--brand))]">
              Joy Joy <span className="text-gold">Shabu</span>
            </span>
          </button>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollTo("about")} className="hover:text-[hsl(var(--brand))]">เกี่ยวกับเรา</button>
            <button onClick={() => scrollTo("menu")} className="hover:text-[hsl(var(--brand))]">เมนูเด่น</button>
            <button onClick={() => scrollTo("booking")} className="hover:text-[hsl(var(--brand))]">จองโต๊ะ</button>
            <button onClick={() => scrollTo("contact")} className="hover:text-[hsl(var(--brand))]">ติดต่อ</button>
          </div>
          <Button onClick={() => scrollTo("booking")} className="bg-gradient-brand text-white border-0 shadow-warm hover:opacity-90">
            จองโต๊ะ
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="ชาบูชาบูหม้อไฟพรีเมียม" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(20_35%_8%/0.92)] via-[hsl(20_35%_8%/0.7)] to-[hsl(20_35%_8%/0.4)]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-32 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm mb-6">
            <Flame className="w-4 h-4 text-gold" />
            ชาบูพรีเมียมยอดนิยม • เปิดทุกวัน
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-black leading-tight max-w-3xl">
            อร่อยร้อนถึงใจ <br />
            <span className="text-gold">ทุกคำคือความสุข</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl">
            เนื้อนำเข้าคัดพิเศษ น้ำซุปต้มกระดูกเคี่ยวกว่า 12 ชั่วโมง
            พร้อมบรรยากาศอบอุ่น เหมาะกับทุกมื้อพิเศษ
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => scrollTo("booking")} className="bg-gradient-brand text-white border-0 shadow-warm h-12 px-7 text-base">
              จองโต๊ะออนไลน์
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("menu")} className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-12 px-7 text-base">
              ดูเมนูเด่น
            </Button>
          </div>
          <div className="mt-12 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold text-gold" />
              ))}
              <span className="ml-2 text-white/80">4.9 / 5 จาก 2,300+ รีวิว</span>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Sparkles, title: "วัตถุดิบพรีเมียม", desc: "เนื้อวากิว A5 และซีฟู้ดสดใหม่ทุกวัน คัดสรรจากแหล่งคุณภาพ" },
            { icon: Soup, title: "น้ำซุปสูตรลับ", desc: "เคี่ยวกระดูกกว่า 12 ชั่วโมง หอม กลมกล่อม รสชาติเป็นเอกลักษณ์" },
            { icon: Flame, title: "บรรยากาศอบอุ่น", desc: "ออกแบบให้เหมาะกับทุกโอกาส ไม่ว่าจะครอบครัว เพื่อน หรือคนพิเศษ" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl bg-card p-7 shadow-soft border border-border/60 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand grid place-items-center text-white mb-4 shadow-warm">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="py-20 px-4 bg-secondary/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[hsl(var(--brand))] font-semibold tracking-widest text-sm uppercase">Signature</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mt-2">เมนูเด่นของเรา</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: menuBeef, icon: Beef, title: "เนื้อวากิว A5", desc: "หั่นบางพิเศษ ลายหินอ่อนสวย ละลายในปาก", price: "฿590" },
              { img: menuSeafood, icon: Fish, title: "ซีฟู้ดรวมพรีเมียม", desc: "กุ้งลายเสือ หอยแมลงภู่ ปลาแซลมอน สดทุกวัน", price: "฿490" },
              { img: menuBroth, icon: Soup, title: "ต้มยำหม้อไฟ", desc: "เผ็ดร้อน หอมตะไคร้ใบมะกรูด รสจัดจ้าน", price: "฿290" },
            ].map(({ img, icon: Icon, title, desc, price }) => (
              <article key={title} className="group rounded-2xl overflow-hidden bg-card shadow-soft border border-border/60 hover:shadow-warm transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img src={img} alt={title} loading="lazy" width={800} height={800} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-[hsl(var(--brand))]" />
                      <h3 className="font-display text-xl font-bold">{title}</h3>
                    </div>
                    <span className="text-gold font-bold">{price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Booking */}
      <section id="booking" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[hsl(var(--brand))] font-semibold tracking-widest text-sm uppercase">Reservation</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mt-2">จองโต๊ะออนไลน์</h2>
            <p className="text-muted-foreground mt-3">เลือกชั้นและโต๊ะที่ต้องการ • อัปเดตเรียลไทม์</p>
          </div>

          <Tabs defaultValue="booking" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md mx-auto">
              <TabsTrigger value="booking">
                <LayoutGrid className="w-4 h-4 mr-1.5" /> จองโต๊ะ
              </TabsTrigger>
              <TabsTrigger value="api">
                <Code2 className="w-4 h-4 mr-1.5" /> API Docs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="booking" className="mt-0">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard label="โต๊ะทั้งหมด" value={totalSeats} />
                <StatCard label="ว่าง" value={totalAvailable} valueClass="text-[hsl(var(--table-available-fg))]" />
                <StatCard label="ถูกจอง" value={totalBooked} valueClass="text-[hsl(var(--brand))]" />
              </div>

              <div className="flex gap-2 mb-4">
                {FLOORS.map((f) => (
                  <Button
                    key={f}
                    variant={activeFloor === f ? "default" : "outline"}
                    onClick={() => setActiveFloor(f)}
                    className={`flex-1 h-12 text-base font-semibold ${activeFloor === f ? "bg-gradient-brand text-white border-0 shadow-warm" : ""}`}
                  >
                    ชั้น {f}
                  </Button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 px-1 text-sm">
                <span className="text-muted-foreground">ชั้น {activeFloor}</span>
                <span className="font-semibold">ว่าง {floorAvailable}/{TABLES_PER_FLOOR} โต๊ะ</span>
              </div>

              <div className="flex flex-wrap gap-3 mb-4 text-xs">
                <LegendDot className="bg-[hsl(var(--table-available))] border-[hsl(var(--table-available-border))]" label="ว่าง" />
                <LegendDot className="bg-[hsl(var(--table-mine))]" label="ของคุณ" />
                <LegendDot className="bg-[hsl(var(--table-other))]" label="คนอื่นจอง" />
              </div>

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                  {Array.from({ length: TABLES_PER_FLOOR }, (_, i) => i + 1).map((n) => {
                    const res = findReservation(n);
                    return (
                      <TableCell
                        key={n}
                        tableNumber={n}
                        reservation={res}
                        isMine={!!res && res.device_id === deviceId}
                        onClick={() => handleTableClick(n)}
                      />
                    );
                  })}
                </div>
              )}

              {dialogTable !== null && (
                <BookingDialog
                  open={dialogTable !== null}
                  onOpenChange={(v) => !v && setDialogTable(null)}
                  floor={activeFloor}
                  tableNumber={dialogTable}
                  onConfirm={handleBookConfirm}
                />
              )}
            </TabsContent>

            <TabsContent value="api" className="mt-0">
              <ApiDocs />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4 bg-[hsl(var(--ink))] text-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="logo" width={40} height={40} className="w-10 h-10" />
              <span className="font-display font-bold text-xl">
                Joy Joy <span className="text-gold">Shabu</span>
              </span>
            </div>
            <p className="text-white/70 text-sm">ชาบูพรีเมียม สำหรับทุกความสุขในมื้ออาหารของคุณ</p>
          </div>
          <InfoBlock icon={MapPin} title="ที่อยู่" lines={["123 ถนนสุขุมวิท", "กรุงเทพฯ 10110"]} />
          <InfoBlock icon={Clock} title="เวลาทำการ" lines={["จันทร์ - อาทิตย์", "11:00 - 23:00 น."]} />
          <div className="md:col-span-3 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> 02-123-4567
            </div>
            <div>© {new Date().getFullYear()} Joy Joy Shabu. All rights reserved.</div>
          </div>
        </div>
      </section>
    </main>
  );
};

function StatCard({ label, value, valueClass = "" }: { label: string; value: number; valueClass?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 text-center shadow-soft">
      <div className={`text-2xl sm:text-3xl font-extrabold ${valueClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-4 h-4 rounded border-2 ${className}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function InfoBlock({ icon: Icon, title, lines }: { icon: any; title: string; lines: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-gold" />
        <h4 className="font-bold">{title}</h4>
      </div>
      {lines.map((l) => (
        <p key={l} className="text-white/70 text-sm">{l}</p>
      ))}
    </div>
  );
}

export default Index;
