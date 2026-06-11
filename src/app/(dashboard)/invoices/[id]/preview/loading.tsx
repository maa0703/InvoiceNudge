function Bone({ w, h, r = 6 }: { w: number | string; h: number; r?: number }) {
  return (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: '#EDE9FE', flexShrink: 0 }} />
  )
}

export default function PreviewLoading() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone w={220} h={26} r={6} />
        <Bone w={300} h={14} r={4} />
      </div>

      {/* Email preview card */}
      <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #F0EEFF', overflow: 'hidden' }}>
        {/* Email header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EEFF', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Bone w={32} h={32} r={20} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Bone w={160} h={13} r={4} />
              <Bone w={200} h={11} r={4} />
            </div>
          </div>
          <Bone w={260} h={14} r={4} />
        </div>
        {/* Email body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Bone w="90%" h={13} r={4} />
          <Bone w="100%" h={13} r={4} />
          <Bone w="75%" h={13} r={4} />
          <div style={{ marginTop: 8 }}>
            <Bone w="40%" h={13} r={4} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Bone w={160} h={40} r={12} />
        <Bone w={110} h={40} r={12} />
        <Bone w={60} h={40} r={12} />
      </div>
    </div>
  )
}
