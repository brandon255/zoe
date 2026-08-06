// Pizarro-only media bay — adult reference stills + clip for red-team review.
// Never mounts in Clinical world.

interface PizarroMediaBayProps {
  visible: boolean;
}

export function PizarroMediaBay({ visible }: PizarroMediaBayProps) {
  if (!visible) return null;

  return (
    <aside className="pizarro-media-bay" aria-label="Pizarro reference media">
      <div className="pizarro-media-header">
        <span className="pizarro-media-title">Pizarro media</span>
        <span className="pizarro-media-rails">Adult · no minors · no violence</span>
      </div>

      <div className="pizarro-media-block">
        <div className="pizarro-media-label">Zoe head on uploaded body (5s)</div>
        <video
          className="pizarro-media-video"
          src="/pizarro/zoe-on-charlie14.mp4"
          controls
          playsInline
          loop
          muted
          autoPlay
          preload="metadata"
        />
      </div>

      <div className="pizarro-media-block">
        <div className="pizarro-media-label">Side-by-side (Zoe | original drive)</div>
        <video
          className="pizarro-media-video"
          src="/pizarro/zoe-on-charlie14-concat.mp4"
          controls
          playsInline
          loop
          muted
          preload="metadata"
        />
      </div>

      <div className="pizarro-media-block">
        <div className="pizarro-media-label">Zoe face sample (LivePortrait)</div>
        <video
          className="pizarro-media-video"
          src="/pizarro/zoe-face-sample.mp4"
          controls
          playsInline
          loop
          muted
          autoPlay
          preload="metadata"
        />
      </div>

      <div className="pizarro-media-block">
        <div className="pizarro-media-label">Side-by-side (Zoe | driving)</div>
        <video
          className="pizarro-media-video"
          src="/pizarro/zoe-face-sample-concat.mp4"
          controls
          playsInline
          loop
          muted
          preload="metadata"
        />
      </div>

      <div className="pizarro-media-block">
        <div className="pizarro-media-label">Prop still — black toy</div>
        <img
          className="pizarro-media-image"
          src="/pizarro/zoe-dildo.png"
          alt="Zoe holding large black toy — Pizarro reference"
        />
      </div>

      <div className="pizarro-media-block">
        <div className="pizarro-media-label">Reference clip (8s trim)</div>
        <video
          className="pizarro-media-video"
          src="/pizarro/zoe-ref-clip.mp4"
          controls
          playsInline
          loop
          muted
          preload="metadata"
        />
      </div>
    </aside>
  );
}
