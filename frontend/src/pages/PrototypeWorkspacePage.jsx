import { useEffect, useMemo, useState } from "react";

import {
  demoApplications,
  demoBuyers,
  demoFarmers,
  demoFpos,
  demoLogisticsOrders,
  demoLots,
  demoMandiPrices,
  demoRecovery,
  demoRequirements,
  demoResidues,
  demoStorageFacilities,
  demoStorageRequests,
  demoTransactions,
  qualityBreakdown,
  tracking,
} from "../data/prototypeData";


const tabsByRole = {
  FARMER: [
    "Overview",
    "Profit & Loss",
    "Mandi Prices",
    "Lots",
    "Accepted Lots",
    "Operations",
    "Rejected Recovery",
    "Transactions",
    "Residue",
  ],

  BUYER: [
    "Overview",
    "Search Produce",
    "Requirements",
    "Top Matches",
    "Lots",
    "Orders",
    "Supplier Network",
    "Transactions",
    "Recovered Lots",
    "Operations",
    "Market Insights",
    "Support",
  ],

  FPO: [
    "Overview",
    "Farmers",
    "Applications",
    "Lots",
    "Mandi Prices",
  ],

  STORAGE_PARTNER: [
    "Overview",
    "My Facilities",
    "Storage Requests",
    "Capacity",
    "Bookings",
    "Operations",
    "Support",
  ],

  LOGISTICS_PARTNER: [
    "Overview",
    "Orders",
    "Accepted Orders",
    "Tracking",
  ],
};


function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}


function StatusBadge({ value }) {
  const label = String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span
      className={`prototype-status status-${String(value || "").toLowerCase()}`}
    >
      {label}
    </span>
  );
}


function StatCard({ label, value, detail }) {
  return (
    <div className="prototype-stat-card">
      <div className="prototype-stat-label">{label}</div>
      <div className="prototype-stat-value">{value}</div>

      {detail && (
        <div className="prototype-stat-detail">
          {detail}
        </div>
      )}
    </div>
  );
}


function SectionHeader({ title, subtitle }) {
  return (
    <div className="prototype-section-header">
      <div>
        <h2>{title}</h2>

        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}


function LiveStamp({ minutes = 2 }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const simulated = Math.max(1, Math.floor((now - (Date.now() - minutes * 60000)) / 60000));
  return <span className="live-stamp"><i />Updated {simulated} min ago</span>;
}

const cropImages = {
  Onion: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=80",
  Grapes: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=900&q=80",
  Tomato: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80",
  Wheat: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80",
  Soybean: "https://images.unsplash.com/photo-1604908554261-8d0a7e3b9a10?auto=format&fit=crop&w=900&q=80",
};

const cropImage = (crop) => cropImages[crop] || cropImages.Onion;

function FarmerOperationsView() {
  const steps = [
    ["NEW", true, "Lot created and visible to buyers"],
    ["ASSIGNED", true, "Buyer requirement matched"],
    ["IN PROGRESS", true, "Pickup coordination underway"],
    ["COLLECTED", true, "Pickup evidence recorded"],
    ["DELIVERED", false, "Awaiting buyer receipt confirmation"],
  ];

  return (
    <>
      <SectionHeader title="Farmer Operations" subtitle="Track your active market-linked lots, offers, pickup and delivery from one place." />
      <div className="prototype-live-strip"><div><span className="live-dot" /> LIVE OPERATIONS</div><LiveStamp minutes={2} /><span>Last sync · Maharashtra market network</span></div>
      <div className="prototype-stat-grid">
        <StatCard label="Active lots" value="6" detail="2 matched in the last hour" />
        <StatCard label="Buyer interest" value="9" detail="Across 4 verified buyers" />
        <StatCard label="Pickup today" value="2" detail="Next pickup · 11:30 AM" />
        <StatCard label="In delivery" value="1" detail="ETA · 29 Sep, 11:30 AM" />
      </div>
      <div className="prototype-operations-grid">
        <section className="prototype-card prototype-tracking-card">
          <div className="prototype-card-topline"><div><span className="prototype-eyebrow">LOT · LOT-MH-260921-001</span><h3>Onion · N-53 · 20 MT</h3><p>Pimpalgaon Baswant, Nashik → Pune Food Processing Zone</p></div><StatusBadge value="IN_TRANSIT" /></div>
          <div className="prototype-tracking-line">{steps.map(([label, done, text], index) => <div className={`tracking-step ${done ? "done" : ""}`} key={label}><span className="tracking-dot">{done ? "✓" : index + 1}</span><div><strong>{label}</strong><small>{text}</small></div></div>)}</div>
          <div className="prototype-route-summary"><div><span>Vehicle</span><strong>MH-15-GK-4821</strong></div><div><span>Driver</span><strong>Rohit Shinde</strong></div><div><span>ETA</span><strong>29 Sep · 11:30 AM</strong></div></div>
          <div className="prototype-modal-actions"><button className="prototype-primary-button">View delivery</button><button className="prototype-secondary-button">Contact logistics</button></div>
        </section>
        <section className="prototype-card">
          <div className="prototype-card-topline"><div><span className="prototype-eyebrow">RECENT ACTIVITY</span><h3>What changed</h3></div><span className="live-status-badge"><i />Live</span></div>
          <div className="prototype-live-feed">
            <div><b>Buyer offer received</b><span>20 MT onion · ₹2,800/qtl</span><LiveStamp minutes={2} /></div>
            <div><b>Pickup verified</b><span>Lot evidence accepted at farm gate</span><LiveStamp minutes={6} /></div>
            <div><b>Market price refreshed</b><span>Nashik modal · ₹2,820/qtl</span><LiveStamp minutes={11} /></div>
            <div><b>Storage option available</b><span>820 MT nearby capacity detected</span><LiveStamp minutes={18} /></div>
          </div>
        </section>
      </div>
    </>
  );
}

function ProfitLossView() {
  const rows = [
    ["Sell at nearby APMC", "₹2,800/qtl", "₹30,000", "₹10,000", "₹14.40L", "₹2,880/qtl"],
    ["Lower farmgate quote", "₹2,650/qtl", "₹1,10,000", "₹10,000", "₹14.45L", "₹2,890/qtl"],
    ["Warehouse-linked route", "₹2,700/qtl", "₹50,000", "₹35,000", "₹14.35L", "₹2,870/qtl"],
  ];
  return (
    <>
      <SectionHeader title="Market Insights · Profit & Loss" subtitle="Compare selling pathways using price, transport, storage and handling — not just the farmgate quote." />
      <div className="prototype-live-strip"><div><span className="live-dot" /> MARKET CONTEXT</div><LiveStamp minutes={3} /><span>Indicative prototype values · verify before transaction</span></div>
      <div className="prototype-stat-grid">
        <StatCard label="Current market context" value="₹2,820/qtl" detail="Nashik onion · modal reference" />
        <StatCard label="Best landed economics" value="₹2,870/qtl" detail="Illustrative warehouse route" />
        <StatCard label="Transport impact" value="₹50,000" detail="Route-dependent estimate" />
        <StatCard label="Decision" value="Compare" detail="AARTH does not promise future prices" />
      </div>
      <section className="prototype-card profit-hero-card"><div><span className="prototype-eyebrow">AARTH DECISION CONTEXT</span><h3>Farmgate price ≠ final realization</h3><p>A slightly higher quote can still produce lower net economics after transport, storage, handling and loss assumptions.</p></div><div className="profit-callout"><strong>₹2,870/qtl</strong><span>illustrative landed cost</span></div></section>
      <div className="prototype-table-wrapper"><table className="prototype-table"><thead><tr><th>Pathway</th><th>Farmgate</th><th>Transport</th><th>Storage / handling</th><th>Total</th><th>Landed / qtl</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, i) => <td key={i} className={i === 5 ? "prototype-positive" : ""}>{i === 0 ? <strong>{cell}</strong> : cell}</td>)}</tr>)}</tbody></table></div>
      <div className="prototype-card-grid"><section className="prototype-card"><h3>Sell now vs store</h3><div className="prototype-decision-compare"><div><span>Sell now</span><strong>₹2,740/qtl</strong><small>after illustrative transport</small></div><div><span>Store & sell later</span><strong>Range required</strong><small>Include storage + extra transport + loss/risk</small></div></div></section><section className="prototype-card"><h3>Why this recommendation exists</h3><div className="prototype-info-list"><div><span>Quantity</span><strong>50 MT requirement</strong></div><div><span>Quality</span><strong>Grade A · 55–70 mm</strong></div><div><span>Logistics</span><strong>Feasible route included</strong></div><div><span>Liquidity</span><strong>Cash timing must be considered</strong></div></div></section></div>
    </>
  );
}

function Overview({ role }) {
  const stats = {
    FARMER: [
      ["Active Lots", demoLots.length, "Lots currently visible"],
      ["Matched Lots", 5, "Buyer interest available"],
      ["Transactions", demoTransactions.length, "Prototype history"],
      ["Recovery Cases", demoRecovery.length, "Recovery pathways"],
    ],

    BUYER: [
      ["Open Requirements", demoRequirements.length, "Active sourcing needs"],
      ["Available Lots", demoLots.length, "Potential matches"],
      ["Transactions", demoTransactions.length, "Completed / active"],
      ["Verified Farmers", demoFarmers.length, "KYC verified"],
    ],

    FPO: [
      ["Registered Farmers", 1559, "Across connected FPOs"],
      ["Active Farmers", 1451, "Currently active"],
      ["Active Lots", 165, "Aggregation pipeline"],
      ["Mandi Markets", demoMandiPrices.length, "Prototype market feed"],
    ],

    STORAGE_PARTNER: [
      [
        "Facilities",
        demoStorageFacilities.length,
        "Connected facilities",
      ],
      [
        "Available Capacity",
        "5,520 MT",
        "Prototype inventory",
      ],
      [
        "Open Requests",
        demoStorageRequests.filter(
          (x) => x.status === "OPEN"
        ).length,
        "Awaiting allocation",
      ],
      [
        "Bookings",
        demoStorageRequests.filter(
          (x) => x.status === "BOOKED"
        ).length,
        "Active bookings",
      ],
    ],

    LOGISTICS_PARTNER: [
      [
        "Orders",
        demoLogisticsOrders.length,
        "Available in prototype",
      ],
      [
        "Accepted",
        demoLogisticsOrders.filter(
          (x) => x.status === "ACCEPTED"
        ).length,
        "Assigned orders",
      ],
      [
        "In Transit",
        demoLogisticsOrders.filter(
          (x) => x.status === "IN_TRANSIT"
        ).length,
        "Currently moving",
      ],
      ["Completed", 2, "Delivered orders"],
    ],
  };

  const selected = stats[role] || stats.FARMER;

  return (
    <>
      <SectionHeader
        title="AARTH Operations"
        subtitle="Prototype operational view populated with demonstration data."
      />

      <div className="prototype-stat-grid">
        {selected.map(([label, value, detail]) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            detail={detail}
          />
        ))}
      </div>

      <div className="prototype-card-grid">
        <div className="prototype-card">
          <h3>Live Prototype Activity</h3>

          <div className="prototype-activity">
            <div>
              <strong>Buyer offer received</strong>
              <span>LOT-MH-260921-002</span>
            </div>

            <div>
              <strong>Pickup verified</strong>
              <span>ORD-LOG-001</span>
            </div>

            <div>
              <strong>Storage match available</strong>
              <span>30 MT Onion</span>
            </div>

            <div>
              <strong>Recovery pathway found</strong>
              <span>REC-2609-017</span>
            </div>
          </div>
        </div>

        <div className="prototype-card">
          <h3>Prototype Environment</h3>

          <p>
            These records are demonstration data for the SIH
            prototype. The data layer is isolated so the same UI
            can later consume FastAPI and Supabase records.
          </p>

          <div className="prototype-info-list">
            <div>
              <span>Data source</span>
              <strong>prototypeData.js</strong>
            </div>

            <div>
              <span>Authentication</span>
              <strong>Existing AARTH Auth</strong>
            </div>

            <div>
              <span>Real API</span>
              <strong>Ready for integration</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


function FarmerView({ tab }) {
  const [selectedLot, setSelectedLot] = useState(null);

  if (tab === "Profit & Loss") {
    return <ProfitLossView />;
  }

  if (tab === "Operations") {
    return <FarmerOperationsView />;
  }

  if (tab === "Mandi Prices") {
    return <MandiPricesView />;
  }

  if (tab === "Lots" || tab === "Accepted Lots") {
    const lots =
      tab === "Accepted Lots"
        ? demoLots.filter((lot) =>
            ["MATCHED", "OFFER_RECEIVED"].includes(
              lot.status
            )
          )
        : demoLots;

    return (
      <>
        <SectionHeader
          title={tab}
          subtitle="Farmer lots populated for the SIH demonstration."
        />

        <div className="prototype-table-wrapper">
          <table className="prototype-table">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Grade</th>
                <th>Buyer Match</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id}>
                  <td>
                    <strong>{lot.id}</strong>
                    <small>{lot.farmer.name}</small>
                  </td>

                  <td>
                    {lot.commodity}
                    <small>{lot.variety}</small>
                  </td>

                  <td>
                    {lot.qty} {lot.unit}
                  </td>

                  <td>
                    {lot.grade}
                    <small>{lot.size}</small>
                  </td>

                  <td>
                    <strong>{lot.match}%</strong>
                    <small>{lot.mode}</small>
                  </td>

                  <td>
                    <StatusBadge value={lot.status} />
                  </td>

                  <td>
                    <button
                      className="prototype-small-button"
                      onClick={() => setSelectedLot(lot)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedLot && (
          <LotDetails
            lot={selectedLot}
            onClose={() => setSelectedLot(null)}
          />
        )}
      </>
    );
  }

  if (tab === "Rejected Recovery") {
    return (
      <>
        <SectionHeader
          title="Rejected Lot Recovery"
          subtitle="Alternative buyers, markets and recovery pathways."
        />

        <div className="prototype-card-grid">
          {demoRecovery.map((item) => (
            <div
              className="prototype-card"
              key={item.id}
            >
              <div className="prototype-card-topline">
                <strong>{item.id}</strong>
                <StatusBadge value={item.stage} />
              </div>

              <h3>{item.crop}</h3>

              <p>
                <strong>{item.qty}</strong>
              </p>

              <p>{item.reason}</p>

              <div className="prototype-info-list">
                <div>
                  <span>Previous buyer</span>
                  <strong>{item.oldBuyer}</strong>
                </div>

                <div>
                  <span>Suggested action</span>
                  <strong>{item.suggestedAction}</strong>
                </div>
              </div>

              <h4>Alternative pathways</h4>

              {item.alternatives.map((alternative) => (
                <div
                  className="prototype-option"
                  key={alternative}
                >
                  {alternative}
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (tab === "Transactions") {
    return (
      <>
        <SectionHeader
          title="Payment & Transaction History"
          subtitle="Digital transaction records and payment status."
        />

        <TransactionTable
          transactions={demoTransactions}
        />
      </>
    );
  }

  if (tab === "Residue") {
    return (
      <>
        <SectionHeader
          title="Farmer Residue"
          subtitle="Biowaste and agricultural residue opportunities."
        />

        <div className="prototype-card-grid">
          {demoResidues.map((item) => (
            <div
              className="prototype-card"
              key={item.id}
            >
              <div className="prototype-card-topline">
                <strong>{item.residue}</strong>
                <StatusBadge value={item.status} />
              </div>

              <p>{item.category}</p>

              <div className="prototype-info-list">
                <div>
                  <span>Farmer</span>
                  <strong>{item.farmer}</strong>
                </div>

                <div>
                  <span>Quantity</span>
                  <strong>{item.quantity}</strong>
                </div>

                <div>
                  <span>Potential buyer</span>
                  <strong>{item.buyer}</strong>
                </div>

                <div>
                  <span>Prototype value</span>
                  <strong>{item.value}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return <Overview role="FARMER" />;
}


function BuyerOrdersView() {
  const order = demoLogisticsOrders[0];
  const lot = demoLots[0];
  const grouped = demoLots.slice(0, 3);
  return (
    <>
      <SectionHeader title="View Orders" subtitle="Track sourcing orders with clear farmer, FPO, crop, logistics and delivery context." />
      <div className="prototype-live-strip"><div><span className="live-dot" /> LIVE ORDER FEED</div><LiveStamp minutes={2} /><span>Orders and fulfillment status refresh continuously in the prototype</span></div>
      <section className="prototype-card buyer-order-hero"><div><span className="prototype-eyebrow">ORDER · AARTH-ORD-24091</span><h3>50 MT Grade-A Onion Procurement</h3><p>Multi-source order · Pune Food Processing Zone · Required by 30 Sep</p></div><StatusBadge value="IN_PROGRESS" /></section>
      <div className="prototype-card-grid">
        <section className="prototype-card order-sources-card"><div className="prototype-card-topline"><div><span className="prototype-eyebrow">MULTI-LOT MATCH</span><h3>Farmers combined to fulfil one requirement</h3></div><strong className="aggregate-qty">50 MT</strong></div><div className="order-source-list">{grouped.map((item) => <div className="order-source-row" key={item.id}><img src={cropImage(item.commodity)} alt={item.commodity} /><div><strong>{item.farmer.name}</strong><span>{item.farmer.fpo}</span><small>{item.qty} MT · {item.grade} · {item.size}</small></div><b>{item.price.toLocaleString("en-IN")}/qtl</b><div className="supplier-actions compact"><a href={`tel:${item.farmer.phone.replace(/[^0-9+]/g, "")}`}>Contact farmer</a><a href={`https://wa.me/91${item.farmer.phone.replace(/[^0-9]/g, "").slice(-10)}`} target="_blank" rel="noreferrer">WhatsApp</a></div></div>)}</div><div className="aggregation-note"><b>✓ Aggregation complete</b><span>Three compatible farmer lots meet the buyer's quantity and quality constraints.</span></div><div className="fpo-aggregation-row"><span>FPO network</span><strong>Nashik Agro Producer FPO</strong><strong>Lasalgaon Farmers FPO</strong><strong>Yeola Agri FPO</strong></div></section>
        <section className="prototype-card"><div className="prototype-card-topline"><div><span className="prototype-eyebrow">DELIVERY TRACKING</span><h3>{lot.commodity} · {order.qty}</h3></div><span className="live-status-badge"><i />Live</span></div><div className="prototype-delivery-mini"><div className="delivery-node done"><i>✓</i><span>Pickup verified</span><small>Nashik</small></div><div className="delivery-node done"><i>✓</i><span>In transit</span><small>NH-60 route</small></div><div className="delivery-node"><i>3</i><span>Delivered</span><small>ETA 29 Sep</small></div></div><div className="prototype-order-meta"><span>Vehicle <b>{order.vehicle}</b></span><span>Driver <b>{order.driver}</b></span><span>Distance <b>{order.distance} km</b></span></div></section>
      </div>
    </>
  );
}

function BuyerMarketInsightsView() {
  return (
    <>
      <SectionHeader title="Buyer Market Insights" subtitle="Market context for sourcing decisions across Maharashtra." />
      <div className="prototype-stat-grid">{demoMandiPrices.slice(0, 4).map((item) => <StatCard key={`${item.crop}-${item.market}`} label={item.crop} value={formatCurrency(item.modal)} detail={`${item.market} · ${item.change} · ${item.arrivals} arrivals`} />)}</div>
      <section className="prototype-card"><h3>Procurement signals</h3><div className="prototype-insight-grid"><div><span>Supply</span><strong>Grade-A onion lots remain available</strong><small>Nashik cluster · multi-FPO aggregation possible</small></div><div><span>Economics</span><strong>Transport changes landed cost</strong><small>Compare quote + route before committing</small></div><div><span>Quality</span><strong>55–70 mm specification</strong><small>Evidence available on shortlisted lots</small></div></div></section>
    </>
  );
}

function BuyerOperationsView() {
  return (
    <>
      <SectionHeader title="Buyer Operations" subtitle="A live-style view of requirements, matching, negotiation and fulfillment." />
      <div className="prototype-live-strip"><div><span className="live-dot" /> PROCUREMENT PIPELINE</div><LiveStamp minutes={4} /><span>4 active workflow events</span></div>
      <div className="prototype-card-grid">{[["Requirement published","50 MT Grade-A onion","Pune Food Processing Zone","2 min ago"],["Multi-lot match found","20 + 15 + 15 MT","3 FPO / farmer sources","6 min ago"],["Offer received","₹2,800/qtl","Buyer economics checked","12 min ago"],["Logistics assigned","MH-15-GK-4821","ETA 29 Sep · 11:30 AM","18 min ago"]].map(([a,b,c,d]) => <article className="prototype-card operation-event" key={a}><span className="operation-event-icon">✓</span><div><h3>{a}</h3><strong>{b}</strong><p>{c}</p><small>{d}</small></div></article>)}</div>
    </>
  );
}

function SupportView({ role }) {
  return (
    <>
      <SectionHeader title="AARTH Support" subtitle="Quick help for live operations, verification, delivery and transaction issues." />
      <div className="support-grid"><article className="prototype-card"><span className="support-icon">?</span><h3>Need transaction help?</h3><p>Raise an issue against a lot, order or delivery record. Keep evidence attached to the transaction for a clear audit trail.</p><button className="prototype-primary-button">Raise support request</button></article><article className="prototype-card"><span className="support-icon">◉</span><h3>Contact AARTH desk</h3><p>Use the assisted support flow for market linkage, buyer verification, storage or logistics coordination.</p><button className="prototype-secondary-button">View support contacts</button></article><article className="prototype-card"><span className="support-icon">✓</span><h3>Current service status</h3><div className="prototype-info-list"><div><span>Matching</span><strong>Operational</strong></div><div><span>Market context</span><strong>Updated</strong></div><div><span>Logistics tracking</span><strong>Operational</strong></div></div></article></div>
    </>
  );
}

function BuyerView({ tab }) {
  const [selectedLot, setSelectedLot] = useState(null);

  if (tab === "Search Produce") {
    return (
      <>
        <SectionHeader title="Search Produce" subtitle="Search across available Maharashtra lots and supplier networks." />
        <section className="prototype-card buyer-search-panel">
          <div className="buyer-search-input"><span>⌕</span><input defaultValue="Onion" aria-label="Search produce" /></div>
          <div className="prototype-filter-row"><button className="prototype-filter active">Onion</button><button className="prototype-filter">Grapes</button><button className="prototype-filter">Tomato</button><button className="prototype-filter">Soybean</button><button className="prototype-filter">Wheat</button></div>
        </section>
        <div className="prototype-card-grid">{demoLots.slice(0, 4).map((lot) => <article className="prototype-card product-result-card" key={lot.id}><img src={cropImage(lot.commodity)} alt={lot.commodity} /><div><span className="prototype-eyebrow">AVAILABLE LOT</span><h3>{lot.commodity} · {lot.variety}</h3><p><b>{lot.qty} {lot.unit}</b> · {lot.grade} · {lot.district}</p><small>Seller: <strong>{lot.farmer.name}</strong></small><div className="product-result-footer"><span>₹{lot.price.toLocaleString("en-IN")}/qtl</span><button className="prototype-primary-button" onClick={() => setSelectedLot(lot)}>View lot</button></div></div></article>)}</div>
        {selectedLot && <LotDetails lot={selectedLot} buyerView onClose={() => setSelectedLot(null)} />}
      </>
    );
  }

  if (tab === "Orders") {
    return <BuyerOrdersView />;
  }

  if (tab === "Supplier Network") {
    return (
      <>
        <SectionHeader title="Supplier Network" subtitle="Farmers and FPOs available for direct and pooled sourcing." />
        <div className="supplier-network-grid">
          {demoFarmers.slice(0, 6).map((farmer) => <article className="prototype-card supplier-card" key={farmer.id}><img src={cropImage(farmer.crop)} alt={farmer.crop} /><div className="supplier-card-body"><div className="supplier-name-row"><div><h3>{farmer.name}</h3><span>{farmer.village}, {farmer.district}</span></div><StatusBadge value={farmer.kyc} /></div><p>{farmer.fpo}</p><div className="supplier-meta"><span>★ {farmer.rating}</span><span>{farmer.crop}</span><span>Verified farmer</span></div><div className="supplier-actions"><a href={`tel:${farmer.phone.replace(/[^0-9+]/g, "")}`}>☎ Contact farmer</a><a href={`https://wa.me/91${farmer.phone.replace(/[^0-9]/g, "").slice(-10)}`} target="_blank" rel="noreferrer">◉ WhatsApp</a></div></div></article>)}
        </div>
      </>
    );
  }

  if (tab === "Market Insights") {
    return <BuyerMarketInsightsView />;
  }

  if (tab === "Operations") {
    return <BuyerOperationsView />;
  }

  if (tab === "Support") {
    return <SupportView role="buyer" />;
  }

  if (tab === "Requirements") {
    return (
      <>
        <SectionHeader
          title="Buyer Requirements"
          subtitle="Current sourcing requirements."
        />

        <div className="prototype-card-grid">
          {demoRequirements.map((requirement) => (
            <div
              className="prototype-card"
              key={requirement.id}
            >
              <div className="prototype-card-topline">
                <strong>{requirement.id}</strong>
                <StatusBadge
                  value={requirement.status}
                />
              </div>

              <h3>{requirement.crop}</h3>

              <div className="prototype-info-list">
                <div>
                  <span>Buyer</span>
                  <strong>{requirement.buyer}</strong>
                </div>

                <div>
                  <span>Quantity</span>
                  <strong>
                    {requirement.quantity}{" "}
                    {requirement.unit}
                  </strong>
                </div>

                <div>
                  <span>Grade</span>
                  <strong>{requirement.grade}</strong>
                </div>

                <div>
                  <span>Delivery</span>
                  <strong>{requirement.location}</strong>
                </div>

                <div>
                  <span>Required by</span>
                  <strong>{requirement.deadline}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (tab === "Top Matches" || tab === "Lots") {
    const sortedLots = [...demoLots].sort(
      (a, b) => b.match - a.match
    );

    return (
      <>
        <SectionHeader
          title={
            tab === "Top Matches"
              ? "Top Matching Lots"
              : "Available Lots"
          }
          subtitle="Matching considers crop, quality, quantity and location."
        />

        <div className="prototype-match-list">
          {sortedLots.map((lot, index) => (
            <div
              className="prototype-match-card"
              key={lot.id}
            >
              <div className="prototype-match-score">
                <strong>{lot.match}%</strong>
                <span>Match</span>
              </div>

              <div className="prototype-match-main">
                <div className="prototype-card-topline">
                  <strong>
                    #{index + 1} · {lot.id}
                  </strong>

                  <StatusBadge value={lot.status} />
                </div>

                <h3>
                  {lot.commodity} · {lot.variety}
                </h3>

                <p>
                  {lot.farmer.name} · {lot.district} ·{" "}
                  {lot.distance} km
                </p>

                <div className="prototype-match-tags">
                  <span>✓ Quantity fit</span>
                  <span>✓ Grade fit</span>
                  <span>✓ Evidence available</span>
                  <span>✓ KYC verified</span>
                </div>

                <p className="prototype-explanation">
                  {lot.mode === "Pooled candidate"
                    ? "This lot can be combined with other compatible farmer lots to satisfy the buyer requirement."
                    : "Strong match based on quantity, quality, evidence and delivery location."}
                </p>
              </div>

              <button
                className="prototype-primary-button"
                onClick={() => setSelectedLot(lot)}
              >
                View Lot
              </button>
            </div>
          ))}
        </div>

        {selectedLot && (
          <LotDetails
            lot={selectedLot}
            buyerView
            onClose={() => setSelectedLot(null)}
          />
        )}
      </>
    );
  }

  if (tab === "Transactions") {
    return (
      <>
        <SectionHeader
          title="Completed Transactions"
          subtitle="Digital receipts, QR references and transaction history."
        />

        <TransactionTable
          transactions={demoTransactions}
        />
      </>
    );
  }

  if (tab === "Recovered Lots") {
    return (
      <>
        <SectionHeader
          title="Recovered Lots"
          subtitle="Lots recovered through alternative buyer or market pathways."
        />

        <div className="prototype-card-grid">
          {demoRecovery.map((item) => (
            <div
              className="prototype-card"
              key={item.id}
            >
              <div className="prototype-card-topline">
                <strong>{item.id}</strong>
                <StatusBadge value={item.stage} />
              </div>

              <h3>{item.crop}</h3>

              <p>{item.reason}</p>

              <div className="prototype-info-list">
                <div>
                  <span>Quantity</span>
                  <strong>{item.qty}</strong>
                </div>

                <div>
                  <span>Recovery action</span>
                  <strong>
                    {item.suggestedAction}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return <Overview role="BUYER" />;
}


function MandiPricesView() {
  return (
    <>
      <SectionHeader
        title="Find Your Best Market"
        subtitle="Maharashtra market-intelligence view using the existing AARTH prototype mandi dataset."
      />

      <div className="prototype-table-wrapper">
        <table className="prototype-table">
          <thead>
            <tr>
              <th>Crop</th>
              <th>Market</th>
              <th>Modal</th>
              <th>Min</th>
              <th>Max</th>
              <th>Arrivals</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {demoMandiPrices.map((item) => (
              <tr key={`${item.crop}-${item.market}`}>
                <td><strong>{item.crop}</strong></td>
                <td>{item.market}</td>
                <td>₹{item.modal}</td>
                <td>₹{item.min}</td>
                <td>₹{item.max}</td>
                <td>{item.arrivals}</td>
                <td>{item.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FpoView({ tab }) {
  if (tab === "Farmers") {
    return (
      <>
        <SectionHeader
          title="Registered Farmers"
          subtitle="Farmers connected with the FPO network."
        />

        <div className="prototype-table-wrapper">
          <table className="prototype-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Crop</th>
                <th>Village</th>
                <th>FPO</th>
                <th>KYC</th>
                <th>Rating</th>
              </tr>
            </thead>

            <tbody>
              {demoFarmers.map((farmer) => (
                <tr key={farmer.id}>
                  <td>
                    <strong>{farmer.name}</strong>
                    <small>{farmer.id}</small>
                  </td>

                  <td>{farmer.crop}</td>

                  <td>
                    {farmer.village}
                    <small>{farmer.district}</small>
                  </td>

                  <td>{farmer.fpo}</td>

                  <td>
                    <StatusBadge value={farmer.kyc} />
                  </td>

                  <td>★ {farmer.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (tab === "Applications") {
    return (
      <>
        <SectionHeader
          title="Farmer Applications"
          subtitle="New farmer registration applications."
        />

        <div className="prototype-table-wrapper">
          <table className="prototype-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Crop</th>
                <th>Village</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {demoApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.name}</strong>
                    <small>{application.id}</small>
                  </td>

                  <td>{application.crop}</td>

                  <td>
                    {application.village}
                    <small>{application.district}</small>
                  </td>

                  <td>{application.submitted}</td>

                  <td>
                    <StatusBadge
                      value={application.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (tab === "Lots") {
    return (
      <>
        <SectionHeader
          title="FPO Lots"
          subtitle="Aggregated and farmer-originated lots."
        />

        <TransactionStyleLotTable />
      </>
    );
  }

  if (tab === "Mandi Prices") {
    return (
      <>
        <SectionHeader
          title="Daily Mandi Prices"
          subtitle="Prototype market-intelligence feed for Maharashtra markets."
        />

        <div className="prototype-table-wrapper">
          <table className="prototype-table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Market</th>
                <th>Modal</th>
                <th>Min</th>
                <th>Max</th>
                <th>Arrivals</th>
                <th>Change</th>
              </tr>
            </thead>

            <tbody>
              {demoMandiPrices.map((item) => (
                <tr
                  key={`${item.crop}-${item.market}`}
                >
                  <td>
                    <strong>{item.crop}</strong>
                  </td>

                  <td>{item.market}</td>

                  <td>{formatCurrency(item.modal)}</td>

                  <td>{formatCurrency(item.min)}</td>

                  <td>{formatCurrency(item.max)}</td>

                  <td>{item.arrivals}</td>

                  <td className="prototype-positive">
                    {item.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return <Overview role="FPO" />;
}


function StorageOperationsView() {
  const events = [
    ["Storage request received", "30 MT Onion · Suresh Patil", "Nashik", 3],
    ["Capacity reserved", "18 MT Onion · Mangal Shinde", "Lasalgaon Onion Warehouse", 8],
    ["Booking confirmed", "12 MT Tomato · Anita Gaikwad", "Pune Fresh Logistics Store", 15],
    ["Inventory check completed", "820 MT capacity available", "Nashik Agri Cold Hub", 21],
  ];
  return (
    <>
      <SectionHeader title="Storage Operations" subtitle="Run requests, allocations, bookings and inventory coordination from one workspace." />
      <div className="prototype-live-strip"><div><span className="live-dot" /> STORAGE NETWORK</div><LiveStamp minutes={3} /><span>Capacity and request feed · live-style demo</span></div>
      <div className="prototype-stat-grid"><StatCard label="Open requests" value="5" detail="Need allocation" /><StatCard label="Booked today" value="2" detail="30 MT allocated" /><StatCard label="Available" value="5,520 MT" detail="Across 8 facilities" /><StatCard label="Utilisation" value="79.9%" detail="Network-level demo view" /></div>
      <section className="prototype-card"><div className="prototype-card-topline"><div><span className="prototype-eyebrow">ACTIVITY</span><h3>Recent storage movement</h3></div><span className="live-status-badge"><i />Live</span></div><div className="prototype-live-feed">{events.map(([a,b,c,m]) => <div key={a}><b>{a}</b><span>{b} · {c}</span><LiveStamp minutes={m} /></div>)}</div></section>
    </>
  );
}

function StorageView({ tab }) {
  if (tab === "My Facilities" || tab === "Facilities") {
    return (
      <>
        <SectionHeader
          title="Storage Facilities"
          subtitle="Verified storage infrastructure available through AARTH."
        />

        <div className="prototype-card-grid">
          {demoStorageFacilities.map((facility) => (
            <div
              className="prototype-card"
              key={facility.id}
            >
              <div className="prototype-card-topline">
                <strong>{facility.id}</strong>

                {facility.verified && (
                  <span className="prototype-verified">
                    ✓ Verified
                  </span>
                )}
              </div>

              <h3>{facility.name}</h3>

              <p>
                {facility.type} · {facility.district}
              </p>

              <div className="prototype-info-list">
                <div>
                  <span>Total capacity</span>
                  <strong>{facility.capacity}</strong>
                </div>

                <div>
                  <span>Available</span>
                  <strong>{facility.available}</strong>
                </div>

                <div>
                  <span>Storage rate</span>
                  <strong>{facility.rate}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (tab === "Capacity") {
    const total = 27500;
    const available = 5520;
    return (
      <>
        <SectionHeader title="Capacity" subtitle="Facility-wise live capacity view for storage allocation and sell-vs-store decisions." />
        <div className="prototype-stat-grid"><StatCard label="Total network capacity" value="27,500 MT" detail="Across connected Maharashtra facilities" /><StatCard label="Available now" value="5,520 MT" detail="20.1% available capacity" /><StatCard label="Booked" value="21,980 MT" detail="Current committed inventory" /><StatCard label="Facilities online" value="8 / 8" detail="All demo facilities verified" /></div>
        <section className="prototype-card"><div className="capacity-summary"><div><span>Available capacity</span><strong>{Math.round((available / total) * 100)}%</strong></div><div className="capacity-bar"><i style={{ width: `${(available / total) * 100}%` }} /></div><small>Allocation is illustrative for the SIH demo and should be replaced by live inventory feeds in production.</small></div></section>
        <div className="prototype-table-wrapper"><table className="prototype-table"><thead><tr><th>Facility</th><th>District</th><th>Type</th><th>Total</th><th>Available</th><th>Rate</th><th>Status</th></tr></thead><tbody>{demoStorageFacilities.map((f) => <tr key={f.id}><td><strong>{f.name}</strong><small>{f.id}</small></td><td>{f.district}</td><td>{f.type}</td><td>{f.capacity}</td><td className="prototype-positive">{f.available}</td><td>{f.rate}</td><td><StatusBadge value="VERIFIED" /></td></tr>)}</tbody></table></div>
      </>
    );
  }

  if (tab === "Operations") {
    return <StorageOperationsView />;
  }

  if (tab === "Support") {
    return <SupportView role="storage" />;
  }

  if (tab === "Storage Requests") {
    return (
      <>
        <SectionHeader
          title="Storage Requests"
          subtitle="Farmer and FPO requests requiring storage allocation."
        />

        <div className="prototype-table-wrapper">
          <table className="prototype-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Farmer</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {demoStorageRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>

                  <td>{request.crop}</td>

                  <td>{request.qty}</td>

                  <td>{request.farmer}</td>

                  <td>{request.duration}</td>

                  <td>
                    <StatusBadge
                      value={request.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (tab === "Bookings") {
    const bookings = demoStorageRequests.filter(
      (item) => item.status === "BOOKED"
    );

    return (
      <>
        <SectionHeader
          title="Storage Bookings"
          subtitle="Confirmed prototype storage allocations."
        />

        <div className="prototype-card-grid">
          {bookings.map((booking) => (
            <div
              className="prototype-card"
              key={booking.id}
            >
              <StatusBadge value={booking.status} />

              <h3>{booking.crop}</h3>

              <div className="prototype-info-list">
                <div>
                  <span>Request</span>
                  <strong>{booking.id}</strong>
                </div>

                <div>
                  <span>Farmer</span>
                  <strong>{booking.farmer}</strong>
                </div>

                <div>
                  <span>Quantity</span>
                  <strong>{booking.qty}</strong>
                </div>

                <div>
                  <span>Duration</span>
                  <strong>{booking.duration}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return <Overview role="STORAGE_PARTNER" />;
}


function LogisticsView({ tab }) {
  const [selectedOrder, setSelectedOrder] = useState(
    demoLogisticsOrders[0]
  );

  if (tab === "Orders" || tab === "Accepted Orders") {
    const orders =
      tab === "Accepted Orders"
        ? demoLogisticsOrders.filter((order) =>
            [
              "ACCEPTED",
              "IN_TRANSIT",
              "PICKUP_VERIFIED",
            ].includes(order.status)
          )
        : demoLogisticsOrders;

    return (
      <>
        <SectionHeader
          title={tab}
          subtitle="Transport orders and delivery assignments."
        />

        <div className="prototype-table-wrapper">
          <table className="prototype-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                    <small>{order.vehicle}</small>
                  </td>

                  <td>{order.crop}</td>

                  <td>{order.qty}</td>

                  <td>{order.pickup}</td>

                  <td>{order.destination}</td>

                  <td>
                    <StatusBadge value={order.status} />
                  </td>

                  <td>
                    <button
                      className="prototype-small-button"
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </>
    );
  }

  if (tab === "Tracking") {
    return <TrackingView />;
  }

  return <Overview role="LOGISTICS_PARTNER" />;
}


function LotDetails({
  lot,
  buyerView = false,
  onClose,
}) {
  return (
    <div
      className="prototype-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="prototype-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="prototype-modal-header">
          <div>
            <span className="prototype-eyebrow">
              LOT DETAILS
            </span>

            <h2>{lot.id}</h2>
          </div>

          <button
            className="prototype-close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="prototype-detail-grid">
          <div>
            <span>Farmer</span>
            <strong>{lot.farmer.name}</strong>
          </div>

          <div>
            <span>AARTH ID</span>
            <strong>{lot.farmer.id}</strong>
          </div>

          <div>
            <span>Crop</span>
            <strong>
              {lot.commodity} · {lot.variety}
            </strong>
          </div>

          <div>
            <span>Quantity</span>
            <strong>
              {lot.qty} {lot.unit}
            </strong>
          </div>

          <div>
            <span>Grade</span>
            <strong>{lot.grade}</strong>
          </div>

          <div>
            <span>Size</span>
            <strong>{lot.size}</strong>
          </div>

          <div>
            <span>Expected price</span>
            <strong>
              {formatCurrency(lot.price)}
            </strong>
          </div>

          <div>
            <span>KYC</span>
            <strong>✓ Verified</strong>
          </div>
        </div>

        <div className="prototype-quality-section">
          <h3>Quality-based estimation</h3>

          <table className="prototype-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Observed</th>
                <th>Requirement</th>
                <th>Result</th>
              </tr>
            </thead>

            <tbody>
              {qualityBreakdown.map(
                (
                  [
                    parameter,
                    observed,
                    requirement,
                    result,
                  ]
                ) => (
                  <tr key={parameter}>
                    <td>{parameter}</td>
                    <td>{observed}</td>
                    <td>{requirement}</td>

                    <td>
                      <StatusBadge value={result} />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="prototype-explanation-box">
          <strong>
            {buyerView
              ? "Why this lot matches"
              : "Market linkage"}
          </strong>

          <p>
            This prototype lot is linked with verified
            farmer identity, quality evidence, market
            context and buyer requirements. Actual
            offers and certifications should be supplied
            through the production APIs.
          </p>
        </div>

        <div className="prototype-modal-actions">
          <button className="prototype-primary-button">
            {buyerView
              ? "Send Offer"
              : "View Transaction"}
          </button>

          <button className="prototype-secondary-button">
            Raise Grievance
          </button>
        </div>
      </div>
    </div>
  );
}


function TransactionTable({ transactions }) {
  return (
    <div className="prototype-table-wrapper">
      <table className="prototype-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Lot</th>
            <th>Buyer</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <strong>{transaction.id}</strong>
                <small>{transaction.date}</small>
              </td>

              <td>{transaction.lot.commodity}</td>

              <td>{transaction.buyer.name}</td>

              <td>
                {formatCurrency(transaction.amount)}
              </td>

              <td>
                <StatusBadge
                  value={transaction.payment}
                />
              </td>

              <td>
                <StatusBadge
                  value={transaction.status}
                />
              </td>

              <td>
                <button className="prototype-small-button">
                  QR Receipt
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function TransactionStyleLotTable() {
  return (
    <div className="prototype-table-wrapper">
      <table className="prototype-table">
        <thead>
          <tr>
            <th>Lot</th>
            <th>Farmer</th>
            <th>Crop</th>
            <th>Quantity</th>
            <th>Grade</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {demoLots.map((lot) => (
            <tr key={lot.id}>
              <td>{lot.id}</td>

              <td>{lot.farmer.name}</td>

              <td>{lot.commodity}</td>

              <td>
                {lot.qty} {lot.unit}
              </td>

              <td>{lot.grade}</td>

              <td>
                <StatusBadge value={lot.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function OrderDetails({ order, onClose }) {
  return (
    <div className="prototype-card prototype-order-detail">
      <div className="prototype-card-topline">
        <div>
          <span className="prototype-eyebrow">
            ORDER DETAILS
          </span>

          <h3>{order.id}</h3>
        </div>

        <StatusBadge value={order.status} />
      </div>

      <div className="prototype-detail-grid">
        <div>
          <span>Farmer</span>
          <strong>{order.farmer.name}</strong>
        </div>

        <div>
          <span>KYC</span>
          <strong>✓ Verified</strong>
        </div>

        <div>
          <span>Vehicle</span>
          <strong>{order.vehicle}</strong>
        </div>

        <div>
          <span>Driver</span>
          <strong>{order.driver}</strong>
        </div>

        <div>
          <span>Pickup</span>
          <strong>{order.pickup}</strong>
        </div>

        <div>
          <span>Destination</span>
          <strong>{order.destination}</strong>
        </div>

        <div>
          <span>Buyer GSTIN</span>
          <strong>{order.gstin}</strong>
        </div>

        <div>
          <span>Distance</span>
          <strong>{order.distance} km</strong>
        </div>
      </div>

      <div className="prototype-route">
        <h4>Shipping Path</h4>

        {tracking.route.map((checkpoint) => (
          <div
            className={`prototype-route-step ${
              checkpoint.done ? "done" : ""
            }`}
            key={checkpoint.label}
          >
            <div className="prototype-route-dot"></div>

            <div>
              <strong>{checkpoint.label}</strong>

              <span>
                {checkpoint.place} · {checkpoint.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="prototype-modal-actions">
        <button
          className="prototype-primary-button"
          onClick={onClose}
        >
          Close
        </button>

        <button className="prototype-secondary-button">
          Track Delivery
        </button>
      </div>
    </div>
  );
}


function TrackingView() {
  return (
    <>
      <SectionHeader
        title="Delivery Tracking"
        subtitle="Prototype location and shipping path."
      />

      <div className="prototype-card">
        <div className="prototype-card-topline">
          <div>
            <span className="prototype-eyebrow">
              CURRENT LOCATION
            </span>

            <h3>{tracking.current}</h3>
          </div>

          <strong>{tracking.progress}%</strong>
        </div>

        <div className="prototype-progress">
          <div
            style={{
              width: `${tracking.progress}%`,
            }}
          />
        </div>

        <p>
          Vehicle{" "}
          <strong>{tracking.vehicle}</strong> · Driver{" "}
          <strong>{tracking.driver}</strong>
        </p>

        <div className="prototype-route">
          {tracking.route.map((checkpoint) => (
            <div
              className={`prototype-route-step ${
                checkpoint.done ? "done" : ""
              }`}
              key={checkpoint.label}
            >
              <div className="prototype-route-dot"></div>

              <div>
                <strong>{checkpoint.label}</strong>

                <span>
                  {checkpoint.place} · {checkpoint.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}


function PrototypeStyles() {
  return (
    <style>{`
      .prototype-workspace {
        min-height: 100vh;
        padding: 32px;
        background: #f5f8f6;
        color: #16352b;
      }

      .prototype-workspace-inner {
        max-width: 1400px;
        margin: 0 auto;
      }

      .prototype-header {
        margin-bottom: 24px;
      }

      .prototype-eyebrow {
        color: #16805c;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .12em;
      }

      .prototype-header h1 {
        margin: 4px 0;
        font-size: 30px;
      }

      .prototype-header p {
        margin: 0;
        color: #6b7d76;
      }

      .prototype-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 18px;
        margin-bottom: 8px;
      }

      .prototype-tab {
        border: 1px solid #d8e5df;
        background: white;
        color: #486057;
        padding: 10px 16px;
        border-radius: 10px;
        cursor: pointer;
        white-space: nowrap;
      }

      .prototype-tab.active {
        background: #087f59;
        border-color: #087f59;
        color: white;
      }

      .prototype-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 18px 0;
      }

      .prototype-section-header h2 {
        margin: 0;
        font-size: 23px;
      }

      .prototype-section-header p {
        color: #71817b;
        margin: 5px 0 0;
      }

      .prototype-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 20px;
      }

      .prototype-stat-card,
      .prototype-card {
        background: white;
        border: 1px solid #e0ebe6;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 25px rgba(22, 53, 43, .05);
      }

      .prototype-stat-label {
        color: #71817b;
        font-size: 13px;
      }

      .prototype-stat-value {
        margin-top: 7px;
        font-size: 28px;
        font-weight: 800;
      }

      .prototype-stat-detail {
        color: #16805c;
        font-size: 12px;
        margin-top: 5px;
      }

      .prototype-card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .prototype-card h3 {
        margin-top: 0;
      }

      .prototype-activity {
        display: grid;
        gap: 12px;
      }

      .prototype-activity div {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 12px 0;
        border-bottom: 1px solid #edf2ef;
      }

      .prototype-activity span,
      .prototype-info-list span {
        color: #77857f;
        font-size: 12px;
      }

      .prototype-info-list {
        display: grid;
        gap: 11px;
      }

      .prototype-info-list div {
        display: flex;
        justify-content: space-between;
        gap: 20px;
      }

      .prototype-table-wrapper {
        background: white;
        border: 1px solid #e0ebe6;
        border-radius: 16px;
        overflow-x: auto;
        box-shadow: 0 8px 25px rgba(22, 53, 43, .04);
      }

      .prototype-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 850px;
      }

      .prototype-table th,
      .prototype-table td {
        padding: 14px 16px;
        text-align: left;
        border-bottom: 1px solid #edf2ef;
        font-size: 13px;
      }

      .prototype-table th {
        background: #f7faf8;
        color: #60716a;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .05em;
      }

      .prototype-table td small {
        display: block;
        color: #82908b;
        margin-top: 4px;
      }

      .prototype-status,
      .prototype-verified {
        display: inline-flex;
        align-items: center;
        padding: 5px 9px;
        border-radius: 999px;
        background: #eef6f2;
        color: #167653;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }

      .prototype-small-button,
      .prototype-primary-button,
      .prototype-secondary-button {
        border-radius: 9px;
        padding: 9px 13px;
        cursor: pointer;
        font-weight: 700;
        border: 0;
      }

      .prototype-small-button,
      .prototype-secondary-button {
        background: #edf4f1;
        color: #176c52;
      }

      .prototype-primary-button {
        background: #087f59;
        color: white;
      }

      .prototype-match-list {
        display: grid;
        gap: 14px;
      }

      .prototype-match-card {
        display: grid;
        grid-template-columns: 72px 1fr auto;
        gap: 18px;
        align-items: center;
        background: white;
        border: 1px solid #e0ebe6;
        border-radius: 16px;
        padding: 18px;
      }

      .prototype-match-score {
        text-align: center;
        color: #087f59;
      }

      .prototype-match-score strong {
        display: block;
        font-size: 24px;
      }

      .prototype-match-score span {
        font-size: 10px;
      }

      .prototype-card-topline {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
      }

      .prototype-match-main h3 {
        margin: 7px 0 4px;
      }

      .prototype-match-main p {
        color: #71817b;
      }

      .prototype-match-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin: 10px 0;
      }

      .prototype-match-tags span {
        background: #f0f7f3;
        color: #24775d;
        border-radius: 999px;
        padding: 5px 8px;
        font-size: 11px;
      }

      .prototype-explanation {
        font-size: 13px;
      }

      .prototype-positive {
        color: #087f59;
        font-weight: 700;
      }

      .prototype-option {
        padding: 10px 12px;
        background: #f5f9f7;
        border-radius: 8px;
        margin-top: 7px;
        font-size: 13px;
      }

      .prototype-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(10, 30, 24, .45);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .prototype-modal {
        width: min(950px, 100%);
        max-height: 90vh;
        overflow: auto;
        background: white;
        border-radius: 20px;
        padding: 24px;
      }

      .prototype-modal-header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }

      .prototype-modal-header h2 {
        margin: 4px 0 0;
      }

      .prototype-close-button {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 50%;
        background: #eef4f1;
        font-size: 23px;
        cursor: pointer;
      }

      .prototype-detail-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-bottom: 22px;
      }

      .prototype-detail-grid > div {
        padding: 13px;
        background: #f7faf8;
        border-radius: 10px;
      }

      .prototype-detail-grid span {
        display: block;
        color: #788780;
        font-size: 11px;
        margin-bottom: 5px;
      }

      .prototype-quality-section {
        margin-top: 20px;
      }

      .prototype-explanation-box {
        margin-top: 20px;
        padding: 16px;
        background: #eef8f3;
        border-radius: 12px;
      }

      .prototype-explanation-box p {
        margin-bottom: 0;
        color: #53645d;
        font-size: 13px;
        line-height: 1.6;
      }

      .prototype-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
      }

      .prototype-route {
        margin-top: 20px;
      }

      .prototype-route-step {
        display: flex;
        gap: 14px;
        padding: 12px 0;
        border-bottom: 1px solid #edf2ef;
      }

      .prototype-route-dot {
        width: 12px;
        height: 12px;
        margin-top: 3px;
        border-radius: 50%;
        background: #ccd7d2;
        flex: 0 0 auto;
      }

      .prototype-route-step.done .prototype-route-dot {
        background: #087f59;
      }

      .prototype-route-step span {
        display: block;
        color: #7a8983;
        font-size: 12px;
        margin-top: 3px;
      }

      .prototype-progress {
        height: 9px;
        background: #e6eee9;
        border-radius: 999px;
        overflow: hidden;
        margin: 15px 0;
      }

      .prototype-progress div {
        height: 100%;
        background: #087f59;
        border-radius: inherit;
      }

      .prototype-order-detail {
        margin-top: 18px;
      }

      .prototype-live-strip { display:flex; align-items:center; gap:18px; flex-wrap:wrap; margin:0 0 18px; padding:12px 15px; border:1px solid #dce9e3; border-radius:14px; background:rgba(255,255,255,.88); box-shadow:0 7px 22px rgba(22,53,43,.04); color:#667970; font-size:12px; }
      .prototype-live-strip > div { display:flex; align-items:center; gap:7px; color:#176c52; font-weight:900; letter-spacing:.06em; font-size:10px; }
      .live-dot,.live-status-badge i { width:7px; height:7px; display:inline-block; border-radius:50%; background:#16a66e; box-shadow:0 0 0 4px #16a66e1a; }
      .live-stamp { display:inline-flex; align-items:center; gap:6px; color:#83918c; font-size:10px; white-space:nowrap; }
      .live-stamp i { width:5px; height:5px; border-radius:50%; background:#22a36d; display:inline-block; }
      .live-status-badge { display:inline-flex; align-items:center; gap:7px; padding:6px 9px; border-radius:999px; background:#edf9f3; color:#1a7a58; font-size:10px; font-weight:900; }
      .prototype-operations-grid { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr); gap:18px; }
      .prototype-tracking-card { min-height:410px; }
      .prototype-tracking-line { display:grid; grid-template-columns:repeat(5,1fr); margin:30px 0 22px; position:relative; }
      .prototype-tracking-line::before { content:""; position:absolute; left:7%; right:7%; top:16px; height:3px; background:#dfe9e4; z-index:0; }
      .tracking-step { position:relative; z-index:1; display:grid; justify-items:center; gap:8px; text-align:center; }
      .tracking-dot { width:34px; height:34px; display:grid; place-items:center; border-radius:50%; border:3px solid #d7e3de; background:#fff; color:#83918c; font-size:11px; font-weight:900; }
      .tracking-step.done .tracking-dot { border-color:#17a56d; background:#17a56d; color:#fff; box-shadow:0 0 0 5px #e8f7f0; }
      .tracking-step strong { font-size:10px; color:#37544b; letter-spacing:.04em; }
      .tracking-step small { max-width:115px; color:#87948f; line-height:1.4; }
      .prototype-route-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:13px; border:1px solid #e3ece8; border-radius:12px; background:#f8fbf9; }
      .prototype-route-summary span,.prototype-route-summary strong { display:block; }
      .prototype-route-summary span { color:#87948f; font-size:10px; }
      .prototype-route-summary strong { margin-top:4px; color:#24453b; font-size:12px; }
      .prototype-live-feed { display:grid; gap:0; }
      .prototype-live-feed > div { display:grid; grid-template-columns:1fr auto; gap:4px 12px; padding:14px 0; border-bottom:1px solid #edf2ef; }
      .prototype-live-feed > div:last-child { border-bottom:0; }
      .prototype-live-feed b { color:#28473e; font-size:13px; }
      .prototype-live-feed span:not(.live-stamp) { color:#75867f; font-size:11px; }
      .prototype-live-feed .live-stamp { grid-column:1 / -1; }
      .profit-hero-card { display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:18px; background:linear-gradient(120deg,#f4fbf7,#ffffff); }
      .profit-hero-card h3 { margin:6px 0; font-size:24px; }
      .profit-hero-card p { max-width:760px; margin:0; color:#687b73; line-height:1.6; }
      .profit-callout { min-width:180px; padding:18px; border-radius:14px; background:#0b7554; color:#fff; text-align:center; box-shadow:0 12px 28px #0b755425; }
      .profit-callout strong,.profit-callout span { display:block; }
      .profit-callout strong { font-size:25px; }
      .profit-callout span { margin-top:4px; opacity:.8; font-size:10px; }
      .prototype-decision-compare { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .prototype-decision-compare > div { padding:14px; border-radius:12px; background:#f7faf8; border:1px solid #e4ece8; }
      .prototype-decision-compare span,.prototype-decision-compare strong,.prototype-decision-compare small { display:block; }
      .prototype-decision-compare span { color:#789087; font-size:11px; }
      .prototype-decision-compare strong { margin:6px 0; color:#1b5d49; font-size:18px; }
      .prototype-decision-compare small { color:#87958f; line-height:1.4; }
      .buyer-search-panel { margin-bottom:18px; }
      .buyer-search-input { display:flex; align-items:center; gap:10px; border:1px solid #d6e3ed; border-radius:12px; padding:0 14px; background:#fff; }
      .buyer-search-input span { color:#3278b8; font-size:20px; }
      .buyer-search-input input { width:100%; border:0; outline:0; padding:15px 0; font-size:15px; color:#173e70; }
      .prototype-filter-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
      .prototype-filter { border:1px solid #d6e3ed; background:#fff; color:#58718b; border-radius:999px; padding:8px 13px; cursor:pointer; }
      .prototype-filter.active { border-color:#4d98d5; background:#eaf4fd; color:#1463ad; font-weight:800; }
      .product-result-card { display:grid; grid-template-columns:145px 1fr; gap:16px; overflow:hidden; padding:0; }
      .product-result-card > img { width:145px; height:100%; min-height:180px; object-fit:cover; }
      .product-result-card > div { padding:18px 18px 18px 0; }
      .product-result-card h3 { margin:5px 0; }
      .product-result-card p { color:#71817b; }
      .product-result-footer { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:14px; }
      .product-result-footer > span { color:#146b4f; font-weight:900; }
      .supplier-network-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
      .supplier-card { display:grid; grid-template-columns:120px 1fr; padding:0; overflow:hidden; }
      .supplier-card > img { width:120px; height:100%; min-height:190px; object-fit:cover; }
      .supplier-card-body { padding:16px; }
      .supplier-name-row { display:flex; justify-content:space-between; gap:10px; }
      .supplier-name-row h3 { margin:0 0 3px; font-size:17px; }
      .supplier-name-row span,.supplier-card-body p { color:#71817b; font-size:11px; }
      .supplier-meta { display:flex; flex-wrap:wrap; gap:7px; margin:11px 0; }
      .supplier-meta span { padding:5px 8px; border-radius:999px; background:#f2f7f4; color:#2b6e58; font-size:10px; font-weight:800; }
      .supplier-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
      .supplier-actions a { display:inline-flex; align-items:center; justify-content:center; padding:8px 10px; border-radius:8px; background:#edf7f3; color:#176c52; text-decoration:none; font-size:11px; font-weight:900; }
      .supplier-actions a:last-child { background:#eaf7ef; color:#1b7b45; }
      .supplier-actions.compact { margin-top:0; justify-content:flex-end; }
      .supplier-actions.compact a { padding:6px 8px; font-size:9px; }
      .buyer-order-hero { display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:18px; background:linear-gradient(120deg,#eef7ff,#ffffff); border-color:#d5e7f7; }
      .buyer-order-hero h3 { margin:6px 0; font-size:23px; color:#173e70; }
      .buyer-order-hero p { margin:0; color:#6b8095; }
      .aggregate-qty { color:#1769c2; font-size:24px; }
      .order-source-list { display:grid; gap:0; margin-top:14px; }
      .order-source-row { display:grid; grid-template-columns:52px minmax(0,1fr) auto auto; align-items:center; gap:11px; padding:12px 0; border-bottom:1px solid #edf2ef; }
      .order-source-row:last-child { border-bottom:0; }
      .order-source-row img { width:52px; height:52px; object-fit:cover; border-radius:10px; }
      .order-source-row strong,.order-source-row span,.order-source-row small { display:block; }
      .order-source-row strong { color:#173f6e; font-size:13px; }
      .order-source-row span { color:#71879a; font-size:10px; margin-top:2px; }
      .order-source-row small { color:#7e8e99; font-size:10px; margin-top:4px; }
      .order-source-row > b { color:#236d51; font-size:11px; }
      .aggregation-note { display:flex; gap:8px; align-items:flex-start; padding:12px; margin-top:13px; border-radius:10px; background:#eff9f4; color:#286b53; }
      .fpo-aggregation-row { display:flex; gap:7px; flex-wrap:wrap; align-items:center; margin-top:10px; }
      .fpo-aggregation-row span { color:#83918c; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; margin-right:3px; }
      .fpo-aggregation-row strong { padding:6px 8px; border-radius:999px; background:#f1f5ff; color:#315f9a; font-size:9px; }
      .aggregation-note span { color:#638075; font-size:10px; }
      .prototype-delivery-mini { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:25px 0 18px; position:relative; }
      .prototype-delivery-mini::before { content:""; position:absolute; left:15%; right:15%; top:15px; height:2px; background:#dfe9e4; }
      .delivery-node { position:relative; z-index:1; text-align:center; }
      .delivery-node i { width:30px; height:30px; display:grid; place-items:center; margin:0 auto 7px; border-radius:50%; border:2px solid #d6e1dc; background:#fff; color:#7b8b85; font-style:normal; font-size:10px; }
      .delivery-node.done i { border-color:#17a56d; background:#17a56d; color:#fff; }
      .delivery-node span,.delivery-node small { display:block; }
      .delivery-node span { color:#355349; font-size:10px; font-weight:800; }
      .delivery-node small { color:#89968f; font-size:9px; margin-top:3px; }
      .prototype-order-meta { display:grid; gap:7px; padding:12px; border-radius:10px; background:#f8fbf9; color:#74867e; font-size:10px; }
      .prototype-order-meta b { color:#28493f; }
      .prototype-insight-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
      .prototype-insight-grid > div { padding:15px; border:1px solid #e1ebe7; border-radius:12px; background:#fbfdfc; }
      .prototype-insight-grid span,.prototype-insight-grid strong,.prototype-insight-grid small { display:block; }
      .prototype-insight-grid span { color:#7b8c85; font-size:10px; }
      .prototype-insight-grid strong { margin:6px 0; color:#245d4b; font-size:14px; }
      .prototype-insight-grid small { color:#82928b; line-height:1.4; }
      .operation-event { display:flex; gap:14px; align-items:flex-start; }
      .operation-event-icon,.support-icon { width:38px; height:38px; flex:0 0 auto; display:grid; place-items:center; border-radius:11px; background:#eaf7f1; color:#16805c; font-weight:900; }
      .operation-event h3 { margin:0 0 5px; }
      .operation-event p { margin:4px 0; color:#71817b; }
      .operation-event small { color:#87958f; }
      .support-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
      .support-grid p { color:#71817b; line-height:1.6; font-size:13px; }
      .capacity-summary > div:first-child { display:flex; justify-content:space-between; align-items:center; color:#6e8078; font-size:11px; }
      .capacity-summary strong { color:#177355; font-size:22px; }
      .capacity-bar { height:12px; margin:10px 0; border-radius:999px; background:#e5eee9; overflow:hidden; }
      .capacity-bar i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#159c91,#47b98c); }
      .capacity-summary small { color:#8a9993; }

      @media (max-width: 900px) {
        .prototype-stat-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .prototype-card-grid {
          grid-template-columns: 1fr;
        }

        .prototype-detail-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .prototype-match-card {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 900px) {
        .prototype-operations-grid,.supplier-network-grid { grid-template-columns:1fr; }
        .prototype-insight-grid,.support-grid { grid-template-columns:1fr; }
        .order-source-row { grid-template-columns:52px 1fr; }
        .order-source-row > b,.order-source-row .supplier-actions { grid-column:2; justify-content:flex-start; }
      }

      @media (max-width: 600px) {
        .prototype-workspace {
          padding: 18px;
        }

        .prototype-stat-grid {
          grid-template-columns: 1fr;
        }

        .prototype-detail-grid {
          grid-template-columns: 1fr;
        }

        .prototype-modal-actions {
          flex-direction: column;
        }
      }
    `}</style>
  );
}


export default function PrototypeWorkspace({
  role,
  initialTab = "Overview",
}) {
  const availableTabs =
    tabsByRole[role] || tabsByRole.FARMER;

  const [activeTab, setActiveTab] = useState(
    availableTabs.includes(initialTab)
      ? initialTab
      : availableTabs[0]
  );

  const content = useMemo(() => {
    if (role === "FARMER") {
      return <FarmerView tab={activeTab} />;
    }

    if (role === "BUYER") {
      return <BuyerView tab={activeTab} />;
    }

    if (role === "FPO") {
      return <FpoView tab={activeTab} />;
    }

    if (role === "STORAGE_PARTNER") {
      return <StorageView tab={activeTab} />;
    }

    if (role === "LOGISTICS_PARTNER") {
      return <LogisticsView tab={activeTab} />;
    }

    return <Overview role={role} />;
  }, [role, activeTab]);

  return (
    <>
      <PrototypeStyles />

      <main className="prototype-workspace">
        <div className="prototype-workspace-inner">

          <header className="prototype-header">
            <span className="prototype-eyebrow">
              AARTH · SIH 2026 PROTOTYPE
            </span>

            <h1>
              {activeTab === "Profit & Loss"
                ? "Market Insights · Profit & Loss"
                : activeTab === "Orders" && role === "BUYER"
                ? "Buyer Orders"
                : role === "FARMER"
                ? "Farmer Operations"
                : role === "BUYER"
                ? "Buyer Operations"
                : role === "FPO"
                ? "FPO Operations"
                : role === "STORAGE_PARTNER"
                ? "Storage Operations"
                : role === "LOGISTICS_PARTNER"
                ? "Logistics Operations"
                : "Operations"}
            </h1>

            <p>
              Connected farm-to-market workflow with
              populated demonstration data.
            </p>
          </header>

          <nav className="prototype-tabs">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                className={`prototype-tab ${
                  activeTab === tab ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          {content}

        </div>
      </main>
    </>
  );
}