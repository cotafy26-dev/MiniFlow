import type { Metadata } from "next";
import QRCode from "qrcode";

import { BrandMark } from "@/components/brand-mark";
import { verifyCertificate } from "@/core/gamification/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.certificate.title };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const certificate = await verifyCertificate(code);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const qrSvg = await QRCode.toString(`${siteUrl}/certificate/${code}`, { type: "svg", width: 160 });

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex items-center gap-2">
        <BrandMark size={32} />
        <span className="text-lg font-semibold tracking-tight">{pt.app.name}</span>
      </div>

      {certificate ? (
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-8 text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {pt.certificate.verifiedBadge}
          </span>
          <div>
            <p className="text-xs text-muted-foreground">{pt.certificate.studentLabel}</p>
            <p className="text-lg font-semibold">{certificate.studentName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{pt.certificate.courseLabel}</p>
            <p className="font-medium">{certificate.productName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{pt.certificate.issuedAtLabel}</p>
            <p className="text-sm">{formatDate(certificate.issuedAt)}</p>
          </div>
          <p className="text-sm text-muted-foreground">{certificate.tenantName}</p>

          {/* Server-generated SVG from the `qrcode` library — no user input reaches this markup. */}
          <div className="mt-2" dangerouslySetInnerHTML={{ __html: qrSvg }} />

          <p className="text-xs text-muted-foreground">
            {pt.certificate.numberLabel}: <span className="font-mono">{code}</span>
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
          <p className="font-medium">{pt.certificate.notFoundTitle}</p>
          <p className="text-sm text-muted-foreground">{pt.certificate.notFoundBody}</p>
        </div>
      )}
    </main>
  );
}
