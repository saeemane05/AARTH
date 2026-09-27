import { useMemo, useState } from "react";

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
    "Lots",
    "Accepted Lots",
    "Rejected Recovery",
    "Transactions",
    "Residue",
  ],

  BUYER: [
    "Overview",
    "Requirements",
    "Top Matches",
    "Lots",
    "Transactions",
    "Recovered Lots",
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
    "Facilities",
    "Storage Requests",
    "Bookings",
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


function BuyerView({ tab }) {
  const [selectedLot, setSelectedLot] = useState(null);

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


function StorageView({ tab }) {
  if (tab === "Facilities") {
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
              {role === "FARMER"
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