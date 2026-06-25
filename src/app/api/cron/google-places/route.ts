import { NextResponse } from "next/server";
import { syncGooglePlacesStats } from "@/features/settings/actions";
import { adminDb } from "@/lib/firebase-admin";
import { DICTIONARY } from "@/constants/dictionary";

// 7 days in milliseconds
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const GET = async (request: Request) => {
  try {
    // 1. Verify authorization (Vercel Cron automatically sends a secret header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Strictly check if auth header matches our CRON_SECRET environment variable
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: DICTIONARY.cron.responses.unauthorized }, { status: 401 });
    }

    // 2. Read current settings to check lastUpdatedAt
    const settingsDoc = await adminDb.collection("settings").doc("general").get();
    const settingsData = settingsDoc.data();

    if (!settingsData) {
      return NextResponse.json({ error: DICTIONARY.cron.responses.settingsNotFound }, { status: 404 });
    }

    const lastUpdatedAt = settingsData.googleStats?.lastUpdatedAt || 0;
    const now = Date.now();

    // 3. Check if 7 days have passed
    if (now - lastUpdatedAt >= SEVEN_DAYS_MS) {
      const response = await syncGooglePlacesStats();
      if (response.success) {
        return NextResponse.json({ success: true, message: DICTIONARY.cron.responses.success });
      }
      return NextResponse.json({ success: false, error: response.error }, { status: 500 });
    }

    // Not enough time has passed
    const nextUpdateDate = new Date(lastUpdatedAt + SEVEN_DAYS_MS);
    return NextResponse.json({
      success: true,
      message: DICTIONARY.cron.responses.noUpdateNeeded,
      nextUpdateAt: nextUpdateDate.toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(DICTIONARY.systemErrors.logs.cronJobFailed, { error: errorMessage });
    return NextResponse.json({ error: DICTIONARY.cron.responses.internalError }, { status: 500 });
  }
};
