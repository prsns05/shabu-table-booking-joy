import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("คัดลอกแล้ว");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group">
      <pre className="bg-muted/60 rounded-lg p-3 pr-10 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1.5 right-1.5 h-7 w-7"
        onClick={copy}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
}

function Endpoint({
  method,
  name,
  desc,
  url,
  params,
  example,
  responses,
}: {
  method: "GET" | "POST";
  name: string;
  desc: string;
  url: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
  example: string;
  responses: { status: string; body: string }[];
}) {
  const methodColor =
    method === "GET"
      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      : "bg-green-500/15 text-green-600 dark:text-green-400";

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge className={`${methodColor} font-mono`}>{method}</Badge>
          <h3 className="font-bold text-base">{name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>

      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-1.5">
          Endpoint
        </div>
        <CodeBlock code={url} />
      </div>

      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-1.5">
          พารามิเตอร์
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2 font-semibold">ชื่อ</th>
                <th className="text-left p-2 font-semibold">ประเภท</th>
                <th className="text-left p-2 font-semibold">จำเป็น</th>
                <th className="text-left p-2 font-semibold">คำอธิบาย</th>
              </tr>
            </thead>
            <tbody>
              {params.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-2 text-muted-foreground italic">
                    ไม่มี
                  </td>
                </tr>
              ) : (
                params.map((p) => (
                  <tr key={p.name} className="border-t">
                    <td className="p-2 font-mono">{p.name}</td>
                    <td className="p-2 text-muted-foreground">{p.type}</td>
                    <td className="p-2">
                      {p.required ? (
                        <span className="text-red-500">ใช่</span>
                      ) : (
                        <span className="text-muted-foreground">ไม่</span>
                      )}
                    </td>
                    <td className="p-2 text-muted-foreground">{p.desc}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-1.5">
          ตัวอย่าง cURL
        </div>
        <CodeBlock code={example} />
      </div>

      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-1.5">
          ตัวอย่าง Response
        </div>
        <div className="space-y-2">
          {responses.map((r, i) => (
            <div key={i}>
              <div className="text-xs font-mono mb-1 text-muted-foreground">
                {r.status}
              </div>
              <CodeBlock code={r.body} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ApiDocs() {
  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5 bg-[hsl(var(--brand)/0.05)] border-[hsl(var(--brand)/0.2)]">
        <h2 className="font-bold text-lg mb-2">📡 Public API</h2>
        <p className="text-sm text-muted-foreground mb-3">
          API สำหรับเชื่อมกับระบบอื่น ใช้เรียกผ่าน HTTP ได้เลย
          ต้องส่ง header <code className="bg-muted px-1 rounded">apikey</code> และ{" "}
          <code className="bg-muted px-1 rounded">Authorization</code> ด้วยทุก request
        </p>
        <div className="text-xs">
          <div className="font-semibold mb-1">Base URL</div>
          <CodeBlock code={BASE_URL} />
          <div className="font-semibold mb-1 mt-2">apikey / Bearer token (anon)</div>
          <CodeBlock code={ANON_KEY} />
        </div>
      </Card>

      <Endpoint
        method="GET"
        name="1. ดูโต๊ะที่ว่าง"
        desc="คืนรายการโต๊ะที่ยังว่างอยู่ ถ้าไม่ใส่ floor หรือ time_slot จะคืนทั้งหมด"
        url={`GET ${BASE_URL}/api-available-tables?floor=1&time_slot=18:00`}
        params={[
          { name: "floor", type: "number (1-2)", required: false, desc: "ชั้น" },
          { name: "time_slot", type: "string", required: false, desc: "16:00, 18:00 หรือ 20:00" },
        ]}
        example={`curl -H "apikey: ${ANON_KEY}" \\
  -H "Authorization: Bearer ${ANON_KEY}" \\
  "${BASE_URL}/api-available-tables?floor=1&time_slot=18:00"`}
        responses={[
          {
            status: "200 OK",
            body: `{
  "count": 18,
  "available": [
    { "floor": 1, "table_number": 1, "time_slot": "18:00" },
    { "floor": 1, "table_number": 2, "time_slot": "18:00" }
  ]
}`,
          },
        ]}
      />

      <Endpoint
        method="POST"
        name="2. จองโต๊ะ"
        desc="จองโต๊ะที่ว่างอยู่ ถ้ามีคนจองไปแล้วจะคืน 'ช่องไม่ว่าง'"
        url={`POST ${BASE_URL}/api-book-table`}
        params={[
          { name: "nickname", type: "string", required: true, desc: "ชื่อเล่น (1-50 ตัวอักษร)" },
          { name: "floor", type: "number", required: true, desc: "ชั้น 1 หรือ 2" },
          { name: "time_slot", type: "string", required: true, desc: "16:00, 18:00 หรือ 20:00" },
          { name: "table_number", type: "number", required: true, desc: "เลขโต๊ะ 1-20" },
        ]}
        example={`curl -X POST "${BASE_URL}/api-book-table" \\
  -H "apikey: ${ANON_KEY}" \\
  -H "Authorization: Bearer ${ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"nickname":"ภูริช","floor":1,"time_slot":"18:00","table_number":5}'`}
        responses={[
          {
            status: "200 OK (จองสำเร็จ)",
            body: `{ "success": true, "message": "จองสำเร็จ", "reservation": { ... } }`,
          },
          {
            status: "409 Conflict (โต๊ะถูกจองแล้ว)",
            body: `{ "success": false, "message": "ช่องไม่ว่าง" }`,
          },
        ]}
      />

      <Endpoint
        method="POST"
        name="3. คืนโต๊ะ (ออกจากโต๊ะ)"
        desc="คืนโต๊ะ — ต้องระบุชื่อเล่นให้ตรงกับตอนจอง ถ้าไม่ตรงคืนไม่ได้"
        url={`POST ${BASE_URL}/api-release-table`}
        params={[
          { name: "nickname", type: "string", required: true, desc: "ชื่อเล่นที่ใช้ตอนจอง" },
          { name: "floor", type: "number", required: true, desc: "ชั้น 1 หรือ 2" },
          { name: "time_slot", type: "string", required: true, desc: "16:00, 18:00 หรือ 20:00" },
          { name: "table_number", type: "number", required: true, desc: "เลขโต๊ะ 1-20" },
        ]}
        example={`curl -X POST "${BASE_URL}/api-release-table" \\
  -H "apikey: ${ANON_KEY}" \\
  -H "Authorization: Bearer ${ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"nickname":"ภูริช","floor":1,"time_slot":"18:00","table_number":5}'`}
        responses={[
          {
            status: "200 OK",
            body: `{ "success": true, "message": "คืนโต๊ะสำเร็จ" }`,
          },
          {
            status: "403 Forbidden",
            body: `{ "success": false, "message": "ชื่อเล่นไม่ตรงกับเจ้าของการจอง คืนไม่ได้" }`,
          },
          {
            status: "404 Not Found",
            body: `{ "success": false, "message": "ไม่พบการจองของโต๊ะนี้" }`,
          },
        ]}
      />
    </div>
  );
}
