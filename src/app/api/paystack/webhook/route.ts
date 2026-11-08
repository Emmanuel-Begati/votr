import { NextRequest, NextResponse } from "next/server";
import { isValidSignature } from "@/lib/paystack";
import { applyVerifiedPayment } from "@/lib/votes";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!isValidSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      const result = await applyVerifiedPayment(event.data.reference);
      console.log("webhook", event.data.reference, result);
    } catch (e) {
      console.error("webhook processing failed", e);
      return NextResponse.json({ error: "processing failed" }, { status: 500 }); // Paystack will retry
    }
  }
  return NextResponse.json({ received: true });
}
