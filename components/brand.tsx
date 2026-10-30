import Image from "next/image";
import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold text-forest">
      <Image src="/mark.webp" alt="" width={26} height={26} unoptimized />
      Mac Tidar Forms
    </Link>
  );
}
