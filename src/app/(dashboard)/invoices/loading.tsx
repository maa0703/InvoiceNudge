function Bone({ w, h, r = 6 }: { w: number | string; h: number; r?: number }) {
  return (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: '#EDE9FE', flexShrink: 0 }} />
  )
}

export default function InvoicesLoading() {
  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Bone w="100px" h={22} />
          <Bone w="140px" h={13} r={4} />
        </div>
        <Bone w={120} h={40} r={12} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #F0EEFF' }}>
        {[60, 55, 45, 65, 70].map((w, i) => (
          <Bone key={i} w={w} h={14} r={4} />
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #F0EEFF', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, padding: '12px 20px', borderBottom: '1px solid #F0EEFF', background: '#FAFAFF' }}>
          {[160, 90, 90, 70, 100].map((w, i) => <Bone key={i} w={w} h={11} r={4} />)}
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < 4 ? '1px solid #F0EEFF' : undefined }}>
            <Bone w={160} h={14} r={4} />
            <Bone w={90} h={14} r={4} />
            <Bone w={90} h={14} r={4} />
            <Bone w={70} h={22} r={20} />
            <Bone w={100} h={14} r={4} />
          </div>
        ))}
      </div>
    </div>
  )
}
