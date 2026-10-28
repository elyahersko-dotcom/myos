import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

// This is a single-owner app, so we tell the owner plainly when a code could not be
// sent instead of pretending it was (the reset code goes out by SMS, not email).
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: false, message: "No account found with that email." });
  }

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const phone = settings?.personalPhone;
  if (!phone) {
    return NextResponse.json({
      ok: false,
      message: "No phone number is saved in Settings, so there's nowhere to text a code. Ask the site admin to reset your password.",
    });
  }
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    return NextResponse.json({ ok: false, message: "Text messaging isn't configured on the server, so a code can't be sent." });
  }

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
    return NextResponse.json({ ok: false, message: "The text message failed to send. Check the phone number in Settings and the Twilio setup." });
  }

  const last4 = phone.replace(/\D/g, "").slice(-4);
  return NextResponse.json({ ok: true, message: `A 6-digit code was texted to the number ending in ${last4}.` });
}
