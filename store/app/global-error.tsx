"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something Went Wrong — TRYBY Sports</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#0D0D0D;color:#fff;font-family:system-ui,sans-serif;
               min-height:100vh;display:flex;align-items:center;justify-content:center;
               text-align:center;padding:24px}
          .logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:32px}
          .shield path:first-child{fill:#F5C518}
          h1{font-family:'Barlow Condensed',sans-serif;font-size:clamp(24px,5vw,36px);
             font-weight:900;letter-spacing:-0.01em;margin-bottom:12px}
          p{color:rgba(255,255,255,0.5);font-size:14px;max-width:300px;line-height:1.6;
            margin:0 auto 28px}
          .btns{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
          button,a{height:48px;padding:0 28px;border-radius:999px;font-weight:700;
                   font-size:14px;font-family:'Barlow Condensed',sans-serif;
                   letter-spacing:0.05em;cursor:pointer;border:none;
                   display:inline-flex;align-items:center;transition:opacity .15s}
          button{background:#F5C518;color:#0D0D0D}
          button:hover{opacity:.85}
          a{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.2);
            text-decoration:none}
          a:hover{border-color:rgba(255,255,255,.5)}
        `}</style>
      </head>
      <body>
        <div>
          <div className="logo">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" className="shield">
              <path d="M16 2L4 7v9c0 7 5.4 13.1 12 14.9C22.6 29.1 28 23 28 16V7L16 2z" />
              <path d="M13 16.5l2.5 2.5 5-5" stroke="#0D0D0D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "18px", letterSpacing: "0.1em", color: "#fff" }}>
              TRYBY SPORTS
            </span>
          </div>
          <h1>Something Went Offside</h1>
          <p>A critical error occurred. Our team has been notified.</p>
          <div className="btns">
            <button onClick={reset}>Try Again</button>
            <a href="/">Go Home</a>
          </div>
        </div>
      </body>
    </html>
  );
}
