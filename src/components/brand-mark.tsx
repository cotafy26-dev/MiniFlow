import Image from "next/image";

/** The MiniFlow icon mark (no wordmark — pair with text where a name is needed). */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/miniflow-icon.png"
      alt="MiniFlow"
      width={512}
      height={512}
      priority
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
