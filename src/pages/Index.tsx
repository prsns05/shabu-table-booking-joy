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
import { UtensilsCrossed, Code2, LayoutGrid } from "lucide-react";

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
    if (!existing) {
      setDialogTable(table);
      return;
    }
    if (existing.device_id !== deviceId) {
      toast.error("โต๊ะนี้คนอื่นจองไว้แล้ว");
      return;
    }
    const { data, error } = await supabase.functions.invoke(
      "cancel-reservation",
      {
        body: { reservation_id: existing.id, device_id: deviceId },
      }
    );
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
      if (error.code === "23505") {
        toast.error("โต๊ะนี้เพิ่งถูกจองไปแล้ว");
      } else {
        toast.error("จองไม่สำเร็จ: " + error.message);
      }
      throw error;
    }
    toast.success(`จองโต๊ะ #${dialogTable} เรียบร้อย!`);
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10 max-w-5xl mx-auto">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(var(--brand)/0.1)] text-[hsl(var(--brand))] text-sm font-semibold mb-3">
          <UtensilsCrossed className="w-4 h-4" />
          ร้านชาบูดัง
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          จองโต๊ะออนไลน์
        </h1>
        <p className="text-muted-foreground mt-2">
          เลือกชั้นที่ต้องการ • อัปเดตแบบเรียลไทม์
        </p>
      </header>

      <Tabs defaultValue="booking" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="booking">
            <LayoutGrid className="w-4 h-4 mr-1.5" />
            จองโต๊ะ
          </TabsTrigger>
          <TabsTrigger value="api">
            <Code2 className="w-4 h-4 mr-1.5" />
            API Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="booking" className="mt-0">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="โต๊ะทั้งหมด" value={totalSeats} />
            <StatCard
              label="ว่าง"
              value={totalAvailable}
              valueClass="text-[hsl(var(--table-available-fg))]"
            />
            <StatCard
              label="ถูกจอง"
              value={totalBooked}
              valueClass="text-[hsl(var(--brand))]"
            />
          </div>

          {/* Floor selector */}
          <div className="flex gap-2 mb-4">
            {FLOORS.map((f) => (
              <Button
                key={f}
                variant={activeFloor === f ? "default" : "outline"}
                onClick={() => setActiveFloor(f)}
                className="flex-1 h-12 text-base font-semibold"
              >
                ชั้น {f}
              </Button>
            ))}
          </div>

          {/* Status of current view */}
          <div className="flex items-center justify-between mb-4 px-1 text-sm">
            <span className="text-muted-foreground">ชั้น {activeFloor}</span>
            <span className="font-semibold">
              ว่าง {floorAvailable}/{TABLES_PER_FLOOR} โต๊ะ
            </span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <LegendDot className="bg-[hsl(var(--table-available))] border-[hsl(var(--table-available-border))]" label="ว่าง" />
            <LegendDot className="bg-[hsl(var(--table-mine))]" label="ของคุณ" />
            <LegendDot className="bg-[hsl(var(--table-other))]" label="คนอื่นจอง" />
          </div>

          {/* Tables grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              กำลังโหลด...
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
              {Array.from({ length: TABLES_PER_FLOOR }, (_, i) => i + 1).map(
                (n) => {
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
                }
              )}
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
    </main>
  );
};

function StatCard({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 text-center shadow-sm">
      <div className={`text-2xl sm:text-3xl font-extrabold ${valueClass}`}>
        {value}
      </div>
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

export default Index;
