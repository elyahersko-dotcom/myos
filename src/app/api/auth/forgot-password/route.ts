import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const phone = settings?.personalPhone;

  // Always respond the same way whether or not the account/phone exist,
  // so this endpoint can't be used to probe for valid emails.
  const genericResponse = NextResponse.json({
    ok: true,
    message: "If that account exists and has a phone number on file, a reset code was texted to it.",
  });

  if (!user || !phone) return genericResponse;

  const code = generateCode();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetCode: code, resetCodeExpires: new Date(Date.now() + 15 * 60 * 1000) },
  });

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your MyOS password reset code is ${code}. It expires in 15 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (err) {
    console.error("Failed to send reset SMS:", err);
  }

  return genericResponse;
}
