import Image from "next/image";

/** The MedFlow System icon mark (no wordmark — pair with text where a name is needed). */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/medflow-icon.png"
      alt="MedFlow System"
      width={512}
      height={512}
      priority
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
