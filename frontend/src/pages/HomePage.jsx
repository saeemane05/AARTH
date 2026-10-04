import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/aarth-logo.png";
import "./HomePage.css";

const heroImage =
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Agriculture%20farm%20Pune%20Maharashtra%20India.jpg?width=1800";

const missionImage =
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Farming-nashik.jpg?width=1400";

const insightImage =
  "https://cdn.zeebiz.com/sites/default/files/2023/03/14/231683-screenshot-2023-03-13-204827.jpg";

const ctaImage =
  "https://content.wotr.org/farmer-producer-companies-strengthen-maharashtra-farmers-against-climate-uncertainty/assets/d8GQK5frLN/dhruvi-edited-8-1000x750.jpg";

const featureImages = [
  // Maharashtra onion produce / lot context
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Baramati%2C%20Maharashtra%2C%20India.%2014%20onions.jpg?width=1000",
  // Maharashtra farm / farmer context
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Agriculture%20farm%20Pune%20Maharashtra%20India.jpg?width=1000",
  // Maharashtra agricultural produce / aggregation context
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Baramati%2C%20Maharashtra%2C%20India.%2016%20agri%20produce.jpg?width=1000",
  // Indian wholesale vegetable market context
  "https://cdn.zeebiz.com/sites/default/files/2023/03/14/231683-screenshot-2023-03-13-204827.jpg",
  // Maharashtra FPO / collection and transport context
  "https://content.wotr.org/farmer-producer-companies-strengthen-maharashtra-farmers-against-climate-uncertainty/assets/d8GQK5frLN/dhruvi-edited-8-1000x750.jpg",
  // Indian cold-chain storage context
  "https://www.vishraproduce.com/assets/images/service_cool.png",
];

const featureData = [
  {
    title: "QR-based Lot Tracking",
    description: "Unique QR for each lot from farm to buyer",
  },
  {
    title: "Offline Sync",
    description: "Works even with low or no internet",
  },
  {
    title: "Mobile App Available",
    description: "Access anytime, anywhere (Android)",
  },
  {
    title: "Real-time Market Data",
    description: "Live mandi prices, trends and forecasts",
  },
  {
    title: "Verified Buyers",
    description: "KYC-verified and trusted buyers",
  },
  {
    title: "Storage & Logistics",
    description: "Find and compare nearby facilities",
  },
];

const marqueeItems = [
  { icon: "market", title: "Market Prices", subtitle: "Mandi prices & arrivals" },
  { icon: "buyer", title: "Verified Buyers", subtitle: "Trusted buyer context" },
  { icon: "fpo", title: "FPO Network", subtitle: "Aggregate & grow" },
  { icon: "truck", title: "Logistics", subtitle: "Transport made easier" },
  { icon: "storage", title: "Storage", subtitle: "Compare facilities" },
  { icon: "sprout", title: "Agri Knowledge", subtitle: "Schemes & insights" },
];

const processSteps = [
  { number: "1", icon: "profile", title: "Create Profile", text: "Access as farmer, FPO, buyer or ecosystem partner" },
  { number: "2", icon: "lot", title: "List or Find", text: "Create a lot or post a buyer requirement" },
  { number: "3", icon: "match", title: "Get Matched", text: "Find compatible buyers, lots and pathways" },
  { number: "4", icon: "truck", title: "Coordinate", text: "Arrange logistics, storage and delivery" },
  { number: "5", icon: "receipt", title: "Complete", text: "Track outcomes, records and reputation" },
];

const testimonials = [
  {
    quote:
      "AARTH helped our FPO connect with reliable buyers and get a better price for our produce. The platform is simple and very useful.",
    author: "FPO Member, Nashik",
  },
  {
    quote:
      "Having market prices, buyers and logistics information together makes planning a sale much easier.",
    author: "Farmer, Maharashtra",
  },
  {
    quote:
      "Verified buyer information gives us more confidence before creating a transaction.",
    author: "FPO Representative",
  },
];

function DoodleIcon({ type, size = 25 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    market: (
      <>
        <path d="M5 26V13h6v13M13 26V7h6v19M21 26V17h6v9" />
        <path d="M4 28h24" />
        <path d="M6 9l4-3 4 2 5-4 6 3" />
      </>
    ),
    buyer: (
      <>
        <circle cx="11" cy="10" r="4" />
        <circle cx="22" cy="11" r="3.5" />
        <path d="M4.5 25c.8-5 3.2-7 6.5-7s5.7 2 6.5 7" />
        <path d="M17 24c.6-3.6 2.2-5.3 5-5.3 2.3 0 4.1 1.4 5 4.5" />
      </>
    ),
    fpo: (
      <>
        <path d="M16 27V10" />
        <path d="M16 15c-5 0-8-2.5-9-7 4.8-.2 8 1.5 9 5.5" />
        <path d="M16 19c5 0 8-2.5 9-7-4.8-.2-8 1.5-9 5.5" />
        <path d="M16 10c-1.5-4 0-7 3-9 2.2 3.8 1.2 6.8-3 9Z" />
      </>
    ),
    truck: (
      <>
        <path d="M3 8h17v12H3z" />
        <path d="M20 13h5l4 4v3h-9z" />
        <circle cx="9" cy="23" r="2.7" />
        <circle cx="25" cy="23" r="2.7" />
      </>
    ),
    storage: (
      <>
        <path d="M5 27V11l11-6 11 6v16" />
        <path d="M9 27V16h14v11M13 20h6M13 24h6" />
        <path d="M4 28h24" />
      </>
    ),
    sprout: (
      <>
        <path d="M16 28V16" />
        <path d="M16 20c-6 0-9-3-9-8 6-.2 9 2.4 9 8Z" />
        <path d="M16 17c0-6 3-9 9-9 0 6-3 9-9 9Z" />
      </>
    ),
    profile: (
      <>
        <circle cx="16" cy="10" r="4" />
        <path d="M7 27c1-6 4-9 9-9s8 3 9 9" />
      </>
    ),
    lot: (
      <>
        <path d="m7 9 9-4 9 4-9 4-9-4Z" />
        <path d="M7 9v10l9 4 9-4V9M16 13v10" />
      </>
    ),
    match: (
      <>
        <circle cx="10" cy="16" r="5" />
        <circle cx="22" cy="16" r="5" />
        <path d="m14 13 4 6M18 13l-4 6" />
      </>
    ),
    receipt: (
      <>
        <path d="M8 4h16v24l-3-2-3 2-2-2-3 2-3-2-2 2V4Z" />
        <path d="M12 10h8M12 15h8M12 20h5" />
      </>
    ),
  };

  return <svg {...common}>{icons[type] || icons.sprout}</svg>;
}

function SectionLabel({ children }) {
  return (
    <div className="aarth-section-label">
      <span></span>
      {children}
    </div>
  );
}

function AARTHHomePage() {
  const [testimonial, setTestimonial] = React.useState(0);

  const nextTestimonial = () => {
    setTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const previousTestimonial = () => {
    setTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <div className="aarth-home">

      {/* ================= NAVBAR ================= */}

      <header className="aarth-navbar">
        <div className="aarth-nav-inner">

          <Link to="/" className="aarth-logo">
            <img
              src={logo}
              alt="AARTH"
              className="aarth-logo-image"
            />
            <div>
              <div className="aarth-logo-name">AARTH</div>
              <div className="aarth-logo-tagline">
                Farm to Market, Together
              </div>
            </div>
          </Link>

          <nav className="aarth-nav-links">
            <a href="#home">Home</a>
            <a href="#about">About Us</a>
            <a href="#solution">Our Solution</a>
            <a href="#resources">Resources</a>
            <a href="#contact">Contact Us</a>
          </nav>

          <div className="aarth-nav-right">
            <button className="language-button">
              English | मराठी
            </button>

            <span className="search-icon">⌕</span>

            <Link to="/login" className="nav-login">
              Login
            </Link>

            <Link to="/register" className="nav-register">
              Register
            </Link>
          </div>

        </div>
      </header>


      {/* ================= HERO ================= */}

      <section
        className="aarth-hero"
        id="home"
        style={{ backgroundImage: `url(${heroImage})` }}
      >

        <div className="aarth-hero-overlay"></div>

        <div className="aarth-hero-content">

          <div className="hero-eyebrow">
            STRONGER FARMERS&nbsp;&nbsp; | &nbsp;&nbsp;TRANSPARENT MARKETS
            &nbsp;&nbsp; | &nbsp;&nbsp;A PROSPEROUS MAHARASHTRA
          </div>

          <h1>
            Bridging Farms
            <br />
            to Better Markets
          </h1>

          <p>
            AARTH connects farmers, FPOs, buyers and ecosystem partners
            with market intelligence, reliable linkages and end-to-end
            transaction support.
          </p>

          <div className="hero-buttons">

            <a href="#sih-roles" className="hero-primary-button">
              Know Our Solution <span>→</span>
            </a>

            <Link to="/login" className="hero-secondary-button">
              Login Directly
            </Link>

          </div>

        </div>

        <div className="hero-farmer-card" aria-label="Indian farmer and agricultural market">
          <img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Farming-nashik.jpg?width=1200" alt="Indian farmer in Maharashtra agriculture" />
          <div className="hero-farmer-card-caption">
            <span>MAHARASHTRA AGRICULTURE</span>
            <strong>Farm. Market. Opportunity.</strong>
          </div>
        </div>

        <div className="hero-quote-card">
          <div className="quote-marathi">
            शेतकऱ्यांच्या
            <br />
            समृद्धीसाठी
            <br />
            महाराष्ट्राची प्रगती
          </div>

          <div className="quote-brand">— AARTH</div>
        </div>

      </section>


      {/* ================= QUICK FEATURES ================= */}

      <section className="aarth-quick-strip" aria-label="AARTH market services">
        <div className="aarth-quick-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <div className="quick-item" key={`${item.title}-${index}`}>
              <div className="quick-icon doodle-icon">
                <DoodleIcon type={item.icon} size={27} />
              </div>
              <div>
                <div className="quick-title">{item.title}</div>
                <div className="quick-subtitle">{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= SIH 26193 DIRECT ROLE ACCESS ================= */}

      <section className="sih-access-section" id="sih-roles">

        <div className="sih-access-heading">
          <div>
            <SectionLabel>KNOW OUR SOLUTION</SectionLabel>
            <h2>Choose Your Role to Explore AARTH</h2>
            <p>
              Open the populated SIH26193 demonstration directly in the relevant
              dashboard. These demonstration routes do not require login or registration.
            </p>
          </div>

          <div className="sih-access-badge">
            <span>SIH 2026</span>
            <strong>26193</strong>
            <small>Direct demo access</small>
          </div>
        </div>

        <div className="sih-role-grid">
          {[
            {
              path: "/sih26193/farmer",
              title: "Farmer",
              text: "Create lots, compare markets and evaluate selling pathways.",
              image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Farming-nashik.jpg?width=900",
              icon: "profile",
            },
            {
              path: "/sih26193/buyer",
              title: "Buyer / Trader",
              text: "View requirements, compatible supply and procurement context.",
              image: "https://cdn.zeebiz.com/sites/default/files/2023/03/14/231683-screenshot-2023-03-13-204827.jpg",
              icon: "buyer",
            },
            {
              path: "/sih26193/fpo",
              title: "FPO",
              text: "Aggregate farmer supply and coordinate market opportunities.",
              image: "/FPOimage.png",
              icon: "fpo",
            },
            {
              path: "/sih26193/logistics",
              title: "Logistics Partner",
              text: "Coordinate agricultural transport and delivery movement.",
              image: "https://content.wotr.org/farmer-producer-companies-strengthen-maharashtra-farmers-against-climate-uncertainty/assets/d8GQK5frLN/dhruvi-edited-8-1000x750.jpg",
              icon: "truck",
            },
            {
              path: "/sih26193/storage",
              title: "Storage Partner",
              text: "Compare storage capacity and support sell-vs-store decisions.",
              image: "https://www.vishraproduce.com/assets/images/service_cool.png",
              icon: "storage",
            },
          ].map((role) => (
            <Link to={role.path} className="sih-role-card" key={role.path}>
              <div className="sih-role-visual">
                <img src={role.image} alt={`${role.title} in the Indian agricultural ecosystem`} />
                <span className="sih-verified-badge">✓ VERIFIED DEMO</span>
              </div>
              <div className="sih-role-copy">
                <div className="sih-role-icon"><DoodleIcon type={role.icon} size={24} /></div>
                <strong>{role.title}</strong>
                <small>{role.text}</small>
                <span className="sih-role-arrow">Explore dashboard →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* ================= MISSION ================= */}

      <section className="aarth-section mission-section" id="about">

        <div className="mission-content">

          <SectionLabel>OUR MISSION</SectionLabel>

          <h2>
            A fairer, more connected
            <br />
            agri ecosystem for
            <br />
            Maharashtra
          </h2>

          <p>
            Farmers often face fragmented information, limited buyer
            access, high logistics costs and weak bargaining power.
            AARTH brings everything together — market intelligence,
            matching, logistics, storage and transaction support —
            so you can make informed decisions with confidence.
          </p>

          <a href="#solution" className="green-button">
            Our Approach <span>→</span>
          </a>

        </div>

        <div className="mission-image-container">

          <img
            src={missionImage}
            alt="Maharashtra farmer using AARTH"
          />

          <div className="mission-image-quote">
            <strong>
              "तेव्हाच्याच्या साथीने
              <br />
              शेतकऱ्यांच्या प्रगती,
              <br />
              समृद्ध महाराष्ट्राची प्रगती"
            </strong>

            <span>— AARTH</span>
          </div>

        </div>

      </section>


      {/* ================= IMPACT BENEFITS ================= */}

      <section className="impact-strip">

        <div className="impact-item">
          <span className="impact-doodle"><DoodleIcon type="market" size={24} /></span>
          <b>Better Price Realisation</b>
        </div>

        <div className="impact-item">
          <span className="impact-doodle"><DoodleIcon type="fpo" size={24} /></span>
          <b>Stronger FPOs</b>
        </div>

        <div className="impact-item">
          <span className="impact-doodle"><DoodleIcon type="market" size={24} /></span>
          <b>Reduced Information Gap</b>
        </div>

        <div className="impact-item">
          <span className="impact-doodle"><DoodleIcon type="receipt" size={24} /></span>
          <b>Transparent Transactions</b>
        </div>

      </section>


      {/* ================= HOW AARTH WORKS ================= */}

      <section className="aarth-section process-section" id="solution">

        <SectionLabel>HOW AARTH WORKS</SectionLabel>

        <h2>
          A simple path from farm to market
        </h2>

        <p className="section-description">
          From listing your produce to final delivery, AARTH supports
          you at every step.
        </p>

        <div className="process-container">

          {processSteps.map((step, index) => (

            <React.Fragment key={step.number}>

              <div className="process-step">

                <div className={`process-circle step-${index + 1} doodle-process-icon`}>
                  <DoodleIcon type={step.icon} size={28} />
                </div>

                <div className="process-number">
                  {step.number}
                </div>

                <h3>{step.title}</h3>

                <p>{step.text}</p>

              </div>

              {index < processSteps.length - 1 && (
                <div className="process-arrow">
                  →
                </div>
              )}

            </React.Fragment>

          ))}

        </div>

        <a href="#features" className="process-detail-button">
          See Detailed Process&nbsp; →
        </a>

      </section>


      {/* ================= FEATURES ================= */}

      <section
        className="aarth-section features-section"
        id="features"
      >

        <SectionLabel>WHY CHOOSE AARTH</SectionLabel>

        <h2>
          Our Unique Features for a Stronger Agri Ecosystem
        </h2>

        <p className="section-description">
          Built for real-world needs of farmers, FPOs and buyers
          in Maharashtra.
        </p>

        <div className="feature-grid">

          {featureData.map((feature, index) => (

            <div className="feature-card" key={feature.title}>

              <div className="feature-image">
                <img
                  src={featureImages[index]}
                  alt={feature.title}
                />
              </div>

              <div className="feature-card-body">

                <h3>
                  {feature.title}
                </h3>

                <p>
                  {feature.description}
                </p>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* ================= INSIGHTS ================= */}

      <section
        className="aarth-section insights-section"
        id="resources"
      >

        <div className="insights-content">

          <SectionLabel>INSIGHTS</SectionLabel>

          <h2>
            Data-driven decisions
            <br />
            for better outcomes
          </h2>

          <p>
            Explore market trends, price forecasts, crop demand
            and expert insights tailored for Maharashtra.
          </p>

          <a href="#solution" className="green-button">
            Explore Insights <span>→</span>
          </a>

        </div>

        <div className="insight-image-container">

          <img
            src={insightImage}
            alt="Agricultural market insights"
          />

          <div className="insight-card">

            <div className="insight-title">
              ↗ Today's Highlight
            </div>

            <strong>
              Tomato prices up 8%
            </strong>

            <p>
              this week in Nashik APMC
            </p>

            <a href="#solution">
              View Market Prices →
            </a>

          </div>

        </div>

      </section>


      {/* ================= STATISTICS ================= */}

      <section className="statistics-strip">

        <div className="stat-item">
          <span className="stat-doodle"><DoodleIcon type="profile" size={25} /></span>
          <div>
            <strong>10,000+</strong>
            <small>Farmers & FPOs</small>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-doodle"><DoodleIcon type="buyer" size={25} /></span>
          <div>
            <strong>500+</strong>
            <small>Verified Buyers</small>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-doodle"><DoodleIcon type="market" size={25} /></span>
          <div>
            <strong>50+</strong>
            <small>APMC Markets</small>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-doodle"><DoodleIcon type="truck" size={25} /></span>
          <div>
            <strong>100+</strong>
            <small>Logistics Partners</small>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-doodle"><DoodleIcon type="storage" size={25} /></span>
          <div>
            <strong>25+</strong>
            <small>Storage Facilities</small>
          </div>
        </div>

      </section>


      {/* ================= TESTIMONIALS ================= */}

      <section className="aarth-section testimonials-section">

        <SectionLabel>WHAT USERS SAY</SectionLabel>

        <h2>
          Stories from across Maharashtra
        </h2>

        <div className="testimonial-wrapper">

          <button
            className="testimonial-arrow"
            onClick={previousTestimonial}
          >
            ‹
          </button>

          <div className="testimonial-card">

            <div className="quote-mark">
              “
            </div>

            <p>
              {testimonials[testimonial].quote}
            </p>

            <strong>
              — {testimonials[testimonial].author}
            </strong>

          </div>

          <button
            className="testimonial-arrow"
            onClick={nextTestimonial}
          >
            ›
          </button>

        </div>

        <div className="testimonial-dots">

          {testimonials.map((_, index) => (
            <button
              key={index}
              className={
                index === testimonial
                  ? "active"
                  : ""
              }
              onClick={() => setTestimonial(index)}
            />
          ))}

        </div>

      </section>


      {/* ================= CTA ================= */}

      <section
        className="aarth-cta"
        style={{ backgroundImage: `url(${ctaImage})` }}
        id="contact"
      >

        <div className="cta-overlay"></div>

        <div className="cta-content">

          <h2>
            Join AARTH Today
          </h2>

          <p>
            Be part of a stronger, more transparent and prosperous
            agri ecosystem.
          </p>

          <div className="cta-buttons">

            <a href="#sih-roles" className="cta-demo">
              Know Our Solution
            </a>

            <Link to="/login" className="cta-login">
              Login
            </Link>

            <Link to="/register" className="cta-register">
              Register
            </Link>

          </div>

        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="aarth-footer">

        <div className="footer-main">

          <div className="footer-brand">

            <div className="footer-logo">
              <span className="footer-doodle"><DoodleIcon type="sprout" size={20} /></span> <span>AARTH</span>
            </div>

            <p>
              Farm to Market, Together
            </p>

          </div>

          <div className="footer-column">

            <h4>Quick Links</h4>

            <a href="#about">About Us</a>
            <a href="#solution">Our Solution</a>
            <a href="#resources">Resources</a>

          </div>

          <div className="footer-column">

            <h4>Support</h4>

            <a href="#contact">Help Center</a>
            <a href="#contact">Contact Us</a>
            <a href="#contact">Grievance</a>
            <a href="#contact">FAQ</a>

          </div>

          <div className="footer-column">

            <h4>Legal</h4>

            <a href="#contact">Privacy Policy</a>
            <a href="#contact">Terms of Use</a>
            <a href="#contact">Disclaimer</a>

          </div>

          <div className="footer-column">

            <h4>Follow Us</h4>

            <div className="social-icons">
              <span>in</span>
              <span>◎</span>
              <span>▶</span>
              <span>f</span>
            </div>

          </div>

        </div>

        <div className="footer-bottom">

          <span>
            © 2026 AARTH. All rights reserved.
          </span>

          <span>
            Building a stronger, greener Maharashtra&nbsp;&nbsp; |
            &nbsp;&nbsp;Jai Jawan Jai Kisan
          </span>

        </div>

      </footer>

    </div>
  );
}

export default AARTHHomePage;
