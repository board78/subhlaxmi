import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 – Page Not Found | Subhlaxmi Lottery",
  description:
    "Yeh page nahi mila. Home pe wapas jao aur apni lottery tickets khareedein.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="nf-root">
      {/* Subtle grid overlay */}
      <div className="nf-grid" aria-hidden />

      {/* Glowing orb top */}
      <div className="nf-orb nf-orb-top" aria-hidden />

      {/* Glowing orb bottom */}
      <div className="nf-orb nf-orb-bottom" aria-hidden />

      {/* Card */}
      <div className="nf-card">
        {/* Royal corner accents */}
        <span className="nf-corner nf-corner-tl" aria-hidden />
        <span className="nf-corner nf-corner-tr" aria-hidden />
        <span className="nf-corner nf-corner-bl" aria-hidden />
        <span className="nf-corner nf-corner-br" aria-hidden />

        {/* Lottery ticket icon */}
        <div className="nf-icon-wrap">
          <div className="nf-icon-circle">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <rect
                x="5"
                y="9"
                width="30"
                height="22"
                rx="3"
                stroke="rgba(246,185,82,0.85)"
                strokeWidth="1.8"
              />
              <line
                x1="5"
                y1="16"
                x2="35"
                y2="16"
                stroke="rgba(246,185,82,0.5)"
                strokeWidth="1.4"
                strokeDasharray="3 3"
              />
              <text
                x="20"
                y="27"
                textAnchor="middle"
                fill="rgba(251,146,60,0.95)"
                fontSize="13"
                fontWeight="700"
                fontFamily="monospace"
              >
                ?
              </text>
            </svg>
          </div>
        </div>

        {/* 404 number */}
        <div className="nf-404" aria-label="404">
          404
        </div>

        {/* Divider */}
        <div className="nf-divider" aria-hidden />

        {/* Heading */}
        <h1 className="nf-heading">Yeh Page Nahi Mila! 🎟️</h1>

        {/* Subheading */}
        <p className="nf-body">
          Lagta hai aap galat URL pe aa gaye. Koi baat nahi — home pe wapas
          jao aur apni lucky lottery ticket khareedein!
        </p>

        {/* CTA Button */}
        <Link href="/" id="not-found-home-btn" className="nf-btn">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            <path d="M9 22V12h6v10" />
          </svg>
          Home Pe Wapas Jao
        </Link>

        {/* Footer note */}
        <p className="nf-foot">Subhlaxmi Lottery · Kuber Ka Khajana</p>
      </div>

      {/* Floating ticket particles */}
      <div className="nf-particle nf-p1" aria-hidden />
      <div className="nf-particle nf-p2" aria-hidden />
      <div className="nf-particle nf-p3" aria-hidden />
      <div className="nf-particle nf-p4" aria-hidden />
      <div className="nf-particle nf-p5" aria-hidden />

      <style>{`
        /* ── Root ── */
        .nf-root {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%,  rgba(246,185,82,.10) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(234,88,12,.07)  0%, transparent 55%),
            linear-gradient(180deg, #090114 0%, #12040c 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          font-family: var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif);
        }

        /* ── Grid ── */
        .nf-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(246,185,82,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(246,185,82,.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* ── Orbs ── */
        .nf-orb { position: absolute; border-radius: 50%; pointer-events: none; }
        .nf-orb-top {
          top: -120px; left: 50%; transform: translateX(-50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(251,146,60,.12) 0%, rgba(246,185,82,.06) 40%, transparent 70%);
          animation: nfPulseOrb 6s ease-in-out infinite;
        }
        .nf-orb-bottom {
          bottom: -100px; right: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(234,88,12,.08) 0%, transparent 65%);
        }

        /* ── Card ── */
        .nf-card {
          position: relative;
          z-index: 1;
          max-width: 540px;
          width: 100%;
          background: linear-gradient(135deg, rgba(30,10,20,.92) 0%, rgba(18,4,12,.96) 100%);
          border: 1px solid rgba(246,185,82,.18);
          border-radius: 24px;
          padding: 56px 40px 48px;
          text-align: center;
          box-shadow:
            0 0 0 1px rgba(251,146,60,.08),
            0 32px 80px rgba(0,0,0,.55),
            inset 0 1px 0 rgba(255,255,255,.06);
          animation: nfFadeSlideUp .6s cubic-bezier(.16,1,.3,1) both;
        }
        @media (max-width: 480px) {
          .nf-card { padding: 40px 24px 36px; border-radius: 18px; }
        }

        /* ── Royal corners ── */
        .nf-corner {
          position: absolute;
          width: 20px; height: 20px;
        }
        .nf-corner-tl { top:14px; left:14px;  border-top:  2px solid rgba(246,185,82,.55); border-left:  2px solid rgba(246,185,82,.55); border-radius:4px 0 0 0; }
        .nf-corner-tr { top:14px; right:14px; border-top:  2px solid rgba(246,185,82,.55); border-right: 2px solid rgba(246,185,82,.55); border-radius:0 4px 0 0; }
        .nf-corner-bl { bottom:14px; left:14px;  border-bottom: 2px solid rgba(246,185,82,.55); border-left:  2px solid rgba(246,185,82,.55); border-radius:0 0 0 4px; }
        .nf-corner-br { bottom:14px; right:14px; border-bottom: 2px solid rgba(246,185,82,.55); border-right: 2px solid rgba(246,185,82,.55); border-radius:0 0 4px 0; }

        /* ── Icon ── */
        .nf-icon-wrap  { margin-bottom: 28px; display:flex; justify-content:center; }
        .nf-icon-circle {
          width:80px; height:80px; border-radius:50%;
          background: radial-gradient(circle at 35% 35%, rgba(251,146,60,.22), rgba(246,185,82,.08) 60%);
          border: 1.5px solid rgba(246,185,82,.3);
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 0 32px rgba(246,185,82,.12), inset 0 1px 0 rgba(255,255,255,.08);
          animation: nfFloatIcon 3s ease-in-out infinite;
        }

        /* ── 404 ── */
        .nf-404 {
          font-size: clamp(72px,16vw,112px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -.04em;
          background: linear-gradient(135deg,#fcd34d 0%,#fb923c 40%,#f97316 70%,#fbbf24 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
          animation: nfShimmer 3s ease-in-out infinite;
        }

        /* ── Divider ── */
        .nf-divider {
          margin: 20px auto 24px;
          width: 80px; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(246,185,82,.6), transparent);
          border-radius: 2px;
        }

        /* ── Heading ── */
        .nf-heading {
          font-size: clamp(20px,5vw,26px);
          font-weight: 700;
          color: #f9f9ff;
          margin: 0 0 12px;
          letter-spacing: -.01em;
        }

        /* ── Body ── */
        .nf-body {
          font-size: 15px;
          color: rgba(161,161,170,.85);
          line-height: 1.7;
          max-width: 360px;
          margin: 0 auto 36px;
        }

        /* ── CTA Button ── */
        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .01em;
          color: #fff;
          background: linear-gradient(135deg, #fb923c 0%, #fcd34d 50%, #f97316 100%);
          border: 1px solid rgba(217,119,6,.4);
          box-shadow:
            0 0 24px rgba(251,146,60,.3),
            0 4px 16px rgba(0,0,0,.3),
            inset 0 1px 0 rgba(255,255,255,.2);
          text-decoration: none;
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .nf-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow:
            0 0 40px rgba(251,146,60,.5),
            0 8px 28px rgba(0,0,0,.35),
            inset 0 1px 0 rgba(255,255,255,.25);
        }
        .nf-btn:active {
          transform: translateY(0) scale(0.98);
        }

        /* ── Footer note ── */
        .nf-foot {
          margin-top: 28px;
          font-size: 12px;
          color: rgba(161,161,170,.4);
          letter-spacing: .02em;
        }

        /* ── Floating particles ── */
        .nf-particle {
          position: absolute;
          border-radius: 4px;
          pointer-events: none;
        }
        .nf-p1 { top:12%; left:8%;   width:28px; height:18px; border:1px solid rgba(246,185,82,.28); background:rgba(246,185,82,.18); animation:nfFloat 8s   0s   ease-in-out infinite; }
        .nf-p2 { top:20%; right:7%;  width:22px; height:14px; border:1px solid rgba(246,185,82,.24); background:rgba(246,185,82,.14); animation:nfFloat 7s   1.5s ease-in-out infinite; }
        .nf-p3 { top:70%; left:5%;   width:18px; height:12px; border:1px solid rgba(246,185,82,.22); background:rgba(246,185,82,.12); animation:nfFloat 9s   3s   ease-in-out infinite; }
        .nf-p4 { top:60%; right:9%;  width:24px; height:16px; border:1px solid rgba(246,185,82,.26); background:rgba(246,185,82,.16); animation:nfFloat 6.5s 2s   ease-in-out infinite; }
        .nf-p5 { top:85%; left:18%;  width:16px; height:10px; border:1px solid rgba(246,185,82,.20); background:rgba(246,185,82,.10); animation:nfFloat 8.5s 4s   ease-in-out infinite; }

        /* ── Keyframes ── */
        @keyframes nfFadeSlideUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes nfFloatIcon {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-7px); }
        }
        @keyframes nfFloat {
          0%,100% { transform:translateY(0) rotate(0deg); opacity:1; }
          50%     { transform:translateY(-18px) rotate(12deg); opacity:.6; }
        }
        @keyframes nfPulseOrb {
          0%,100% { opacity:1;   transform:translateX(-50%) scale(1); }
          50%     { opacity:.7;  transform:translateX(-50%) scale(1.08); }
        }
        @keyframes nfShimmer {
          0%,100% { filter:drop-shadow(0 0 24px rgba(251,146,60,.35)); }
          50%     { filter:drop-shadow(0 0 44px rgba(251,146,60,.62)); }
        }
      `}</style>
    </main>
  );
}
