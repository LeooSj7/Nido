'use client'

import { useRouter } from 'next/navigation'

interface PageHeaderProps {
  sectionNum: string
  sectionLabel: string
  right?: string
  title: string
  sub?: string
  backHref?: string
}

export default function PageHeader({ sectionNum, sectionLabel, right, title, sub }: PageHeaderProps) {
  return (
    <div style={{ borderBottom: '2px solid var(--color-ink)', background: 'var(--color-bg)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '12px 18px 4px',
        fontFamily: 'var(--font-plex-mono)', fontSize: 10,
        color: 'var(--color-ink-2)', letterSpacing: '0.04em',
      }}>
        <span>§ {sectionNum} · {sectionLabel.toUpperCase()}</span>
        {right && <span>{right}</span>}
      </div>
      <div style={{ padding: '0 18px 14px' }}>
        <h1 style={{
          fontFamily: 'var(--font-plex-serif)',
          fontWeight: 500, fontStyle: 'italic',
          fontSize: 32, lineHeight: 1.05,
          letterSpacing: '-0.015em',
          margin: 0, color: 'var(--color-ink)',
        }}>
          {title}
        </h1>
        {sub && (
          <p style={{
            fontSize: 12, color: 'var(--color-ink-2)',
            margin: '4px 0 0',
            fontFamily: 'var(--font-plex-mono)',
          }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
