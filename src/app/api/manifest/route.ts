import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET } from "@/lib/s3";

export async function GET() {
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: "manifest.json" });
    const res = await s3Client.send(cmd);
    const body = await res.Body?.transformToString();
    if (!body) return NextResponse.json({ error: "Empty manifest" }, { status: 500 });
    return NextResponse.json(JSON.parse(body));
  } catch (err) {
    console.error("Manifest fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch manifest" }, { status: 500 });
  }
}
