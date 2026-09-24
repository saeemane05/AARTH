import { Link } from 'react-router-dom';

export default function MarketIntelligenceFooter() {
  return (
    <footer
      style={{ background: 'linear-gradient(180deg,#FFF9EE 0%,#FFF4DE 100%)' }}
      className="text-[#4A6655] px-6 md:px-14 pt-14 pb-8"
    >
      <div
        className="h-[2px] -mt-14 mb-14 mx-[-24px] md:mx-[-56px]"
        style={{ background: 'linear-gradient(90deg,transparent,#1A4D2E 30%,#5BB37F 70%,transparent)' }}
      />
      <div className="max-w-6xl mx-auto">
        <div
          className="grid md:grid-cols-[1.3fr,1fr,1fr,1fr] gap-10 pb-10 border-b"
          style={{ borderColor: 'rgba(26,77,46,0.12)' }}
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/leaf.png" alt="AARTH" width={42} height={42} style={{ objectFit: 'contain', display: 'block' }} />
              <div>
                <div className="font-display font-black text-[22px] leading-none" style={{ color: '#0D1A0F', letterSpacing: '-0.03em' }}>AARTH</div>
                <div className="font-marathi text-[12px] mt-1" style={{ color: '#1A4D2E' }}>Agricultural Resource Trade Hub</div>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed max-w-[280px] font-semibold" style={{ color: '#5A6F60' }}>
              Market intelligence and decision support for Maharashtra farmers.
            </p>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(13,26,15,0.45)' }}>AARTH</div>
            <ul className="space-y-3">
              <li><Link to="/farmer" className="text-[13px] no-underline font-medium" style={{ color: '#4A6655' }}>Farmer Dashboard</Link></li>
              <li><Link to="/farmer/lots" className="text-[13px] no-underline font-medium" style={{ color: '#4A6655' }}>My Lots</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(13,26,15,0.45)' }}>Market</div>
            <ul className="space-y-3">
              <li><Link to="/farmer/market-insights" className="text-[13px] no-underline font-medium" style={{ color: '#4A6655' }}>Market Insights</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(13,26,15,0.45)' }}>Help</div>
            <ul className="space-y-3">
              <li><Link to="/farmer" className="text-[13px] no-underline font-medium" style={{ color: '#4A6655' }}>Back to Dashboard</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
