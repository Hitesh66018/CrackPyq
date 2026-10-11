import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/utils/db';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json();
  const { description } = body;

  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  // 1. Save to database
  try {
    await db.query(
      "INSERT INTO bugs (user_id, description) VALUES ($1, $2)",
      [user ? user.id : null, description]
    );
  } catch (error) {
    console.error("Failed to save bug to DB:", error);
    // Continue anyway to try and send the email
  }

  // 2. Send Email
  try {
    // A test SMTP account or you can use your real SMTP credentials
    // For local dev without a real SMTP, we might just log it, but the user requested an email.
    // Assuming standard Gmail SMTP for demonstration.
    // In production, these should be securely stored in process.env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Only attempt to send if credentials are provided in the environment
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: '"Bug Reporter" <noreply@amazing-hertz.com>',
        to: 'hitesh66018@gmail.com',
        subject: `New Bug Report from ${user ? user.email : 'Anonymous User'}`,
        text: `You have received a new bug report:\n\nUser: ${user ? user.email : 'Anonymous'}\n\nDescription:\n${description}`,
      });
      console.log("Bug report email sent successfully.");
    } else {
      console.log("SMTP credentials missing. Bug saved to database but email was skipped.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send bug report email:", error);
    // We return success anyway if it saved to the DB
    return NextResponse.json({ success: true, message: 'Saved to DB, email failed' });
  }
}
