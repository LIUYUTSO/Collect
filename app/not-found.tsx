export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--washi)',
        padding: '0 24px',
      }}
    >
      <p
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: 64,
          fontWeight: 300,
          color: 'var(--fog)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        無
      </p>
      <p
        style={{
          marginTop: 16,
          fontSize: 12,
          letterSpacing: '0.2em',
          color: 'var(--ash)',
        }}
      >
        此連結不存在或已過期
      </p>
    </main>
  )
}
