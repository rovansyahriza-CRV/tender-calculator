import React, { useMemo } from 'react';
import { searchMarketPriceBenchmark } from '../data/marketPriceBenchmark';
import { ExternalLink, Search, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface Props {
  query: string;
  currentPrice?: number;
  unit?: string;
  onSelectPrice: (price: number) => void;
  compact?: boolean;
}

export const MarketPriceLookupWidget: React.FC<Props> = ({
  query,
  currentPrice = 0,
  unit = 'unit',
  onSelectPrice,
  compact = false
}) => {
  const benchmark = useMemo(() => {
    if (!query || query.trim().length === 0) return null;
    return searchMarketPriceBenchmark(query, currentPrice, unit);
  }, [query, currentPrice, unit]);

  if (!benchmark || !query.trim()) {
    return null;
  }

  const isExactMatch = !!benchmark.matchedItem;

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: compact ? '8px 10px' : '12px 14px',
        marginTop: '6px',
        marginBottom: '6px',
        fontSize: '11px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}
    >
      {/* 1. Header Widget */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={13} style={{ color: isExactMatch ? '#2563eb' : '#d97706' }} />
          <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
            Benchmark Rentang Harga Pasar & Live Vendor
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: '600',
              background: isExactMatch ? '#dbeafe' : '#fef3c7',
              color: isExactMatch ? '#1e40af' : '#92400e'
            }}
          >
            {isExactMatch ? '✓ Terverifikasi Database' : 'Estimasi Pasar'}
          </span>
        </div>

        {/* Live Search Shortcut Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <a
            href={benchmark.googleSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka pencarian harga terbaru di Google"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#2563eb',
              textDecoration: 'none',
              background: '#eff6ff',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid #bfdbfe',
              fontWeight: '600',
              fontSize: '10px'
            }}
          >
            <Search size={11} />
            <span>Cari di Google</span>
            <ExternalLink size={10} />
          </a>

          <a
            href={benchmark.tokopediaSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Cari vendor dan harga supplier di Tokopedia"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              color: '#059669',
              textDecoration: 'none',
              background: '#ecfdf5',
              padding: '3px 7px',
              borderRadius: '4px',
              border: '1px solid #a7f3d0',
              fontWeight: '600',
              fontSize: '10px'
            }}
          >
            <span>Tokopedia</span>
            <ExternalLink size={10} />
          </a>

          <a
            href={benchmark.indotradingSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Cari distributor B2B di Indotrading"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              color: '#7c3aed',
              textDecoration: 'none',
              background: '#f5f3ff',
              padding: '3px 7px',
              borderRadius: '4px',
              border: '1px solid #ddd6fe',
              fontWeight: '600',
              fontSize: '10px'
            }}
          >
            <span>Indotrading</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* 2. Three Clickable Price Range Options: Low, Avg, High */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '6px'
        }}
      >
        {/* HARGA BAWAH (MIN) */}
        <button
          type="button"
          onClick={() => onSelectPrice(benchmark.priceLow)}
          title="Klik untuk memilih Harga Bawah (Distributor / Skala Besar)"
          style={{
            background: currentPrice === benchmark.priceLow ? '#dcfce7' : '#ffffff',
            border: currentPrice === benchmark.priceLow ? '2px solid #16a34a' : '1px solid #bbf7d0',
            borderRadius: '6px',
            padding: '6px 8px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = currentPrice === benchmark.priceLow ? '#dcfce7' : '#ffffff'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>
              🟢 Harga Bawah (Min)
            </span>
            {currentPrice === benchmark.priceLow && <CheckCircle2 size={12} color="#16a34a" />}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', fontFamily: 'monospace', marginTop: '2px' }}>
            Rp {benchmark.priceLow.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '1px' }}>
            per {benchmark.unit}
          </div>
        </button>

        {/* HARGA REKOMENDASI (AVG) */}
        <button
          type="button"
          onClick={() => onSelectPrice(benchmark.priceAvg)}
          title="Klik untuk memilih Rekomendasi Rata-rata Estimator"
          style={{
            background: currentPrice === benchmark.priceAvg ? '#dbeafe' : '#ffffff',
            border: currentPrice === benchmark.priceAvg ? '2px solid #2563eb' : '1px solid #bfdbfe',
            borderRadius: '6px',
            padding: '6px 8px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = currentPrice === benchmark.priceAvg ? '#dbeafe' : '#ffffff'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase' }}>
              🔵 Rekomendasi (Avg)
            </span>
            {currentPrice === benchmark.priceAvg && <CheckCircle2 size={12} color="#2563eb" />}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#1d4ed8', fontFamily: 'monospace', marginTop: '2px' }}>
            Rp {benchmark.priceAvg.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '1px' }}>
            per {benchmark.unit}
          </div>
        </button>

        {/* HARGA ATAS (MAX) */}
        <button
          type="button"
          onClick={() => onSelectPrice(benchmark.priceHigh)}
          title="Klik untuk memilih Harga Atas (Toko Eceran / Urgent Spot Price)"
          style={{
            background: currentPrice === benchmark.priceHigh ? '#fee2e2' : '#ffffff',
            border: currentPrice === benchmark.priceHigh ? '2px solid #dc2626' : '1px solid #fecaca',
            borderRadius: '6px',
            padding: '6px 8px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = currentPrice === benchmark.priceHigh ? '#fee2e2' : '#ffffff'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase' }}>
              🔴 Harga Atas (Max)
            </span>
            {currentPrice === benchmark.priceHigh && <CheckCircle2 size={12} color="#dc2626" />}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#b91c1c', fontFamily: 'monospace', marginTop: '2px' }}>
            Rp {benchmark.priceHigh.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '1px' }}>
            per {benchmark.unit}
          </div>
        </button>
      </div>

      {/* 3. Footer Catatan Sumber */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px' }}>
        <Info size={11} style={{ flexShrink: 0 }} />
        <span>
          <strong>Petunjuk:</strong> Klik salah satu opsi harga di atas, atau masukkan nilai custom bebas diantaranya pada kolom harga.
        </span>
        {benchmark.sourceNote && (
          <span style={{ marginLeft: 'auto', fontStyle: 'italic', color: '#475569' }}>
            Sumber: {benchmark.sourceNote}
          </span>
        )}
      </div>
    </div>
  );
};

