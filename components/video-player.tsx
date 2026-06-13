"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type Hls from "hls.js"
import {
  AlertIcon,
  ExitFullscreenIcon,
  FullscreenIcon,
  LoaderIcon,
  MuteIcon,
  PauseIcon,
  PlayIcon,
  SettingsIcon,
  VolumeIcon,
} from "./icons"

interface QualityLevel {
  index: number
  label: string
}

type StreamKind = "hls" | "dash" | "native"

function detectKind(url: string): StreamKind {
  const clean = url.split("?")[0].toLowerCase()
  if (clean.endsWith(".m3u8")) return "hls"
  if (clean.endsWith(".mpd")) return "dash"
  return "native"
}

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

export function VideoPlayer({ url, poster, title }: { url: string; poster?: string; title?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dashRef = useRef<any>(null)
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLive, setIsLive] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [qualities, setQualities] = useState<QualityLevel[]>([])
  const [currentQuality, setCurrentQuality] = useState(-1)
  const [showQualityMenu, setShowQualityMenu] = useState(false)

  // Set up the stream source
  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setQualities([])
    setCurrentQuality(-1)

    const kind = detectKind(url)

    async function setup() {
      try {
        if (kind === "hls") {
          const HlsModule = (await import("hls.js")).default
          if (cancelled) return
          if (HlsModule.isSupported()) {
            const hls = new HlsModule({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
            })
            hlsRef.current = hls
            hls.loadSource(url)
            hls.attachMedia(video!)
            hls.on(HlsModule.Events.MANIFEST_PARSED, (_e, data) => {
              if (cancelled) return
              const levels: QualityLevel[] = data.levels.map((l, i) => ({
                index: i,
                label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}kbps`,
              }))
              setQualities(levels)
              setLoading(false)
              video!.play().catch(() => {})
            })
            hls.on(HlsModule.Events.LEVEL_SWITCHED, (_e, data) => {
              if (!cancelled) setCurrentQuality(data.level)
            })
            hls.on(HlsModule.Events.ERROR, (_e, data) => {
              if (cancelled) return
              if (data.fatal) {
                switch (data.type) {
                  case HlsModule.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad()
                    break
                  case HlsModule.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError()
                    break
                  default:
                    setError("This stream could not be played. It may be offline or geo-restricted.")
                    setLoading(false)
                    break
                }
              }
            })
          } else if (video!.canPlayType("application/vnd.apple.mpegurl")) {
            // Native HLS (Safari)
            video!.src = url
            setLoading(false)
          } else {
            setError("HLS is not supported in this browser.")
            setLoading(false)
          }
        } else if (kind === "dash") {
          const dashjs = await import("dashjs")
          if (cancelled) return
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const player = (dashjs as any).MediaPlayer().create()
          dashRef.current = player
          player.initialize(video, url, true)
          player.on("streamInitialized", () => {
            if (cancelled) return
            try {
              const bitrates = player.getBitrateInfoListFor("video") || []
              const levels: QualityLevel[] = bitrates.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (b: any) => ({
                  index: b.qualityIndex,
                  label: b.height ? `${b.height}p` : `${Math.round(b.bitrate / 1000)}kbps`,
                }),
              )
              setQualities(levels)
            } catch {
              /* ignore */
            }
            setLoading(false)
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          player.on("error", () => {
            if (!cancelled) {
              setError("This DASH stream could not be played.")
              setLoading(false)
            }
          })
        } else {
          video!.src = url
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError("Failed to initialize the player.")
          setLoading(false)
        }
      }
    }

    setup()

    return () => {
      cancelled = true
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (dashRef.current) {
        try {
          dashRef.current.reset()
        } catch {
          /* ignore */
        }
        dashRef.current = null
      }
      video.removeAttribute("src")
      video.load()
    }
  }, [url])

  // Video element event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setCurrentTime(video.currentTime)
    const onDuration = () => {
      setDuration(video.duration)
      setIsLive(!isFinite(video.duration))
    }
    const onVolume = () => {
      setVolume(video.volume)
      setMuted(video.muted)
    }
    const onWaiting = () => setLoading(true)
    const onPlaying = () => setLoading(false)
    const onError = () => {
      if (!hlsRef.current && !dashRef.current) {
        setError("This stream could not be played. The link may be broken or unsupported.")
        setLoading(false)
      }
    }

    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("timeupdate", onTime)
    video.addEventListener("durationchange", onDuration)
    video.addEventListener("volumechange", onVolume)
    video.addEventListener("waiting", onWaiting)
    video.addEventListener("playing", onPlaying)
    video.addEventListener("error", onError)

    return () => {
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("timeupdate", onTime)
      video.removeEventListener("durationchange", onDuration)
      video.removeEventListener("volumechange", onVolume)
      video.removeEventListener("waiting", onWaiting)
      video.removeEventListener("playing", onPlaying)
      video.removeEventListener("error", onError)
    }
  }, [])

  // Fullscreen state sync
  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
  }, [])

  const onVolumeChange = useCallback((v: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = v
    video.muted = v === 0
  }, [])

  const onSeek = useCallback((t: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = t
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      el.requestFullscreen().catch(() => {})
    }
  }, [])

  const selectQuality = useCallback((index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index
    } else if (dashRef.current) {
      if (index === -1) {
        dashRef.current.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } })
      } else {
        dashRef.current.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } })
        dashRef.current.setQualityFor("video", index)
      }
    }
    setCurrentQuality(index)
    setShowQualityMenu(false)
  }, [])

  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    hideControlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false)
    }, 3000)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "f":
          toggleFullscreen()
          break
        case "m":
          toggleMute()
          break
        case "ArrowRight":
          if (videoRef.current && !isLive) videoRef.current.currentTime += 10
          break
        case "ArrowLeft":
          if (videoRef.current && !isLive) videoRef.current.currentTime -= 10
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [togglePlay, toggleFullscreen, toggleMute, isLive])

  return (
    <div
      ref={containerRef}
      onMouseMove={showControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        onClick={togglePlay}
        className="h-full w-full bg-black"
      />

      {/* Loading overlay */}
      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
          <AlertIcon className="h-12 w-12 text-red-400" />
          <p className="max-w-md text-pretty text-sm text-white/90">{error}</p>
        </div>
      )}

      {/* Center play button when paused */}
      {!playing && !loading && !error && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/30"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105">
            <PlayIcon className="h-8 w-8 translate-x-1" />
          </span>
        </button>
      )}

      {/* Controls */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-3 pt-12 transition-opacity duration-300 ${
          controlsVisible || !playing ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Seek bar */}
        {!isLive && (
          <div className="mb-2 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="any"
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Seek"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-primary"
              style={{
                background: `linear-gradient(to right, var(--primary) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.25) ${(currentTime / (duration || 1)) * 100}%)`,
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="shrink-0 hover:text-primary">
            {playing ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="hover:text-primary">
              {muted || volume === 0 ? <MuteIcon className="h-5 w-5" /> : <VolumeIcon className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
              className="hidden h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/25 accent-primary sm:block"
            />
          </div>

          {/* Time */}
          <div className="text-xs tabular-nums text-white/90">
            {isLive ? (
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                LIVE
              </span>
            ) : (
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Quality selector */}
            {qualities.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu((v) => !v)}
                  aria-label="Quality settings"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span className="hidden text-xs font-medium sm:inline">
                    {currentQuality === -1 ? "Auto" : qualities.find((q) => q.index === currentQuality)?.label}
                  </span>
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-9 right-0 min-w-32 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl">
                    <QualityOption label="Auto" active={currentQuality === -1} onClick={() => selectQuality(-1)} />
                    {qualities
                      .slice()
                      .reverse()
                      .map((q) => (
                        <QualityOption
                          key={q.index}
                          label={q.label}
                          active={currentQuality === q.index}
                          onClick={() => selectQuality(q.index)}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={toggleFullscreen} aria-label="Fullscreen" className="hover:text-primary">
              {fullscreen ? <ExitFullscreenIcon className="h-5 w-5" /> : <FullscreenIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function QualityOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-xs transition-colors hover:bg-secondary ${
        active ? "font-semibold text-primary" : "text-popover-foreground"
      }`}
    >
      {label}
    </button>
  )
}
