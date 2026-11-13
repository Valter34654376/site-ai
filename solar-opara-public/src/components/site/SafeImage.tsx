import { useState, type ImgHTMLAttributes } from "react";
import { BRAND_FALLBACK, media, mediaSrcSet, type MediaItem } from "@/lib/site-content";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height"> & {
  item: MediaItem;
  fallback?: MediaItem;
  full?: boolean;
};

export function SafeImage({ item, fallback = media.fallback, full = false, alt = item.alt, className = "", style, onLoad, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      {...props}
      src={full ? item.fullSrc : item.src}
      srcSet={full ? undefined : mediaSrcSet(item)}
      width={item.width}
      height={item.height}
      alt={alt}
      decoding="async"
      className={`safe-image ${loaded ? "is-loaded" : ""} ${className}`}
      style={{ objectPosition: item.objectPosition, ...style }}
      onLoad={(event) => { setLoaded(true); onLoad?.(event); }}
      onError={(event) => {
        const image = event.currentTarget;
        const stage = Number(image.dataset.fallbackStage ?? 0);
        image.dataset.fallbackStage = String(stage + 1);
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        if (stage === 0 && item.id !== fallback.id) {
          image.src = fallback.src;
          if (alt) image.alt = fallback.alt;
        } else if (stage < 2) {
          image.src = BRAND_FALLBACK;
          if (alt) image.alt = "Monograma do Solar Opará";
        } else {
          image.style.visibility = "hidden";
        }
      }}
    />
  );
}
