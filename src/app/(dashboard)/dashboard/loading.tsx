function Bone({ w, h, r = 6 }: { w: string; h: number; r?: number }) {
  return (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: '#EDE9FE', flexShrink: 0 }} />
  )
}

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone w="160px" h={24} />
        <Bone w="240px" h={14} r={4} />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 16, marginBottom: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: '#FFF', borderRadius: 14, padding: '18px 20px', border: '1px solid #F0EEFF' }}>
            <Bone w="55%" h={11} r={4} />
            <div style={{ marginTop: 10 }}><Bone w="45%" h={26} /></div>
          </div>
        ))}
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
        {[0, 1].map((col) => (
          <div key={col} style={{ background: '#FFF', borderRadius: 16, border: '1px solid #F0EEFF', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EEFF', display: 'flex', justifyContent: 'space-between' }}>
              <Bone w="120px" h={14} />
              <Bone w="60px" h={14} r={4} />
            </div>
            <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Bone w="40%" h={13} r={4} />
                  <Bone w="30%" h={13} r={4} />
                  <Bone w="18%" h={20} r={20} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
