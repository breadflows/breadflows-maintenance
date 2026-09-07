export type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  seekTo: (time: number, allowSeekAhead: boolean) => void;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
};
type PlayerEvent = { target: YouTubePlayer; data: number };
export type YouTubeAPI = {
  Player: new (
    element: HTMLElement,
    options: {
      host: string;
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (event: PlayerEvent) => void;
        onStateChange: (event: PlayerEvent) => void;
        onError: () => void;
      };
    },
  ) => YouTubePlayer;
};
type YouTubeWindow = Window & {
  YT?: YouTubeAPI;
  onYouTubeIframeAPIReady?: () => void;
};
let pending: Promise<YouTubeAPI> | undefined;
export function loadYouTube(): Promise<YouTubeAPI> {
  const win = window as YouTubeWindow;
  if (win.YT?.Player) return Promise.resolve(win.YT);
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const prior = win.onYouTubeIframeAPIReady;
    const timer = setTimeout(() => {
      pending = undefined;
      reject(new Error("Video player unavailable"));
    }, 15000);
    win.onYouTubeIframeAPIReady = () => {
      prior?.();
      clearTimeout(timer);
      if (win.YT) resolve(win.YT);
    };
    let script = document.querySelector<HTMLScriptElement>("script[data-breadflows-youtube]");
    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.dataset.breadflowsYoutube = "true";
      script.async = true;
      document.head.appendChild(script);
    }
    script.onerror = () => {
      clearTimeout(timer);
      script?.remove();
      pending = undefined;
      reject(new Error("Video player unavailable"));
    };
  });
  return pending;
}
