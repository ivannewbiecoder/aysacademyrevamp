import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * The prototype hot-linked https://aysacademy.id/hero-ays.jpg. After the domain
 * moves to this app that URL would 404, so the photo must live in
 * public/images/hero-ays.jpg. Until it is added we render a styled placeholder
 * instead of a broken image.
 */
const HERO_PATH = "/images/hero-ays.jpg";
const heroExists = existsSync(path.join(process.cwd(), "public", HERO_PATH));

export function HeroImage({
  alt,
  className,
  priority = false,
  sizes,
}: {
  alt: string;
  className?: string;
  priority?: boolean;
  sizes: string;
}) {
  if (!heroExists) {
    return (
      <div className={`${className ?? ""} hero-photo--placeholder`} role="img" aria-label={alt}>
        Belajar konsep, lalu berlatih menggunakannya.
      </div>
    );
  }
  return <Image className={className} src={HERO_PATH} alt={alt} width={720} height={900} sizes={sizes} priority={priority} />;
}
