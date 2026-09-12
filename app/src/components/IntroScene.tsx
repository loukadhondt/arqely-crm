import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useT } from '../lib/i18n'

// Original opening animation from https://neomove.ai/.
const VIDEO = 'https://framerusercontent.com/assets/njU7dKvHk1dQSfwrb9rtn0GzSvM.mp4'
const POSTER = 'https://framerusercontent.com/images/ctCMfaJ7W97DwXhjHokcBuxuf4.png?width=1416&height=896'

export default function IntroScene() {
  const { locale } = useT()
  const video = useRef<HTMLVideoElement>(null)
  const [motion, setMotion] = useState(false)
  const [paused, setPaused] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMotion(!media.matches)
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const sync = () => {
      if (!video.current) return
      if (paused || document.hidden) video.current.pause()
      else video.current.play().catch(() => setPaused(true))
    }
    sync(); document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [motion, paused])
  return <>
    <div className="intro-scene" aria-hidden="true">
      <img src={POSTER} alt="" className="intro-media" />
      {motion && !failed && <video ref={video} className="intro-media" src={VIDEO} poster={POSTER} muted playsInline loop preload="metadata" onError={() => setFailed(true)} />}
      <div className="intro-shade" />
    </div>
    {motion && !failed && <button type="button" className="intro-toggle" onClick={() => setPaused(p => !p)} aria-label={locale === 'fr' ? (paused ? 'Reprendre l’animation' : 'Mettre l’animation en pause') : (paused ? 'Play animation' : 'Pause animation')} aria-pressed={paused}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
  </>
}
