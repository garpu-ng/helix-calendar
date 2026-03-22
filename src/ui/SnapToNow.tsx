import { useStore } from '../store/useStore'

export function SnapToNow() {
  const isFollowingNow = useStore((s) => s.isFollowingNow)
  const snapToNow = useStore((s) => s.snapToNow)

  return (
    <button
      className={`snap-to-now ${isFollowingNow ? 'hidden' : ''}`}
      onClick={snapToNow}
    >
      ● Now
    </button>
  )
}
