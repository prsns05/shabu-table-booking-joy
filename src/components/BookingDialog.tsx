import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  floor: number;
  tableNumber: number;
  onConfirm: (nickname: string) => Promise<void>;
};

export function BookingDialog({
  open,
  onOpenChange,
  floor,
  tableNumber,
  onConfirm,
}: Props) {
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length > 50) return;
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
      setNickname("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>จองโต๊ะ #{tableNumber}</DialogTitle>
            <DialogDescription>ชั้น {floor}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="nickname">ชื่อเล่นของคุณ</Label>
            <Input
              id="nickname"
              autoFocus
              maxLength={50}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น ภูริช"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting || !nickname.trim()}>
              {submitting ? "กำลังจอง..." : "ยืนยันจอง"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
