// Renders the studio's actual logo file — never recreate the wordmark with CSS/fonts.
// The source PNG is pure black ink on transparent alpha, so `dark:invert` is enough
// to flip it to white for dark mode with no separate asset needed.

const WIDTHS = { xs: 96, sm: 132, md: 168, lg: 240 }

export default function Logo({ size = 'md', showTagline = true, className = '' }) {
  const width = WIDTHS[size] || WIDTHS.md

  return (
    <div className={`select-none ${className}`}>
      <img
        src="/brand/september-logo.png"
        alt="September Studio"
        width={width}
        height={width / 5.96}
        className="dark:invert"
        style={{ width, height: 'auto', display: 'block' }}
        draggable={false}
      />
      {showTagline && (
        <div
          className="mt-1.5 text-[10px] tracking-[0.3em] font-semibold uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Nội bộ · Sale &amp; Marketing
        </div>
      )}
    </div>
  )
}
