import { cn } from "@/lib/utils";
import type { Reservation } from "@/hooks/useReservations";

type Props = {
  tableNumber: number;
  reservation?: Reservation;
  isMine: boolean;
  onClick: () => void;
};

export function TableCell({ tableNumber, reservation, isMine, onClick }: Props) {
  const status = !reservation ? "available" : isMine ? "mine" : "other";

  const cls = cn(
    "aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all duration-200 font-semibold relative overflow-hidden",
    status === "available" && "table-cell-available cursor-pointer",
    status === "mine" && "table-cell-mine cursor-pointer",
    status === "other" && "table-cell-other"
  );

  return (
    <button
      onClick={onClick}
      disabled={status === "other"}
      className={cls}
      aria-label={`โต๊ะ ${tableNumber} - ${
        status === "available" ? "ว่าง" : reservation?.nickname
      }`}
    >
      <span className="text-xl sm:text-2xl font-extrabold leading-none">
        {tableNumber}
      </span>
      {reservation ? (
        <span className="text-[10px] sm:text-xs mt-1 truncate max-w-full px-1">
          {reservation.nickname}
        </span>
      ) : (
        <span className="text-[10px] sm:text-xs mt-1 opacity-70">ว่าง</span>
      )}
    </button>
  );
}
