import React from "react";
import { VideoResource, WebResource } from "../../types";
import { Play, ExternalLink, BookOpen, Clock, Youtube } from "lucide-react";
import { isSafeUrl } from "../../lib/utils";

interface VideoCardProps {
  video: VideoResource;
}

export const VideoResourceCard: React.FC<VideoCardProps> = ({ video }) => {
  const safe = isSafeUrl(video.url);

  return (
    <a
      href={safe ? video.url : "#"}
      target={safe ? "_blank" : undefined}
      rel={safe ? "noopener noreferrer" : undefined}
      className="p-3 rounded-xl border border-border bg-white dark:bg-space-900 hover:border-red-400/60 dark:hover:border-red-600/60 transition-all flex items-start space-x-3 group shadow-sm hover:shadow"
    >
      <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        <Youtube className="w-5 h-5" />
      </div>

      <div className="space-y-1 min-w-0 flex-1">
        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
          {video.title}
        </h4>
        <div className="flex items-center space-x-2 text-[11px] text-muted-foreground">
          <span>{video.channel}</span>
          {video.duration && (
            <>
              <span>•</span>
              <span className="flex items-center space-x-0.5">
                <Clock className="w-3 h-3" />
                <span>{video.duration}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-neutral-900 dark:group-hover:text-white transition-colors shrink-0 mt-0.5" />
    </a>
  );
};

interface WebCardProps {
  resource: WebResource;
}

export const WebResourceCard: React.FC<WebCardProps> = ({ resource }) => {
  const safe = isSafeUrl(resource.url);

  return (
    <a
      href={safe ? resource.url : "#"}
      target={safe ? "_blank" : undefined}
      rel={safe ? "noopener noreferrer" : undefined}
      className="p-3 rounded-xl border border-border bg-white dark:bg-space-900 hover:border-indigo-400/60 dark:hover:border-indigo-600/60 transition-all flex items-start space-x-3 group shadow-sm hover:shadow"
    >
      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        <BookOpen className="w-4 h-4" />
      </div>

      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center space-x-1.5">
          <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {resource.title}
          </h4>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            {resource.type}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {resource.description}
        </p>
        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono block">
          {resource.domain}
        </span>
      </div>

      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-neutral-900 dark:group-hover:text-white transition-colors shrink-0 mt-0.5" />
    </a>
  );
};
