function Bone({ width, height, radius = 8 }: { width: string; height: number; radius?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{
        width,
        height,
        borderRadius: radius,
        background: '#EDE9FE',
        flexShrink: 0,
      }}
    />
  )
}

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Bone width="180px" height={24} radius={6} />
          <Bone width="260px" height={14} radius={4} />
        </div>
        <Bone width="120px" height={40} radius={12} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              border: '1px solid #F0EEFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <Bone width="60%" height={12} radius={4} />
            <Bone width="40%" height={28} radius={6} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #F0EEFF',
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '12px 24px',
            borderBottom: '1px solid #F0EEFF',
            background: '#FAFAFF',
          }}
        >
          <Bone width="20%" height={12} radius={4} />
          <Bone width="25%" height={12} radius={4} />
          <Bone width="15%" height={12} radius={4} />
          <Bone width="15%" height={12} radius={4} />
          <Bone width="10%" height={12} radius={4} />
        </div>

        {/* Table rows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 24px',
              borderBottom: i < 4 ? '1px solid #F0EEFF' : undefined,
            }}
          >
            <Bone width="20%" height={14} radius={4} />
            <Bone width="25%" height={14} radius={4} />
            <Bone width="15%" height={14} radius={4} />
            <Bone width="15%" height={22} radius={20} />
            <Bone width="10%" height={14} radius={4} />
          </div>
        ))}
      </div>
    </div>
  )
}
