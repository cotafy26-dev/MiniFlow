import { pt } from "@/lib/i18n/dictionaries/pt";

interface VideoEmbed {
  provider: "youtube" | "vimeo" | "drive" | "unknown";
  embedSrc: string;
}

function detectVideoEmbed(url: string): VideoEmbed {
  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtube) return { provider: "youtube", embedSrc: `https://www.youtube.com/embed/${youtube[1]}` };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { provider: "vimeo", embedSrc: `https://player.vimeo.com/video/${vimeo[1]}` };

  const drive = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (drive) return { provider: "drive", embedSrc: `https://drive.google.com/file/d/${drive[1]}/preview` };

  return { provider: "unknown", embedSrc: url };
}

/**
 * No hooks — pure URL parsing + an <iframe> — renders fine from a Server
 * Component. video_url is admin-authored, trusted content in this app's
 * existing threat model (same as mini_apps.url for external_app/iframe),
 * never sandboxed.
 */
export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const { provider, embedSrc } = detectVideoEmbed(url);

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black">
        <iframe
          src={embedSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      {provider === "unknown" && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {pt.apps.detail.openExternalButton}
        </a>
      )}
    </div>
  );
}
