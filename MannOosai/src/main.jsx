import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import {
  ArrowRight,
  Leaf,
  FlaskConical,
  Waves,
  Menu,
  X,
  ChevronLeft,
  Thermometer,
  Droplets,
  Activity,
  ShieldCheck,
  CloudRain
} from 'lucide-react';

import './styles.css';

const background = '/rice-field.png';

// Spring Boot backend
const API = 'http://localhost:8080';

function App() {
  const [page, setPage] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (next) => {
    setPage(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (page === 'health') {
    return <HealthPage onBack={() => navigate('home')} />;
  }

  if (page === 'safety') {
    return <SafetyPage onBack={() => navigate('home')} />;
  }

  return (
    <main
      className="landing"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="backdrop" />

      <header className="nav">
        <button
          className="brand"
          onClick={() => navigate('home')}
          aria-label="MannOosai home"
        >
          <span className="brand-mark">
            <Leaf size={20} strokeWidth={2.2} />
          </span>

          <span>
            <strong>MannOosai</strong>
            <small>மண் ஓசை</small>
          </span>
        </button>

        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <button onClick={() => navigate('home')}>Home</button>

          <button onClick={() => alert('About section coming next.')}>
            About
          </button>

          <button onClick={() => alert('Contact section coming next.')}>
            Contact
          </button>
        </nav>

        <button
          className="menu-btn"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span />
            SOIL INTELLIGENCE
            <span />
          </div>

          <h1>
            Mann<span>Oosai</span>
          </h1>

          <p className="tamil">மண் ஓசை</p>

          <p className="tagline">
            Listen to your soil.
          </p>

          <p className="subline">
            Understand what lies beneath. Track soil health. Grow with confidence.
          </p>
        </div>

        <div className="choice-grid">
          <ChoiceCard
            icon={<Leaf />}
            title="Soil Health"
            description="Listen to biological activity and understand the living state of your soil."
            onClick={() => navigate('health')}
          />

          <ChoiceCard
            icon={<FlaskConical />}
            title="Soil Safety"
            description="Screen soil chemistry for potential nutrient and chemical concerns."
            onClick={() => navigate('safety')}
          />
        </div>

        <div className="hero-footer">
          <span>HEAR • MEASURE • UNDERSTAND</span>
          <span>PEOPLE • SOIL • SUSTAINABILITY</span>
        </div>
      </section>
    </main>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onClick
}) {
  return (
    <button
      className="choice-card"
      onClick={onClick}
    >
      <div className="card-icon">
        {icon}
      </div>

      <h2>{title}</h2>

      <p>{description}</p>

      <span className="explore">
        Explore
        <ArrowRight size={20} />
      </span>
    </button>
  );
}

function AppShell({
  children,
  onBack,
  title,
  subtitle
}) {
  return (
    <main
      className="inner-page"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="inner-backdrop" />

      <header className="inner-nav">
        <button
          className="brand dark-brand"
          onClick={onBack}
        >
          <span className="brand-mark">
            <Leaf size={20} />
          </span>

          <span>
            <strong>MannOosai</strong>
            <small>மண் ஓசை</small>
          </span>
        </button>

        <button
          className="back-btn"
          onClick={onBack}
        >
          <ChevronLeft size={18} />
          Home
        </button>
      </header>

      <section className="content-wrap">
        <div className="page-heading">
          <p className="eyebrow dark-eyebrow">
            MannOosai
          </p>

          <h1>{title}</h1>

          <p>{subtitle}</p>
        </div>

        {children}
      </section>
    </main>
  );
}


/* =========================================================
   SOIL HEALTH
   ========================================================= */


function LiveSignalGraph({ acousticEvents, recording }) {
  const canvasRef = useRef(null);
  const [signalHistory, setSignalHistory] = useState([]);
  const lastEventIdRef = useRef(null);

  useEffect(() => {
    const latestEvent = acousticEvents.length
      ? acousticEvents[acousticEvents.length - 1]
      : null;

    if (!latestEvent) return;

    const eventId = latestEvent.id ?? `${latestEvent.eventTime}-${latestEvent.rms}`;
    if (eventId === lastEventIdRef.current) return;

    lastEventIdRef.current = eventId;

    const rms = Math.max(0, Number(latestEvent.rms) || 0);

    setSignalHistory((history) => {
      const next = [...history, rms];
      return next.slice(-80);
    });
  }, [acousticEvents]);

  useEffect(() => {
    if (!recording) return;

    const interval = setInterval(() => {
      setSignalHistory((history) => {
        if (history.length === 0) return history;

        // The peaks come from real Pico RMS events.
        // Between events, the displayed signal decays toward zero.
        const last = history[history.length - 1];
        const nextValue = Math.max(0, last * 0.72);
        return [...history, nextValue].slice(-80);
      });
    }, 350);

    return () => clearInterval(interval);
  }, [recording]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Fine graph-paper grid: small, nearly square boxes with thin dark-green lines.
      ctx.strokeStyle = '#0B5D1E';
      ctx.lineWidth = 0.6;

      const gridSize = 24;

      for (let x = gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const values = signalHistory.length
        ? signalHistory
        : Array.from({ length: 40 }, () => 0);

      const maxValue = Math.max(
        100000,
        ...values.map((value) => Number(value) || 0)
      );

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      values.forEach((value, index) => {
        const x = values.length === 1
          ? width
          : (index / (values.length - 1)) * width;

        const normalized = Math.min(
          1,
          Math.max(0, (Number(value) || 0) / maxValue)
        );

        const y = height - normalized * (height - 16) - 8;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    };

    draw();
    window.addEventListener('resize', draw);

    return () => window.removeEventListener('resize', draw);
  }, [signalHistory]);

  const latestRms = acousticEvents.length
    ? Math.round(Number(acousticEvents[acousticEvents.length - 1].rms) || 0)
    : 0;

  return (
    <section
      className="glass-panel"
      style={{ minHeight: '100%' }}
    >
      <div className="panel-top">
        <span>
          <Waves size={17} /> LIVE SIGNAL
        </span>
        <span className="status-pill">
          {recording ? 'PICO LIVE' : 'READY'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          margin: '18px 0 14px'
        }}
      >
        <div>
          <strong style={{ display: 'block', fontSize: '18px' }}>
            Acoustic activity
          </strong>
          <small
            className="muted"
            style={{ display: 'block', marginTop: '5px' }}
          >
            Live RMS signal from the Pico event stream
          </small>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span
            className="muted"
            style={{
              display: 'block',
              fontSize: '10px',
              letterSpacing: '0.14em'
            }}
          >
            RMS
          </span>
          <strong style={{ fontSize: '20px' }}>
            {latestRms || '--'}
          </strong>
        </div>
      </div>

      <div
        style={{
          height: '220px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.18)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Live Pico acoustic signal graph"
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>

      <div
        className="muted"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '10px',
          fontSize: '11px'
        }}
      >
        <span>
          {recording
            ? 'Listening for acoustic events…'
            : 'Start Scan to monitor live signals'}
        </span>
        <span>{signalHistory.length} samples</span>
      </div>
    </section>
  );
}


function addReportHeader(doc, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(238, 246, 235);
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(28, 57, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MannOosai', 18, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 18, 23);
  doc.text(subtitle, 18, 29);

  doc.setTextColor(35, 35, 35);
}

function addSectionTitle(doc, number, title, y) {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (y > 260) {
    doc.addPage();
    y = 18;
  }

  doc.setFillColor(244, 248, 242);
  doc.roundedRect(14, y - 5, pageWidth - 28, 11, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(38, 78, 45);
  doc.text(`${number}. ${title}`, 18, y + 3);

  doc.setTextColor(35, 35, 35);
  return y + 14;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 5) {
  const lines = doc.splitTextToSize(String(text), maxWidth);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function drawReportGraph(doc, events, x, y, width, height) {
  doc.setDrawColor(190, 198, 190);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);

  for (let i = 1; i < 5; i += 1) {
    const gy = y + (height / 5) * i;
    doc.line(x, gy, x + width, gy);
  }

  if (!events.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No acoustic events recorded during this scan.', x + 8, y + height / 2);
    return;
  }

  const values = events
    .map((event) => Number(event.rms))
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (!values.length) return;

  const maxValue = Math.max(100000, ...values);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);

  for (let i = 0; i < values.length; i += 1) {
    const px = values.length === 1
      ? x + width / 2
      : x + (i / (values.length - 1)) * width;

    const normalized = Math.min(1, Math.max(0, values[i] / maxValue));
    const py = y + height - normalized * (height - 8) - 4;

    if (i === 0) {
      doc.line(px, py, px, py);
    } else {
      const previousNormalized = Math.min(
        1,
        Math.max(0, values[i - 1] / maxValue)
      );
      const previousX = values.length === 1
        ? x + width / 2
        : x + ((i - 1) / (values.length - 1)) * width;
      const previousY =
        y + height - previousNormalized * (height - 8) - 4;

      doc.line(previousX, previousY, px, py);
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text(`Peak RMS: ${Math.round(maxValue)}`, x, y + height + 6);
  doc.text(`${events.length} event${events.length === 1 ? '' : 's'}`, x + width - 35, y + height + 6);
  doc.setTextColor(35, 35, 35);
}

function getActivityDistribution(events) {
  const buckets = {
    Low: 0,
    Moderate: 0,
    High: 0,
    VeryHigh: 0
  };

  events.forEach((event) => {
    const rms = Number(event.rms) || 0;

    if (rms < 100000) buckets.Low += 1;
    else if (rms < 300000) buckets.Moderate += 1;
    else if (rms < 600000) buckets.High += 1;
    else buckets.VeryHigh += 1;
  });

  return buckets;
}

function calculateHalfMetrics(events, start, stop) {
  const midpoint = new Date(
    (start.getTime() + stop.getTime()) / 2
  );

  const firstHalf = [];
  const secondHalf = [];

  events.forEach((event) => {
    const eventTime = new Date(event.eventTime);
    if (Number.isNaN(eventTime.getTime())) return;

    if (eventTime <= midpoint) firstHalf.push(event);
    else secondHalf.push(event);
  });

  const metrics = (items) => {
    const rms = items
      .map((event) => Number(event.rms))
      .filter((value) => Number.isFinite(value) && value >= 0);

    return {
      events: items.length,
      averageRms: rms.length
        ? rms.reduce((sum, value) => sum + value, 0) / rms.length
        : 0,
      peakRms: rms.length ? Math.max(...rms) : 0
    };
  };

  return {
    firstHalf: metrics(firstHalf),
    secondHalf: metrics(secondHalf)
  };
}

function generateSoilAcousticReport(scanResult) {
  if (!scanResult) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const events = Array.isArray(scanResult.scanEvents)
    ? scanResult.scanEvents
    : [];

  const start = new Date(scanResult.startTime);
  const stop = new Date(scanResult.stopTime);

  const durationSeconds = Number(scanResult.durationSeconds) || 0;
  const durationMinutes = durationSeconds / 60;
  const eventRatePerMinute = durationMinutes > 0
    ? scanResult.eventCount / durationMinutes
    : 0;

  const score = Number(scanResult.score) || 0;
  const averageRms = Number(scanResult.averageRms) || 0;
  const peakRms = Number(scanResult.peakRms) || 0;

  const distribution = getActivityDistribution(events);
  const halfMetrics = calculateHalfMetrics(events, start, stop);

  const activityLabel =
    score <= 20 ? 'Very Low Acoustic Activity' :
    score <= 40 ? 'Low Acoustic Activity' :
    score <= 60 ? 'Moderate Acoustic Activity' :
    score <= 80 ? 'High Acoustic Activity' :
    'Very High Acoustic Activity';

  let y = 46;

  // Cover / report information
  addReportHeader(
    doc,
    'SOIL ACOUSTIC ACTIVITY REPORT',
    'Scan-specific report generated from Start Scan to Stop Scan'
  );

  y = addSectionTitle(doc, 1, 'Report Information', y);
  doc.setFontSize(9);
  doc.text(`Report generated: ${new Date().toLocaleString()}`, margin, y);
  y += 6;
  doc.text(`Scan start: ${start.toLocaleString()}`, margin, y);
  y += 6;
  doc.text(`Scan stop: ${stop.toLocaleString()}`, margin, y);
  y += 6;
  doc.text(`Measurement duration: ${formatSecondsForReport(durationSeconds)}`, margin, y);
  y += 12;

  y = addSectionTitle(doc, 2, 'Executive Summary', y);
  y = addWrappedText(
    doc,
    `During this measurement window, MannOosai recorded ${scanResult.eventCount} acoustic events. The calculated Soil Life Activity Score was ${score}/100 (${activityLabel}). The score is a prototype acoustic indicator derived from the events recorded between Start Scan and Stop Scan; it is not a direct percentage of soil health or a direct count of soil organisms.`,
    margin,
    y,
    contentWidth
  );
  y += 8;

  y = addSectionTitle(doc, 3, 'Sensor Information', y);
  y = addWrappedText(
    doc,
    'Sensor: INMP441 MEMS digital microphone. Controller: Raspberry Pi Pico. Interface: I2S. The microphone captures acoustic activity conducted through the soil probe/waveguide. Only acoustic measurements available from the current hardware are reported here.',
    margin,
    y,
    contentWidth
  );
  y += 8;

  y = addSectionTitle(doc, 4, 'Acoustic Measurements', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const measurementRows = [
    ['Acoustic events', String(scanResult.eventCount)],
    ['Event rate', `${eventRatePerMinute.toFixed(2)} events/min`],
    ['Average RMS', Math.round(averageRms).toLocaleString()],
    ['Peak RMS', Math.round(peakRms).toLocaleString()],
    ['Measurement duration', formatSecondsForReport(durationSeconds)]
  ];

  measurementRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 60, y);
    y += 6;
  });
  y += 6;

  y = addSectionTitle(doc, 5, 'Acoustic Activity Graph', y);
  drawReportGraph(doc, events, margin, y, contentWidth, 58);
  y += 72;

  if (y > 245) {
    doc.addPage();
    y = 18;
    addReportHeader(
      doc,
      'SOIL ACOUSTIC ACTIVITY REPORT',
      'Scan-specific measurements'
    );
    y = 46;
  }

  y = addSectionTitle(doc, 6, 'Activity Distribution', y);
  const total = Math.max(1, events.length);

  Object.entries(distribution).forEach(([label, count]) => {
    const percentage = (count / total) * 100;
    const displayLabel =
      label === 'VeryHigh' ? 'Very High RMS' : `${label} RMS`;

    doc.setFont('helvetica', 'bold');
    doc.text(displayLabel, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${count} events (${percentage.toFixed(1)}%)`, margin + 60, y);
    y += 6;
  });
  y += 6;

  y = addSectionTitle(doc, 7, 'Soil Life Activity Score', y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(`${score}/100`, margin, y + 10);

  doc.setFontSize(10);
  doc.text(activityLabel, margin + 42, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  y += 24;
  y = addWrappedText(
    doc,
    'Prototype calculation weights: 40% acoustic event activity, 25% average RMS acoustic energy, 20% signal variability, and 15% peak/transient activity. Reference calibration values are prototype values for the hackathon and are not scientifically validated thresholds.',
    margin,
    y,
    contentWidth,
    4.5
  );
  y += 8;

  y = addSectionTitle(doc, 8, 'Field Conditions', y);
  y = addWrappedText(
    doc,
    'Temperature, moisture, pH, electrical conductivity, NPK, carbon, and micronutrients are not measured by the current INMP441 + Raspberry Pi Pico acoustic setup. No unmeasured field value is fabricated in this report.',
    margin,
    y,
    contentWidth
  );
  y += 8;

  y = addSectionTitle(doc, 9, 'Before / After Comparison', y);
  y = addWrappedText(
    doc,
    `This report uses a within-scan comparison: the first half of the scan versus the second half. It is not a treatment-before/treatment-after comparison.`,
    margin,
    y,
    contentWidth
  );
  y += 7;

  const comparisonRows = [
    ['First half', `${halfMetrics.firstHalf.events} events`, `Avg RMS ${Math.round(halfMetrics.firstHalf.averageRms).toLocaleString()}`, `Peak RMS ${Math.round(halfMetrics.firstHalf.peakRms).toLocaleString()}`],
    ['Second half', `${halfMetrics.secondHalf.events} events`, `Avg RMS ${Math.round(halfMetrics.secondHalf.averageRms).toLocaleString()}`, `Peak RMS ${Math.round(halfMetrics.secondHalf.peakRms).toLocaleString()}`]
  ];

  comparisonRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + 42, y);
    doc.text(row[2], margin + 82, y);
    doc.text(row[3], margin + 128, y);
    y += 6;
  });
  y += 8;

  if (y > 250) {
    doc.addPage();
    y = 18;
    addReportHeader(
      doc,
      'SOIL ACOUSTIC ACTIVITY REPORT',
      'Interpretation and next actions'
    );
    y = 46;
  }

  y = addSectionTitle(doc, 10, 'Interpretation', y);
  y = addWrappedText(
    doc,
    `The scan produced ${scanResult.eventCount} acoustic events at an average RMS of ${Math.round(averageRms).toLocaleString()} and a peak RMS of ${Math.round(peakRms).toLocaleString()}. Under the prototype scoring model, the resulting indicator is ${score}/100. This should be interpreted as acoustic activity observed during this scan window, not as a direct biological census or a laboratory soil-health measurement.`,
    margin,
    y,
    contentWidth
  );
  y += 8;

  y = addSectionTitle(doc, 11, 'Recommended Next Actions', y);
  const actions = [
    'Repeat the scan under similar conditions to establish a comparable baseline.',
    'Record soil treatment events such as FIB-SOL application separately from the acoustic measurement.',
    'For nutrient-management decisions, combine MannOosai acoustic results with laboratory or dedicated NPK/pH/EC/other soil-test measurements.',
    'Avoid interpreting a single acoustic scan as proof of microbial abundance or nutrient concentration.'
  ];

  actions.forEach((action, index) => {
    y = addWrappedText(
      doc,
      `${index + 1}. ${action}`,
      margin,
      y,
      contentWidth
    );
    y += 2;
  });
  y += 6;

  y = addSectionTitle(doc, 12, 'Technical Appendix', y);
  y = addWrappedText(
    doc,
    'Source hardware: INMP441 microphone + Raspberry Pi Pico. Audio acquisition uses I2S at 16 kHz mono with 32-bit input and RMS-based event detection. Events are transmitted from the Pico over USB serial to the Python bridge and then stored by the MannOosai Spring Boot backend. This report uses only events whose timestamps fall within the recorded Start Scan and Stop Scan interval.',
    margin,
    y,
    contentWidth
  );
  y += 7;

  y = addWrappedText(
    doc,
    `Raw scan event count: ${events.length}. Peak event RMS: ${scanResult.peakEvent ? Math.round(Number(scanResult.peakEvent.rms) || 0).toLocaleString() : 'N/A'}.`,
    margin,
    y,
    contentWidth
  );

  // Footer on every page.
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `MannOosai • Soil Acoustic Activity Report • Page ${page} of ${pageCount}`,
      margin,
      pageHeight - 8
    );
  }

  const stamp = start.getTime();
  doc.save(`MannOosai_Soil_Acoustic_Report_${stamp}.pdf`);
}

function formatSecondsForReport(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function HealthPage({ onBack }) {
  const [soilData, setSoilData] = useState(null);
  const [acousticEvents, setAcousticEvents] = useState([]);
  const [recording, setRecording] = useState(false);
  const [scanStartedAt, setScanStartedAt] = useState(null);
  const [scanStoppedAt, setScanStoppedAt] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [durationTick, setDurationTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [treatmentDate, setTreatmentDate] = useState('');
  // Demo environmental context — hardcoded for the hackathon.
  const environmentalData = {
    temperature: 28.5,
    humidity: 72
  };

  useEffect(() => {
    const saved = window.localStorage.getItem('mannoosaiTreatmentDate');
    if (saved) setTreatmentDate(saved);
  }, []);

  const updateTreatmentDate = (value) => {
    setTreatmentDate(value);
    if (value) window.localStorage.setItem('mannoosaiTreatmentDate', value);
    else window.localStorage.removeItem('mannoosaiTreatmentDate');
  };

  const loadSoilHealth = async () => {
    try {
      const response = await fetch(`${API}/api/soil-health/latest?_=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setSoilData(data);
      }
    } catch (error) {
      console.error('Soil health error:', error);
    }
  };

  const loadAcousticEvents = async () => {
    try {
      const response = await fetch(`${API}/api/acoustic-events?_=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setAcousticEvents(data);
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Acoustic event error:', error);
    }
  };


  useEffect(() => {
    loadSoilHealth();
    loadAcousticEvents();

    // The Pico -> Python bridge -> Spring Boot backend is the 24/7 collector.
    // The dashboard simply refreshes the stored events while this page is open.
    const interval = setInterval(() => {
      if (recording) {
        loadAcousticEvents();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [recording]);

  const startScan = () => {
    const now = new Date();
    setRecording(true);
    setScanStartedAt(now);
    setScanStoppedAt(null);
    setScanResult(null);
  };

  const calculateScanScore = (events, start, stop) => {
    if (!start || !stop) return 0;

    // IMPORTANT:
    // Only events detected inside THIS scan are used.
    // Stored events from before the scan must never affect the score.
    const scanEvents = events.filter((event) => {
      const eventTime = new Date(event.eventTime);

      return (
        !Number.isNaN(eventTime.getTime()) &&
        eventTime >= start &&
        eventTime <= stop
      );
    });

    const eventCount = scanEvents.length;

    // No acoustic events = no measured acoustic activity.
    if (eventCount === 0) return 0;

    const durationSeconds = Math.max(
      1,
      (stop.getTime() - start.getTime()) / 1000
    );

    const rmsValues = scanEvents
      .map((event) => Number(event.rms))
      .filter((value) => Number.isFinite(value) && value >= 0);

    if (rmsValues.length === 0) return 0;

    /*
     * Mannoosai Soil Life Activity Score
     *
     * This is a prototype acoustic indicator, NOT a percentage
     * of soil health.
     *
     * 40% Event activity
     * 25% Average RMS acoustic energy
     * 20% Signal variability
     * 15% Peak/transient activity
     *
     * Reference values are prototype calibration values for the
     * hackathon and are not scientifically validated thresholds.
     */

    // EVENT ACTIVITY
    // 20 events/minute = 100 points.
    const eventRatePerMinute =
      eventCount / (durationSeconds / 60);

    const eventActivity = Math.min(
      100,
      (eventRatePerMinute / 20) * 100
    );

    // A single event is therefore only 5 event-activity points
    // during a 60-second scan.

    // AVERAGE RMS ACTIVITY
    // 300,000 RMS = 100 points.
    const averageRms =
      rmsValues.reduce((sum, value) => sum + value, 0) /
      rmsValues.length;

    const averageActivity = Math.min(
      100,
      (averageRms / 300000) * 100
    );

    // SIGNAL VARIABILITY
    const variance =
      rmsValues.reduce((sum, value) => {
        const difference = value - averageRms;
        return sum + difference * difference;
      }, 0) / rmsValues.length;

    const standardDeviation = Math.sqrt(variance);

    // 150,000 RMS standard deviation = 100 points.
    const variabilityActivity = Math.min(
      100,
      (standardDeviation / 150000) * 100
    );

    // With only ONE event, there is no variation to measure.
    // Standard deviation is naturally 0 in that case.

    // PEAK ACTIVITY
    // 800,000 RMS = 100 points.
    const peakRms = Math.max(...rmsValues);

    const peakActivity = Math.min(
      100,
      (peakRms / 800000) * 100
    );

    const score = Math.round(
      eventActivity * 0.40 +
      averageActivity * 0.25 +
      variabilityActivity * 0.20 +
      peakActivity * 0.15
    );

    return Math.min(100, Math.max(0, score));
  };

  const stopScan = async () => {
    if (!recording || !scanStartedAt) return;

    const stopTime = new Date();
    const startTime = scanStartedAt;

    // Refresh once so events that arrived immediately before Stop are included.
    let events = acousticEvents;
    try {
      const response = await fetch(`${API}/api/acoustic-events?_=${Date.now()}`);
      if (response.ok) {
        events = await response.json();
        setAcousticEvents(events);
      }
    } catch (error) {
      console.error('Final event refresh error:', error);
    }

    const eventsDuringScan = events.filter((event) => {
      const eventTime = new Date(event.eventTime);
      return (
        !Number.isNaN(eventTime.getTime()) &&
        eventTime >= startTime &&
        eventTime <= stopTime
      );
    });

    const rmsValues = eventsDuringScan
      .map((event) => Number(event.rms))
      .filter((value) => Number.isFinite(value) && value >= 0);

    const averageRms = rmsValues.length
      ? rmsValues.reduce((sum, value) => sum + value, 0) / rmsValues.length
      : 0;
    const peakRms = rmsValues.length ? Math.max(...rmsValues) : 0;
    const calculatedScore = calculateScanScore(eventsDuringScan, startTime, stopTime);
    const durationSeconds = Math.max(
      0,
      Math.floor((stopTime.getTime() - startTime.getTime()) / 1000)
    );
    const peakEvent = eventsDuringScan.reduce((best, event) => {
      if (!best || Number(event.rms) > Number(best.rms)) return event;
      return best;
    }, null);

    const result = {
      score: calculatedScore,
      eventCount: eventsDuringScan.length,
      averageRms,
      peakRms,
      durationSeconds,
      startTime,
      stopTime,
      peakEvent,
      scanEvents: eventsDuringScan
    };

    setRecording(false);
    setScanStoppedAt(stopTime);
    setScanResult(result);
    setScanStartedAt(null);

    try {
      const response = await fetch(`${API}/api/soil-scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soilLifeScore: calculatedScore,
          acousticEvents: eventsDuringScan.length,
          averageRms,
          peakRms,
          durationSeconds,
          startTime: startTime.toISOString(),
          stopTime: stopTime.toISOString()
        })
      });

      if (response.ok) {
        console.log('Completed scan saved to database.');
      } else {
        console.error('Failed to save completed scan.');
      }
    } catch (error) {
      console.error('Scan save error:', error);
    }
  };

  const formatDurationValue = (seconds) => {
    const total = Math.max(0, Number(seconds) || 0);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDuration = () => {
    void durationTick;
    if (!scanStartedAt) return 'Not running';
    const end = recording ? new Date() : (scanStoppedAt || new Date());
    const seconds = Math.max(0, Math.floor((end.getTime() - scanStartedAt.getTime()) / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => setDurationTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [recording]);

  const totalEvents = acousticEvents.length;
  const latestEvent = acousticEvents.length > 0 ? acousticEvents[acousticEvents.length - 1] : null;

  const formatTimestamp = (event) => {
    if (!event?.eventTime) return '--';
    return new Date(event.eventTime).toLocaleString();
  };

  const rainDisplay = '--';


  return (
    <AppShell
      onBack={onBack}
      title="Soil Health"
      subtitle="Continuous acoustic monitoring of soil biological activity."
    >
      <section
        className="glass-panel"
        style={{ marginBottom: '18px' }}
      >
        <div className="panel-top">
          <span>
            <CloudRain size={17} /> ENVIRONMENTAL CONTEXT
          </span>
          <span className="status-pill">
            'DEMO DATA'
          </span>
        </div>

        <p className="muted" style={{ margin: '10px 0 18px' }}>
          Temperature and humidity are shown as demo environmental context alongside the acoustic soil activity measurement.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}
        >
          <div className="metric">
            <span className="metric-icon"><Thermometer size={20} /></span>
            <span className="metric-label">Air Temperature</span>
            <strong>
              {environmentalData.temperature}
              <small> °C</small>
            </strong>
          </div>

          <div className="metric">
            <span className="metric-icon"><Droplets size={20} /></span>
            <span className="metric-label">Air Humidity</span>
            <strong>
              {environmentalData.humidity}
              <small> %</small>
            </strong>
          </div>

          <div className="metric">
            <span className="metric-icon"><CloudRain size={20} /></span>
            <span className="metric-label">Rain Sensor</span>
            <strong>
              {rainDisplay}
              <small> raw</small>
            </strong>
          </div>
        </div>

        <small className="muted" style={{ display: 'block', marginTop: '12px' }}>
          Air temperature and humidity are currently hardcoded demo values for the presentation.
        </small>
      </section>

      <div className="dashboard-grid safety-grid">
        <section className="glass-panel">
          <div className="panel-top">
            <span>
              <Activity size={17} /> CONTINUOUS MONITORING
            </span>
            <span className="status-pill">
              {recording ? 'SCANNING' : 'PAUSED'}
            </span>
          </div>

          <div className="safety-summary">
            <div className="safety-score">
              {recording ? 'LIVE' : 'READY'}
            </div>
            <p>
              Pico events are collected continuously. Start and Stop define the exact period used to calculate this scan score; previously stored events are not erased.
            </p>
          </div>

          <div className="parameter">
            <span>Total acoustic events</span>
            <strong>{totalEvents}</strong>
            <b className="ok">Stored</b>
          </div>

          <div className="parameter">
            <span>Latest RMS</span>
            <strong>{latestEvent ? Math.round(Number(latestEvent.rms)) : '--'}</strong>
            <b className="ok">Signal</b>
          </div>

          <div className="parameter">
            <span>Latest event</span>
            <strong>{latestEvent ? formatTimestamp(latestEvent) : '--'}</strong>
            <b className="ok">Timestamped</b>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
            {!recording ? (
              <button className="scan-button" onClick={startScan}>
                ▶ Start Scan
              </button>
            ) : (
              <button className="scan-button stop" onClick={stopScan}>
                ■ Stop Scan
              </button>
            )}

            {!recording && scanResult && (
              <button
                className="scan-button"
                onClick={() => generateSoilAcousticReport(scanResult)}
              >
                ⬇ Generate Report
              </button>
            )}
          </div>

          <small className="muted" style={{ display: 'block', marginTop: '12px' }}>
            {recording
              ? `Dashboard monitoring active • ${formatDuration()}`
              : "Start when you want to begin a measurement period. Stop when you want MannOosai to calculate that period's score."}
          </small>

          {scanResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '28px' }}>
              <div
                style={{
                  width: '190px',
                  height: '190px',
                  borderRadius: '50%',
                  border: '10px solid rgba(255,255,255,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset'
                }}
              >
                <strong style={{ fontSize: '52px', lineHeight: 1 }}>
                  {scanResult.score}
                </strong>
                <span style={{ fontSize: '14px', opacity: 0.75, marginTop: '8px' }}>
                  / 100
                </span>
              </div>
              <strong style={{ marginTop: '14px', fontSize: '18px' }}>
                Soil Life Score
              </strong>
              <small className="muted" style={{ marginTop: '6px', textAlign: 'center' }}>
                {scanResult.eventCount} acoustic events • {formatDurationValue(scanResult.durationSeconds)}
              </small>
            </div>
          )}
        </section>

        <LiveSignalGraph
          acousticEvents={acousticEvents}
          recording={recording}
        />


      </div>

    </AppShell>
  );
}

function Metric({
  icon,
  label,
  value,
  unit
}) {

  return (

    <div className="metric">

      <span className="metric-icon">
        {icon}
      </span>

      <span className="metric-label">
        {label}
      </span>

      <strong>

        {value}

        <small>
          {unit}
        </small>

      </strong>

    </div>

  );
}



/* =========================================================
   SOIL SAFETY
   ========================================================= */

function SafetyPage({ onBack }) {
  const [sample, setSample] = useState({
    plot: 'North block',
    sampleDate: new Date().toISOString().slice(0, 10),
    depth: '0-15',
    crop: 'Paddy',
    source: 'Field test kit'
  });

  const [values, setValues] = useState({
    ph: '4.8',
    ec: '0.4',
    organicCarbon: '0.38',
    nitrogen: '240',
    phosphorus: '18',
    potassium: '300',
    zinc: '0.35',
    iron: '',
    copper: '',
    manganese: '',
    boron: '',
    lead: '',
    cadmium: '',
    arsenic: ''
  });

  const [savedAssessments, setSavedAssessments] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('mannoosaiSafetyAssessments') || '[]');
    } catch {
      return [];
    }
  });

  const [acousticEvents, setAcousticEvents] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadAcousticEvents = async () => {
      try {
        const response = await fetch(`${API}/api/acoustic-events?_=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setAcousticEvents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Safety acoustic event error:', error);
      }
    };

    loadAcousticEvents();
    const interval = setInterval(loadAcousticEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const numeric = (key) => {
    const value = Number(values[key]);
    return Number.isFinite(value) ? value : null;
  };

  const rules = [
    {
      key: 'ph',
      label: 'pH',
      unit: '1:2.5',
      value: numeric('ph'),
      normal: '6.5 – 7.5 neutral',
      range: '<5.5 or >8.5 unsafe',
      status:
        numeric('ph') === null ? 'NOT TESTED' :
        numeric('ph') < 5.5 || numeric('ph') > 8.5 ? 'UNSAFE' :
        numeric('ph') < 6.5 || numeric('ph') > 7.5 ? 'CAUTION' : 'NORMAL'
    },
    {
      key: 'ec',
      label: 'Electrical conductivity',
      unit: 'dS/m',
      value: numeric('ec'),
      normal: '<1.0 normal',
      range: '1.0 – 2.0 critical • >2.0 injurious',
      status:
        numeric('ec') === null ? 'NOT TESTED' :
        numeric('ec') > 2 ? 'UNSAFE' :
        numeric('ec') >= 1 ? 'CAUTION' : 'NORMAL'
    },
    {
      key: 'organicCarbon',
      label: 'Organic carbon',
      unit: '%',
      value: numeric('organicCarbon'),
      normal: '<0.50 low',
      range: '0.50 – 0.75 medium • >0.75 high',
      status:
        numeric('organicCarbon') === null ? 'NOT TESTED' :
        numeric('organicCarbon') < 0.5 ? 'LOW' :
        numeric('organicCarbon') <= 0.75 ? 'MEDIUM' : 'HIGH'
    },
    {
      key: 'nitrogen',
      label: 'Available nitrogen',
      unit: 'kg/ha',
      value: numeric('nitrogen'),
      normal: '<280 low',
      range: '280 – 560 medium • >560 high',
      status:
        numeric('nitrogen') === null ? 'NOT TESTED' :
        numeric('nitrogen') < 280 ? 'LOW' :
        numeric('nitrogen') <= 560 ? 'MEDIUM' : 'HIGH'
    },
    {
      key: 'phosphorus',
      label: 'Available phosphorus',
      unit: 'kg/ha',
      value: numeric('phosphorus'),
      normal: '<10 low',
      range: '10 – 25 medium • >25 high',
      status:
        numeric('phosphorus') === null ? 'NOT TESTED' :
        numeric('phosphorus') < 10 ? 'LOW' :
        numeric('phosphorus') <= 25 ? 'MEDIUM' : 'HIGH'
    },
    {
      key: 'potassium',
      label: 'Available potassium',
      unit: 'kg/ha',
      value: numeric('potassium'),
      normal: '<110 low',
      range: '110 – 280 medium • >280 high',
      status:
        numeric('potassium') === null ? 'NOT TESTED' :
        numeric('potassium') < 110 ? 'LOW' :
        numeric('potassium') <= 280 ? 'MEDIUM' : 'HIGH'
    },
    {
      key: 'zinc',
      label: 'Zinc',
      unit: 'ppm',
      value: numeric('zinc'),
      normal: 'critical limit 0.6',
      range: 'Below critical limit',
      status:
        numeric('zinc') === null ? 'NOT TESTED' :
        numeric('zinc') < 0.6 ? 'DEFICIENT' : 'NORMAL'
    },
    {
      key: 'iron',
      label: 'Iron',
      unit: 'ppm',
      value: numeric('iron'),
      normal: 'critical limit 4.5',
      range: 'Below critical limit',
      status:
        numeric('iron') === null ? 'NOT TESTED' :
        numeric('iron') < 4.5 ? 'DEFICIENT' : 'NORMAL'
    },
    {
      key: 'copper',
      label: 'Copper',
      unit: 'ppm',
      value: numeric('copper'),
      normal: 'critical limit 0.2',
      range: 'Below critical limit',
      status:
        numeric('copper') === null ? 'NOT TESTED' :
        numeric('copper') < 0.2 ? 'DEFICIENT' : 'NORMAL'
    },
    {
      key: 'manganese',
      label: 'Manganese',
      unit: 'ppm',
      value: numeric('manganese'),
      normal: 'critical limit 2.0',
      range: 'Below critical limit',
      status:
        numeric('manganese') === null ? 'NOT TESTED' :
        numeric('manganese') < 2 ? 'DEFICIENT' : 'NORMAL'
    },
    {
      key: 'boron',
      label: 'Boron (hot water)',
      unit: 'ppm',
      value: numeric('boron'),
      normal: 'critical limit 0.5',
      range: 'Below critical limit',
      status:
        numeric('boron') === null ? 'NOT TESTED' :
        numeric('boron') < 0.5 ? 'DEFICIENT' : 'NORMAL'
    },
    {
      key: 'lead',
      label: 'Lead (Pb)',
      unit: 'mg/kg',
      value: numeric('lead'),
      normal: '<250 safe',
      range: '250 – 500 caution • >500 unsafe',
      status:
        numeric('lead') === null ? 'NOT TESTED' :
        numeric('lead') > 500 ? 'UNSAFE' :
        numeric('lead') >= 250 ? 'CAUTION' : 'SAFE'
    },
    {
      key: 'cadmium',
      label: 'Cadmium (Cd)',
      unit: 'mg/kg',
      value: numeric('cadmium'),
      normal: '<3 safe',
      range: '3 – 6 caution • >6 unsafe',
      status:
        numeric('cadmium') === null ? 'NOT TESTED' :
        numeric('cadmium') > 6 ? 'UNSAFE' :
        numeric('cadmium') >= 3 ? 'CAUTION' : 'SAFE'
    },
    {
      key: 'arsenic',
      label: 'Arsenic (As)',
      unit: 'mg/kg',
      value: numeric('arsenic'),
      normal: '<20 safe',
      range: '20 – 50 caution • >50 unsafe',
      status:
        numeric('arsenic') === null ? 'NOT TESTED' :
        numeric('arsenic') > 50 ? 'UNSAFE' :
        numeric('arsenic') >= 20 ? 'CAUTION' : 'SAFE'
    }
  ];

  const notTested = rules.filter((item) => item.status === 'NOT TESTED').length;
  const unsafe = rules.filter((item) => item.status === 'UNSAFE').length;
  const caution = rules.filter((item) => item.status === 'CAUTION').length;
  const deficient = rules.filter((item) => item.status === 'DEFICIENT' || item.status === 'LOW').length;
  const safe = rules.filter((item) => ['NORMAL', 'SAFE', 'HIGH', 'MEDIUM'].includes(item.status)).length;

  const latestEvent = acousticEvents.length
    ? acousticEvents[acousticEvents.length - 1]
    : null;

  const statusClass = (status) => {
    if (['UNSAFE', 'DEFICIENT', 'LOW'].includes(status)) return 'unsafe';
    if (['CAUTION', 'MEDIUM'].includes(status)) return 'caution';
    if (['NOT TESTED'].includes(status)) return 'untested';
    return 'safe';
  };

  const statusLabel = (status) => {
    if (status === 'DEFICIENT') return 'DEFICIENT';
    if (status === 'NOT TESTED') return 'NOT TESTED';
    if (status === 'UNSAFE') return 'UNSAFE';
    if (status === 'CAUTION') return 'CAUTION';
    if (status === 'LOW') return 'LOW';
    if (status === 'MEDIUM') return 'MEDIUM';
    if (status === 'HIGH') return 'HIGH';
    return status;
  };

  const screeningTitle =
    unsafe > 0
      ? 'Not safe to crop without correction'
      : deficient > 0
        ? 'Corrections recommended before sowing'
        : caution > 0
          ? 'Review before cropping'
          : 'Within configured screening ranges';

  const screeningText =
    unsafe > 0
      ? 'A reaction, salinity or contamination parameter is outside its configured safe range. Correct it before sowing.'
      : deficient > 0
        ? 'One or more nutrient or micronutrient indicators are below the configured critical range.'
        : caution > 0
          ? 'One or more entered values should be reviewed before making a field decision.'
          : 'The entered parameters are within the configured screening ranges.';

  const correctiveActions = [
    rules.find((item) => item.key === 'ph')?.status === 'UNSAFE'
      ? ['pH', 'FIX', 'Strongly acidic. Apply agricultural lime against a lime requirement test before sowing; most nutrients lock up below pH 5.5.']
      : null,
    rules.find((item) => item.key === 'organicCarbon')?.status === 'LOW'
      ? ['Organic carbon', 'FIX', 'Low organic carbon — incorporate FYM or compost, add green manure, and retain residues.']
      : null,
    rules.find((item) => item.key === 'nitrogen')?.status === 'LOW'
      ? ['Available nitrogen', 'FIX', 'Low nitrogen. Apply the recommended dose in splits rather than one basal application, and consider a legume in the rotation.']
      : null,
    rules.find((item) => item.key === 'zinc')?.status === 'DEFICIENT'
      ? ['Zinc', 'FIX', 'Below the critical limit of 0.6 ppm. Use the zinc recommendation from the soil test or local extension guidance.']
      : null,
    rules.find((item) => item.key === 'phosphorus')?.status === 'MEDIUM'
      ? ['Available phosphorus', 'WATCH', 'Medium phosphorus. Use the soil-test recommendation and avoid unnecessary additional application.']
      : null
  ].filter(Boolean);

  const handleSave = () => {
    const assessment = {
      id: Date.now(),
      saved: new Date().toLocaleString(),
      plot: sample.plot,
      crop: sample.crop,
      ph: values.ph || '—',
      ec: values.ec || '—',
      organicCarbon: values.organicCarbon || '—',
      flags: `${unsafe + deficient} out / ${caution} caution`,
      result: unsafe > 0 ? 'CORRECT' : deficient > 0 ? 'REVIEW' : 'OK'
    };

    const next = [assessment, ...savedAssessments].slice(0, 12);
    setSavedAssessments(next);
    window.localStorage.setItem('mannoosaiSafetyAssessments', JSON.stringify(next));
  };

  const handleClear = () => {
    setValues({
      ph: '',
      ec: '',
      organicCarbon: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      zinc: '',
      iron: '',
      copper: '',
      manganese: '',
      boron: '',
      lead: '',
      cadmium: '',
      arsenic: ''
    });
  };

  const handleClearSaved = () => {
    setSavedAssessments([]);
    window.localStorage.removeItem('mannoosaiSafetyAssessments');
  };

  const handleCopy = async () => {
    const summary = [
      `MannOosai Soil Safety Assessment`,
      `Plot: ${sample.plot}`,
      `Crop: ${sample.crop}`,
      `Sample date: ${sample.sampleDate}`,
      `pH: ${values.ph || 'Not tested'}`,
      `EC: ${values.ec || 'Not tested'} dS/m`,
      `Organic carbon: ${values.organicCarbon || 'Not tested'} %`,
      `Available N: ${values.nitrogen || 'Not tested'} kg/ha`,
      `Available P: ${values.phosphorus || 'Not tested'} kg/ha`,
      `Available K: ${values.potassium || 'Not tested'} kg/ha`,
      `Screening result: ${screeningTitle}`,
      `Out of range / deficient: ${unsafe + deficient}`,
      `Caution: ${caution}`,
      `Not tested: ${notTested}`,
      `MannOosai acoustic events stored: ${acousticEvents.length}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Copy summary error:', error);
    }
  };

  const sectionStyle = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(29, 75, 48, 0.12)',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 8px 28px rgba(20, 55, 35, 0.06)',
    marginBottom: '18px'
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '17px 22px',
    borderBottom: '1px solid rgba(29, 75, 48, 0.08)',
    background: 'rgba(248, 251, 247, 0.82)'
  };

  const sectionTitleStyle = {
    margin: 0,
    fontSize: '11px',
    letterSpacing: '0.18em',
    fontWeight: 700,
    color: '#718078',
    textTransform: 'uppercase'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed'
  };

  const thStyle = {
    padding: '13px 20px',
    textAlign: 'left',
    fontSize: '9px',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#839088',
    fontWeight: 700,
    background: '#fbfcfb',
    borderBottom: '1px solid rgba(29, 75, 48, 0.08)'
  };

  const tdStyle = {
    padding: '13px 20px',
    fontSize: '13px',
    color: '#34423a',
    borderBottom: '1px solid rgba(29, 75, 48, 0.07)',
    verticalAlign: 'middle'
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    height: '38px',
    padding: '0 11px',
    borderRadius: '8px',
    border: '1px solid #cfd9d2',
    background: '#ffffff',
    color: '#29362f',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none'
  };

  const badgeStyle = (status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '25px',
    padding: '0 11px',
    borderRadius: '999px',
    fontSize: '9px',
    letterSpacing: '0.12em',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    background:
      statusClass(status) === 'unsafe' ? '#f9e7e2' :
      statusClass(status) === 'caution' ? '#f7efd7' :
      statusClass(status) === 'untested' ? '#eef3ef' : '#e3f1ea',
    color:
      statusClass(status) === 'unsafe' ? '#a34f42' :
      statusClass(status) === 'caution' ? '#9a7b35' :
      statusClass(status) === 'untested' ? '#7d8b83' : '#287353',
    border:
      `1px solid ${
        statusClass(status) === 'unsafe' ? '#ecc9c0' :
        statusClass(status) === 'caution' ? '#ead8a7' :
        statusClass(status) === 'untested' ? '#dce5de' : '#c7dfd2'
      }`
  });

  const renderInputRow = (rule) => (
    <tr key={rule.key}>
      <td style={tdStyle}>{rule.label}</td>
      <td style={{ ...tdStyle, color: '#8b9890', fontSize: '12px' }}>{rule.unit}</td>
      <td style={tdStyle}>
        <input
          type="number"
          step="any"
          value={values[rule.key]}
          onChange={(event) => setValue(rule.key, event.target.value)}
          placeholder="—"
          style={inputStyle}
        />
      </td>
      <td style={tdStyle}>
        <span style={badgeStyle(rule.status)}>{statusLabel(rule.status)}</span>
      </td>
      <td style={{ ...tdStyle, color: '#829087', fontSize: '11px', lineHeight: 1.55 }}>
        <div>{rule.normal}</div>
        <div>{rule.range}</div>
      </td>
    </tr>
  );

  return (
    <AppShell
      onBack={onBack}
      title="Soil Safety"
      subtitle="Screen soil chemistry using field-test or laboratory values and flag potential concerns before sowing."
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Sample</h3>
            <span style={{ ...badgeStyle('NORMAL'), background: '#f6f8f5', color: '#78857d', borderColor: '#e2e8e3' }}>
              {sample.source === 'Lab report' ? 'LAB REPORT' : 'FIELD TEST'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 1.15fr 1fr 1.15fr 1.2fr',
              gap: '12px',
              padding: '20px 22px'
            }}
          >
            {[
              ['Plot / field', 'plot'],
              ['Sample date', 'sampleDate'],
              ['Depth (cm)', 'depth'],
              ['Intended crop', 'crop']
            ].map(([label, key]) => (
              <label key={key} style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: '10px', color: '#7d8982', marginBottom: '7px' }}>
                  {label}
                </span>
                <input
                  value={sample[key]}
                  onChange={(event) => setSample((current) => ({ ...current, [key]: event.target.value }))}
                  style={inputStyle}
                />
              </label>
            ))}

            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: '10px', color: '#7d8982', marginBottom: '7px' }}>
                Source of values
              </span>
              <select
                value={sample.source}
                onChange={(event) => setSample((current) => ({ ...current, source: event.target.value }))}
                style={inputStyle}
              >
                <option>Field test kit</option>
                <option>Lab report</option>
                <option>Manual entry</option>
              </select>
            </label>
          </div>
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.75fr) minmax(280px, 0.95fr)',
            gap: '18px',
            alignItems: 'start'
          }}
        >
          <section style={{ ...sectionStyle, marginBottom: 0 }}>
            <div style={sectionHeaderStyle}>
              <h3 style={sectionTitleStyle}>Screening result</h3>
              <span style={{ ...badgeStyle(unsafe > 0 ? 'UNSAFE' : caution > 0 || deficient > 0 ? 'CAUTION' : 'NORMAL') }}>
                {unsafe > 0 ? 'CORRECTION NEEDED' : caution > 0 || deficient > 0 ? 'REVIEW' : 'WITHIN RANGE'}
              </span>
            </div>

            <div
              style={{
                padding: '24px 24px 22px',
                background: unsafe > 0
                  ? 'linear-gradient(135deg, #fff5f1, #fffaf8)'
                  : '#f8fbf7'
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontFamily: 'Georgia, serif',
                  fontSize: '28px',
                  lineHeight: 1.1,
                  color: unsafe > 0 ? '#8f392e' : '#286447',
                  fontWeight: 600
                }}
              >
                {screeningTitle}
              </h2>
              <p style={{ margin: 0, color: '#66746c', fontSize: '13px', lineHeight: 1.65 }}>
                {screeningText} {notTested} of {rules.length} parameters were not tested.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid rgba(29, 75, 48, 0.08)'
              }}
            >
              {[
                ['IN RANGE', safe, '#287353'],
                ['CAUTION', caution, '#9a7b35'],
                ['OUT OF RANGE', unsafe + deficient, '#a34f42']
              ].map(([label, count, color]) => (
                <div key={label} style={{ padding: '18px 10px', textAlign: 'center', borderRight: '1px solid rgba(29, 75, 48, 0.08)' }}>
                  <strong style={{ display: 'block', fontFamily: 'Georgia, serif', fontSize: '27px', color }}>
                    {count}
                  </strong>
                  <span style={{ display: 'block', marginTop: '5px', fontSize: '8px', letterSpacing: '0.16em', color: '#8a968f' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Reaction & salinity</h3>
            <span style={{ ...badgeStyle('NORMAL'), background: '#f6f8f5', color: '#78857d', borderColor: '#e2e8e3' }}>
              MANUAL ENTRY
            </span>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '23%' }}>Parameter</th>
                <th style={{ ...thStyle, width: '11%' }}>Unit</th>
                <th style={{ ...thStyle, width: '22%' }}>Value</th>
                <th style={{ ...thStyle, width: '20%' }}>Rating</th>
                <th style={{ ...thStyle, width: '24%' }}>Normal range</th>
              </tr>
            </thead>
            <tbody>
              {rules.slice(0, 2).map(renderInputRow)}
            </tbody>
          </table>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Organic carbon & macronutrients</h3>
            <span style={{ ...badgeStyle('NORMAL'), background: '#f6f8f5', color: '#78857d', borderColor: '#e2e8e3' }}>
              MANUAL ENTRY
            </span>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '23%' }}>Parameter</th>
                <th style={{ ...thStyle, width: '11%' }}>Unit</th>
                <th style={{ ...thStyle, width: '22%' }}>Value</th>
                <th style={{ ...thStyle, width: '20%' }}>Rating</th>
                <th style={{ ...thStyle, width: '24%' }}>Normal range</th>
              </tr>
            </thead>
            <tbody>
              {rules.slice(2, 6).map(renderInputRow)}
            </tbody>
          </table>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Micronutrients (DTPA-extractable)</h3>
            <span style={{ ...badgeStyle('NORMAL'), background: '#f6f8f5', color: '#78857d', borderColor: '#e2e8e3' }}>
              MANUAL ENTRY
            </span>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '23%' }}>Parameter</th>
                <th style={{ ...thStyle, width: '11%' }}>Unit</th>
                <th style={{ ...thStyle, width: '22%' }}>Value</th>
                <th style={{ ...thStyle, width: '20%' }}>Rating</th>
                <th style={{ ...thStyle, width: '24%' }}>Normal range</th>
              </tr>
            </thead>
            <tbody>
              {rules.slice(6, 11).map(renderInputRow)}
            </tbody>
          </table>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Contamination screening</h3>
            <span style={{ ...badgeStyle('NORMAL'), background: '#f6f8f5', color: '#78857d', borderColor: '#e2e8e3' }}>
              LAB REPORT ONLY
            </span>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '23%' }}>Parameter</th>
                <th style={{ ...thStyle, width: '11%' }}>Unit</th>
                <th style={{ ...thStyle, width: '22%' }}>Value</th>
                <th style={{ ...thStyle, width: '20%' }}>Rating</th>
                <th style={{ ...thStyle, width: '24%' }}>Normal range</th>
              </tr>
            </thead>
            <tbody>
              {rules.slice(11).map(renderInputRow)}
            </tbody>
          </table>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Corrective actions</h3>
            <span style={{ fontSize: '10px', color: '#8b968f' }}>GUIDANCE</span>
          </div>

          <div>
            {correctiveActions.length ? correctiveActions.map(([parameter, action, text]) => (
              <div
                key={parameter}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 55px 1fr',
                  gap: '12px',
                  padding: '14px 22px',
                  borderBottom: '1px solid rgba(29, 75, 48, 0.07)',
                  alignItems: 'start'
                }}
              >
                <span style={{ fontSize: '12px', color: '#46534c' }}>{parameter}</span>
                <span style={{ ...badgeStyle(action === 'FIX' ? 'UNSAFE' : 'CAUTION'), padding: '0 9px' }}>
                  {action}
                </span>
                <span style={{ fontSize: '12px', color: '#6f7c74', lineHeight: 1.55 }}>{text}</span>
              </div>
            )) : (
              <div style={{ padding: '18px 22px', color: '#6f7c74', fontSize: '12px' }}>
                No corrective action is currently triggered by the entered values.
              </div>
            )}

            <div style={{ padding: '16px 22px', color: '#8a958e', fontSize: '11px', lineHeight: 1.6 }}>
              These are screening and extension-style guidance prompts only. Confirm application rates with a local agriculture
              office or soil-testing laboratory before applying amendments or nutrients.
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <button
            onClick={handleSave}
            style={{
              border: 0,
              borderRadius: '999px',
              padding: '12px 20px',
              background: '#126846',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 5px 16px rgba(18, 104, 70, 0.18)'
            }}
          >
            Save assessment
          </button>

          <button
            onClick={handleCopy}
            style={{
              border: '1px solid #d2ddd6',
              borderRadius: '999px',
              padding: '11px 19px',
              background: '#fff',
              color: '#405047',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copied ? 'Copied' : 'Copy summary'}
          </button>

          <button
            onClick={handleClear}
            style={{
              border: '1px solid #d2ddd6',
              borderRadius: '999px',
              padding: '11px 19px',
              background: '#fff',
              color: '#405047',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Clear form
          </button>
        </div>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Saved assessments</h3>
            <button
              onClick={handleClearSaved}
              style={{
                border: '1px solid #dbe3dd',
                background: '#fff',
                borderRadius: '999px',
                padding: '6px 12px',
                fontSize: '11px',
                color: '#5e6b63',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...tableStyle, minWidth: '850px' }}>
              <thead>
                <tr>
                  {['Saved', 'Plot', 'Crop', 'pH', 'EC', 'OC %', 'Flags', 'Result'].map((heading) => (
                    <th key={heading} style={thStyle}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savedAssessments.length ? savedAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td style={tdStyle}>{assessment.saved}</td>
                    <td style={tdStyle}>{assessment.plot}</td>
                    <td style={tdStyle}>{assessment.crop}</td>
                    <td style={tdStyle}>{assessment.ph}</td>
                    <td style={tdStyle}>{assessment.ec}</td>
                    <td style={tdStyle}>{assessment.organicCarbon}</td>
                    <td style={tdStyle}>{assessment.flags}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(assessment.result === 'CORRECT' ? 'UNSAFE' : assessment.result === 'REVIEW' ? 'CAUTION' : 'NORMAL')}>
                        {assessment.result}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" style={{ ...tdStyle, textAlign: 'center', color: '#8a958e', padding: '24px' }}>
                      No saved assessments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ color: '#89948d', fontSize: '10px', lineHeight: 1.6, padding: '0 4px 20px' }}>
          MannOosai acoustic sensing and chemical screening are separate measurement layers.
          Entered chemical values should come from a field kit or laboratory result; they are not inferred from the microphone.
        </div>
      </div>
    </AppShell>
  );
}


/* =========================================================
   START REACT
   ========================================================= */

createRoot(
  document.getElementById('root')
).render(
  <App />
)