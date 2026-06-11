function Bone({ w, h, r = 6 }: { w: number | string; h: number; r?: number }) {
  return (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: '#EDE9FE', flexShrink: 0 }} />
  )
}

export default function InvoiceDetailLoading() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Back link */}
      <Bone w={90} h={14} r={4} />

      {/* Invoice card */}
      <div style={{ background: '#FFF', borderRadius: 16, padding: 24, border: '1px solid #F0EEFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Bone w={140} h={16} r={4} />
            <Bone w={120} h={34} r={6} />
            <Bone w={200} h={13} r={4} />
          </div>
          <Bone w={64} h={24} r={20} />
        </div>
        <div style={{ borderTop: '1px solid #F0EEFF', paddingTop: 20, display: 'flex', gap: 12 }}>
          <Bone w={110} h={38} r={12} />
          <Bone w={110} h={38} r={12} />
        </div>
      </div>

      {/* Timeline heading */}
      <Bone w={130} h={12} r={4} />

      {/* Timeline rows */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', paddingLeft: 4 }}>
          <Bone w={12} h={12} r={20} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone w="60%" h={13} r={4} />
            <Bone w="40%" h={11} r={4} />
          </div>
          <Bone w={64} h={22} r={20} />
        </div>
      ))}
    </div>
  )
}
