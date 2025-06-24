import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import AdmZip from "adm-zip";
import path from "path";
import fs from "fs/promises";

// Helper to fetch local file buffer (replace with S3 if needed)
async function getFileBuffer(fileUrl: string) {
  // Assume fileUrl is absolute path under public/uploads
  const filePath = path.join(process.cwd(), "public", fileUrl);
  return await fs.readFile(filePath);
}

export async function GET(_: Request, { params }: { params: { packId: string } }) {
  try {
    const packId = parseInt(params.packId);
    if (isNaN(packId)) {
      return NextResponse.json({ error: "Invalid pack id" }, { status: 400 });
    }

    // Fetch pack with samples
    const pack = await prisma.samplePack.findUnique({
      where: { id: packId },
      include: {
        samples: true,
      },
    });

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    const zip = new AdmZip();

    for (const sample of pack.samples) {
      const formatFolder = (sample.format ?? "WAV").toLowerCase();
      const extension = formatFolder === "midi" ? "mid" : "wav";
      const fileName = `${sample.title.replace(/[^a-z0-9-_]/gi, "_")}.${extension}`;
      try {
        const buf = await getFileBuffer(sample.fileUrl);
        zip.addFile(`${formatFolder}/${fileName}`, buf);
      } catch (err) {
        console.error("File missing:", sample.fileUrl);
      }
    }

    const data = zip.toBuffer();

    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=\"${pack.title.replace(/[^a-z0-9-_]/gi, "_")}.zip\"`,
      },
    });
  } catch (error) {
    console.error("Pack download error", error);
    return NextResponse.json({ error: "Failed to create zip" }, { status: 500 });
  }
} 