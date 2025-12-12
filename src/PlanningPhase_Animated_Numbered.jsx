"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Database,
  ClipboardList,
  Users,
  FileText,
  Layers,
  CheckCircle2,
  Sparkles,
  Settings2,
  Send,
  ListChecks,
  ArrowRight,
  ArrowLeft,
  RefreshCcw,
  SlidersHorizontal,
  Target,
  LineChart,
  Download,
  Upload,
} from "lucide-react";

const MAX_ORDER = 24; // highest reveal order we use

// ---------------------------------------------------------------------------
// Supporting standards / documents (tooltip content)
// ---------------------------------------------------------------------------

const SUPPORTING_SOURCES = {
  "developer-1": [
    {
      type: "Standard",
      label:
        "ISO 19650-1:2018 – Concepts and principles for information management over the asset lifecycle",
    },
    {
      type: "Standard",
      label:
        "ISO 19650-2:2018 – Information management for the delivery phase of assets",
    },
    {
      type: "Guideline",
      label:
        "NSW Apartment Design Guide – Design quality principles and apartment brief inputs",
    },
  ],
  "platform-intake": [
    {
      type: "Standard",
      label:
        "ISO 19650-2:2018 – Exchange information requirements and information delivery planning",
    },
    {
      type: "Framework",
      label:
        "RIBA Plan of Work 2020 – Stages 0–2 (Strategic Definition and Preparation and Brief)",
    },
    {
      type: "Code",
      label:
        "NCC 2022 Volume One – Section J (Energy efficiency) and relevant State planning controls",
    },
  ],
  "platform-concepts": [
    {
      type: "Framework",
      label:
        "RIBA Plan of Work 2020 – Brief development and option testing in early stages",
    },
    {
      type: "Guideline",
      label:
        "NSW Apartment Design Guide – Apartment layout, amenity and communal space guidance",
    },
    {
      type: "Guidance",
      label:
        "Build-to-Rent industry best-practice guidance on briefing, amenity mix and service models",
    },
  ],
  "platform-survey": [
    {
      type: "Method",
      label:
        "Dillman, Smyth and Christian – Tailored Design Method for high-quality survey design",
    },
    {
      type: "Guideline",
      label:
        "ESOMAR and AAPOR guidance on ethical, representative social and market research",
    },
  ],
  "platform-thresholds": [
    {
      type: "Guideline",
      label:
        "AAPOR Standard Definitions – Response rates and assessment of non-response bias",
    },
    {
      type: "Guidance",
      label:
        "Best-practice guidance on minimum sample sizes, segmentation and completes for survey validity",
    },
  ],
  "platform-analysis": [
    {
      type: "Standard",
      label:
        "ISO 9001:2015 – Evidence-based decision making and data quality in management systems",
    },
    {
      type: "Method",
      label:
        "Mixed-methods thematic and quantitative analysis of end-user and market data",
    },
  ],
  "residents-input": [
    {
      type: "Guideline",
      label:
        "Post-occupancy evaluation and resident feedback guidance (e.g. Building Use Studies, BCO POE guidance)",
    },
    {
      type: "Framework",
      label:
        "Co-design and participatory design frameworks for housing and communities",
    },
  ],
  "validate-brief": [
    {
      type: "Framework",
      label:
        "RIBA Plan of Work 2020 – Briefing gateways and design freeze milestones",
    },
    {
      type: "Guideline",
      label:
        "Client design management guidance on formal brief approval and change control",
    },
  ],
};

// ---------------------------------------------------------------------------
// Mapping from reveal order → DB I/O highlight
// (kept as “>= trigger” so the pill stays lit once triggered)
// ---------------------------------------------------------------------------

const DB_EVENTS = {
  // Step 3 – intake and configuration mapping writes config to L1
  l1_config_write: 3,

  //  approval (around step 20–22) writes  brief to L1
  l1_final_write: 23,

  // Step 9 – residents or panels respond → write to L2
  l2_responses_write: 9,

  // Step 10 – threshold check reads from L2
  l2_threshold_read: 10,

  // Step 11 – analysis and insight synthesis writes to L3
  l3_insight_write: 11,

  // Step 13 – draft brief writes to L3
  l3_draft_write: 13,

  // Step 4 – concept and topic generation reads reference patterns from L6
  l6_reference_read: 4,

  // Outcome (step 23) → project learning written back to L6
  l6_learning_update: 23,
};

const isDbActive = (eventKey, currentStep) => {
  const trigger = DB_EVENTS[eventKey];
  if (!trigger) return false;
  return currentStep >= trigger;
};

// ---------------------------------------------------------------------------
// Small UI helpers (same pattern as Design phase)
// ---------------------------------------------------------------------------

const NumberBadge = ({ n, color = "gray" }) => (
  <span className={`badge-circle badge-${color}`}>{n}</span>
);

const TimeTag = ({ label }) => <span className="time-tag">{label}</span>;

const Card = ({ color, title, icon, stepNo, children, supportKey, detail }) => {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false); // for tap on mobile
  const sources = supportKey ? SUPPORTING_SOURCES[supportKey] : null;

  const showTooltip = (hovered || open) && (detail || sources);

  return (
    <div
      className={`card card-${color}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setOpen((prev) => !prev)}
    >
      <div className="card-header">
        <div className="card-header-left">
          {stepNo != null && <NumberBadge n={stepNo} color={color} />}
          <div className={`card-title card-title-${color}`}>{title}</div>
        </div>
        {icon && <div className="card-icon">{icon}</div>}
      </div>

      {/* Short, always-visible content */}
      {children}

      {/* Tooltip with detail + standards */}
      {showTooltip && (
        <div className="support-tooltip">
          {detail && (
            <>
              <div className="support-title">Process explanation</div>
              <div className="support-detail">{detail}</div>
            </>
          )}
          {sources && (
            <>
              <div
                className="support-title"
                style={{ marginTop: detail ? 6 : 0 }}
              >
                Supporting standards and documents
              </div>
              <ul className="support-list">
                {sources.map((src) => (
                  <li key={src.label}>
                    <span className="support-type">{src.type}:</span>{" "}
                    <span className="support-link">{src.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ArrowLine = ({ color, n, reverse }) => (
  <div className="arrow-line">
    {reverse ? (
      <ArrowLeft className={`arrow-icon arrow-${color}`} size={26} />
    ) : (
      <ArrowRight className={`arrow-icon arrow-${color}`} size={26} />
    )}
    {n != null && <NumberBadge n={n} color={color} />}
  </div>
);

// Step component: same tooltip behaviour as Design phase
const Step = ({ icon, label, detail, stepNo, supportKey }) => {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false); // for mobile tap
  const sources = supportKey ? SUPPORTING_SOURCES[supportKey] : null;

  const showTooltip = (hovered || open) && (detail || sources);

  return (
    <div
      className="step-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setOpen((prev) => !prev)}
    >
      <NumberBadge n={stepNo} color="blue" />
      <div className="step-icon">{icon}</div>
      <div>
        {/* Brief label shown on screen */}
        <div className="step-label">{label}</div>

        {/* Detail + standards only appear in the tooltip */}
        {showTooltip && (
          <div className="support-tooltip">
            {detail && (
              <>
                <div className="support-title">Process explanation</div>
                <p>{detail}</p>
              </>
            )}
            {sources && (
              <>
                <div
                  className="support-title"
                  style={{ marginTop: detail ? 6 : 0 }}
                >
                  Supporting standards and documents
                </div>
                <ul className="support-list">
                  {sources.map((src) => (
                    <li key={src.label}>
                      <span className="support-type">{src.type}:</span>{" "}
                      <span className="support-link">{src.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Reveal: same animation behaviour as the Design phase
const Reveal = ({ order, currentStep, resetToken, children }) => {
  const [hasAppeared, setHasAppeared] = useState(false);

  // Reset when replay is triggered
  useEffect(() => {
    setHasAppeared(false);
  }, [resetToken]);

  useEffect(() => {
    if (!hasAppeared && currentStep >= order) {
      setHasAppeared(true);
    }
  }, [currentStep, hasAppeared, order]);

  return (
    <motion.div
      className="reveal-block"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: hasAppeared ? 1 : 0.15, y: hasAppeared ? 0 : 8 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT – PLANNING PHASE (Phase One)
// ---------------------------------------------------------------------------

export default function PlanningPhase_Animated_Numbered() {
  const [isPlaying, setIsPlaying] = useState(true); // match Design phase default
  const [deliveryModel, setDeliveryModel] = useState("BTS"); // "BTS" or "BTR"
  const [currentStep, setCurrentStep] = useState(0); // numeric reveal step
  const [resetToken, setResetToken] = useState(0);

  const isBTR = deliveryModel === "BTR";

  // Step-by-step reveal logic – copied timing from Design phase
  useEffect(() => {
    if (!isPlaying) return;

    let timeout;

    const tick = () => {
      setCurrentStep((prev) => {
        const next = prev >= MAX_ORDER ? MAX_ORDER : prev + 1;
        return next;
      });
      timeout = window.setTimeout(tick, 1100);
    };

    timeout = window.setTimeout(tick, 900);

    return () => window.clearTimeout(timeout);
  }, [isPlaying]);

  const handleReplay = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setResetToken((prev) => prev + 1);
    setTimeout(() => setIsPlaying(true), 80);
  };

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <div className="page">
      <div className="page-inner">
        {/* Header */}
        <div className="header">
          <div className="header-main">
            <h1 className="header-title">Phase One — Live Process</h1>
            <p className="header-subtitle">
              Left→Right flow showing how the <b>digital platform</b> orchestrates
              inputs and feedback to produce an <b>approved Design Brief</b>.
            </p>
            <div className="badge-row">
              <span className="badge-pill">
                Delivery model:{" "}
                {isBTR ? "Build to Rent (BTR)" : "Build to Sell (BTS / strata)"}
              </span>
              <TimeTag label="Phase time-box: approximately 6–8 weeks in total" />
            </div>
          </div>

          <div className="header-controls">
            <button className="btn btn-play" onClick={() => setIsPlaying(true)}>
              <Play size={16} /> <span>Play</span>
            </button>
            <button className="btn btn-pause" onClick={() => setIsPlaying(false)}>
              <Pause size={16} /> <span>Pause</span>
            </button>
            <button className="btn btn-replay" onClick={handleReplay}>
              <RotateCcw size={16} /> <span>Replay</span>
            </button>
          </div>
        </div>

        {/* Guidance + legend */}
        <div className="guidance-panel">
          <div className="guidance-text">
            <p>
              <b>How to use this view</b>: 1) Choose a <b>delivery model</b> (BTS or
              BTR). 2) Press <b>Replay</b> to see the sequence for that model. 3)
              Move your mouse (or tap on a touch screen) over any <b>process card</b>{" "}
              or <b>step</b> to see the full process explanation and the supporting
              standards.
            </p>
          </div>

          <div className="legend">
            <div className="legend-item">
              <span className="legend-swatch legend-swatch-developer" />
              <span>Developer (yellow)</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-swatch-digital" />
              <span>Digital platform (blue)</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-swatch-advisory" />
              <span>Advisory / design / consultants (green)</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-swatch-enduser" />
              <span>End users and operational team (purple)</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-swatch-db" />
              <span>Active database layers (L1, L2, L3, L6)</span>
            </div>
          </div>
        </div>

        {/* Delivery model gate + summary */}
        <div className="gate-grid">
          <div className="card card-yellow">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title card-title-yellow">
                  <Sparkles size={16} /> Delivery Model Configuration Gate
                </div>
              </div>
              <TimeTag label="Decision at Week 0" />
            </div>
            <p className="card-text">
              The platform cannot proceed until a <b>delivery model</b> is selected.
              This gate configures who is consulted, which survey templates are used,
              stakeholder weighting, and which precedent projects the Knowledge Hub
              draws on.
            </p>
            <div className="button-row">
              <button
                onClick={() => setDeliveryModel("BTS")}
                className={
                  !isBTR
                    ? "choice-btn choice-btn-active-bts"
                    : "choice-btn choice-btn-inactive-bts"
                }
              >
                Build to Sell (BTS)
              </button>
              <button
                onClick={() => setDeliveryModel("BTR")}
                className={
                  isBTR
                    ? "choice-btn choice-btn-active-btr"
                    : "choice-btn choice-btn-inactive-btr"
                }
              >
                Build to Rent (BTR)
              </button>
            </div>
            <p className="helper-text">
              By default, the flow starts with <b>BTS</b>. Click <b>BTR</b> and press{" "}
              <b>Replay</b> to see how the same workflow is re-interpreted for Build
              to Rent.
            </p>
          </div>

          <div className="card card-blue">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title card-title-blue">
                  Phase summary — how the platform adapts
                </div>
              </div>
              <div className="card-icon">
                <Database size={18} />
              </div>
            </div>
            <p className="card-text">
              <b>1. Who is consulted and when.</b>{" "}
              {isBTR ? (
                <>
                  Future residents and the on-site operational team are involved
                  early. Operational voices play a strong role in defining
                  objectives, service models and performance concepts.
                </>
              ) : (
                <>
                  Engagement focuses on market research panels, buyer personas and
                  sales or marketing inputs. Operational teams and residents mainly
                  appear through proxy data and precedents.
                </>
              )}
            </p>
            <p className="card-text">
              <b>2. Survey templates and question focus.</b>{" "}
              {isBTR ? (
                <>
                  Question banks emphasise shared amenities, service levels,
                  long-term comfort and community features.
                </>
              ) : (
                <>
                  Instruments emphasise private fit-out options, car parking,
                  storage, views and finishes.
                </>
              )}
            </p>
            <p className="card-text">
              <b>3. Precedent data.</b>{" "}
              {isBTR ? (
                <>
                  Benchmarking draws from previous Build to Rent and comparable
                  rental assets, with a focus on long-term operation and resident
                  experience.
                </>
              ) : (
                <>
                  Benchmarking draws from strata and for-sale apartment schemes
                  with comparable market positioning.
                </>
              )}
            </p>
            <p className="card-text">
              <b>4. Role of telemetry.</b> In both models, survey responses are
              triangulated with behavioural data (for example amenity bookings,
              access logs, digital enquiry funnels or clickstream analytics) before
              they inform design conclusions.
            </p>
          </div>
        </div>

        {/* Main layout */}
        <div className="layout">
          {/* LEFT: main content */}
          <div className="main-panel">
            <div className="columns">
              {/* Developer column */}
              <div className="col">
                <Reveal
                  order={1}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="yellow"
                    title="Developer (Responsible)"
                    icon={<Sparkles />}
                    stepNo={1}
                    supportKey="developer-1"
                    detail={
                      <ul className="card-list">
                        <li>
                          Sets objectives and key performance indicators aligned to{" "}
                          {deliveryModel}.
                        </li>
                        <li>
                          Defines project profile, tenure, budget and key constraints.
                        </li>
                        <li>
                          Reviews precedent projects for {deliveryModel} from the
                          Knowledge Hub and other sources.
                        </li>
                        <li>
                          Sets thresholds for minimum sample sizes, target segments and
                          maximum consultation weeks.
                        </li>
                      </ul>
                    }
                  >
                    <p className="card-text">
                      Sets objectives, constraints and sampling thresholds for{" "}
                      {deliveryModel}.
                    </p>
                    <TimeTag label="Time-box: 1–2 weeks" />
                  </Card>
                </Reveal>

                <Reveal
                  order={2}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  {/* Arrow kept but without a process number */}
                  <ArrowLine color="yellow" />
                </Reveal>

                <Reveal
                  order={12}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="yellow"
                    title="Insight Review and Direction"
                    icon={<ListChecks />}
                    stepNo={12}
                    detail={
                      <p className="card-text">
                        Reviews the insight pack generated from end-user and market
                        data <b>before</b> it is embedded in the draft brief or
                        triggers substantive design work. Only once the client accepts
                        the evidence-based direction does the platform proceed to
                        briefing. This step ensures that subsequent design effort is
                        aligned with agreed priorities.
                      </p>
                    }
                  >
                    <p className="card-text">
                      Reviews the insight pack before it is embedded in the brief.
                    </p>
                    <TimeTag label="Up to 1-week review" />
                  </Card>
                </Reveal>

                <Reveal
                  order={16}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="yellow"
                    title="Developer Review of Draft Brief"
                    icon={<FileText />}
                    stepNo={16}
                    detail={
                      <p className="card-text">
                        Checks alignment of the draft brief with agreed objectives and
                        commercial, operational and regulatory constraints. The
                        developer may request one bounded recalibration loop if there
                        are material issues, but the process remains time-boxed to
                        avoid open-ended iteration.
                      </p>
                    }
                  >
                    <p className="card-text">
                      Checks the draft brief against objectives and constraints.
                    </p>
                    <TimeTag label="Up to 1 week" />
                  </Card>
                </Reveal>

                <Reveal
                  order={22}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="yellow"
                    title="Final Approval"
                    icon={<CheckCircle2 />}
                    stepNo={22}
                    detail={
                      <p className="card-text">
                        Approves the Final Design Brief for {deliveryModel} and locks
                        the record for the Design Stage. After this gateway (G1),
                        further changes are controlled through formal change
                        management rather than open re-briefing.
                      </p>
                    }
                  >
                    <p className="card-text">
                      Approves and locks the Final Design Brief. s
                    </p>
                    <TimeTag label="Gateway G1 – brief locked" />
                  </Card>
                </Reveal>
              </div>

              {/* Platform column */}
              <div className="col col-wide">
                <Card color="blue" title="Digital Platform" icon={<Database />}>
                  <div>
                    <Reveal
                      order={3}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={3}
                        icon={<SlidersHorizontal size={18} />}
                        label="Intake & configuration mapping"
                        detail={`Maps the developer's objectives, the chosen delivery model (${deliveryModel}) and the statutory context into structured data schemas so the platform can orchestrate surveys, telemetry and brief outputs in a consistent way.`}
                        supportKey="platform-intake"
                      />
                    </Reveal>

                    <Reveal
                      order={4}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={4}
                        icon={<Sparkles size={18} />}
                        label="Concept & topic generation"
                        detail={
                          isBTR
                            ? "Generates Build to Rent concepts around services, shared amenities, long-term comfort and operational models, framed so that they can be tested with residents and the operational team."
                            : "Generates Build to Sell concepts around sales positioning, finishes, unit mix, parking and resale value, framed so that they can be tested with market panels and sales or marketing teams."
                        }
                        supportKey="platform-concepts"
                      />
                    </Reveal>

                    <Reveal
                      order={7}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={7}
                        icon={<ClipboardList size={18} />}
                        label="Survey & instrument builder"
                        detail={
                          isBTR
                            ? "Builds surveys and instruments that emphasise shared spaces, operational service levels, comfort and community features, while respecting good survey design practice."
                            : "Builds surveys and instruments that emphasise private fit-out, car parking, views, storage and finishes, while respecting good survey design practice."
                        }
                        supportKey="platform-survey"
                      />
                    </Reveal>

                    <Reveal
                      order={8}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={8}
                        icon={<Send size={18} />}
                        label="Distribution"
                        detail={
                          isBTR
                            ? "Distributes the instruments to prospective renters and the operational team through CRM, property-management and community channels."
                            : "Distributes the instruments to buyer panels, project website visitors, display-suite attendees and agent databases."
                        }
                      />
                    </Reveal>

                    <Reveal
                      order={10}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={10}
                        icon={<ListChecks size={18} />}
                        label="Threshold & triangulation monitor"
                        detail={
                          isBTR
                            ? "Monitors minimum completes per cohort and triangulates survey responses with amenity bookings, access logs and Wi-Fi presence to reduce bias and noise."
                            : "Monitors minimum completes per segment and triangulates survey responses with clickstream data, enquiry funnels and display-suite bookings to reduce bias and noise."
                        }
                        supportKey="platform-thresholds"
                      />
                    </Reveal>

                    <Reveal
                      order={11}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={11}
                        icon={<LineChart size={18} />}
                        label="Analysis & insight synthesis"
                        detail="Cleans the data, clusters patterns, ranks priorities and generates a structured insight pack for the developer, including trade-offs and confidence levels."
                        supportKey="platform-analysis"
                      />
                    </Reveal>

                    <Reveal
                      order={13}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={13}
                        icon={<FileText size={18} />}
                        label="Draft design brief"
                        detail="Generates a structured draft design brief with rationale and traceability, only after the developer has approved the insight pack."
                      />
                    </Reveal>

                    {/* Recalibration steps – these embody the platform + stakeholder loops */}
                    <Reveal
                      order={18}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={"18"}
                        icon={<RefreshCcw size={18} />}
                        label="Regenerate survey"
                        detail="Auto-tunes questions and targeting based on gaps, noise and bias diagnostics during the recalibration window."
                      />
                    </Reveal>

                    <Reveal
                      order={19}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={"19"}
                        icon={<Send size={18} />}
                        label="Re-distribute (update)"
                        detail="Sends an additional, time-bounded survey round targeting under-represented cohorts. Only one extra round is allowed within the time-box."
                      />
                    </Reveal>

                    <Reveal
                      order={20}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={"20"}
                        icon={<Users size={18} />}
                        label="Additional responses"
                        detail="Collects short, focused micro-pulses to close representativeness gaps without opening up an indefinite consultation period."
                      />
                    </Reveal>

                    <Reveal
                      order={21}
                      currentStep={currentStep}
                      resetToken={resetToken}
                    >
                      <Step
                        stepNo={"21"}
                        icon={<LineChart size={18} />}
                        label="Re-analyse & merge"
                        detail="Re-analyses the combined data and updates priorities and confidence levels. Earlier versions remain stored in the Knowledge Hub."
                      />
                    </Reveal>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <TimeTag label="Time-box: 3–4 weeks (survey, fieldwork and analysis)" />
                  </div>
                </Card>

                {/* Note: PlatformLoop and StakeholderLoop SVGs removed; 
                    their logic is now embodied in the recalibration steps above. */}

                <Reveal
                  order={23}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <div className="outcome-strip">
                    <div className="outcome-text">
                      <b>Outcome:</b> Final {deliveryModel} Design Brief stored;
                      hand-off to the <b>Design Stage</b> with a time-boxed,
                      evidence-backed record.
                    </div>
                    <div className="outcome-count">
                      Status: {isPlaying ? "Playing" : "Paused"}
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Advisory column */}
              <div className="col">
                <Reveal
                  order={6}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="green"
                    title="Advisory, Design and Specialist Consultants"
                    icon={<Users />}
                    stepNo={5}
                    detail={
                      <ul className="card-list">
                        <li>
                          Design lead, sustainability, services, cost, access,
                          acoustics and other consultants perform a light-touch check
                          on concepts and constraints.
                        </li>
                        <li>
                          Marketing and sales teams advise on market positioning and
                          product concepts (especially in Build to Sell schemes).
                        </li>
                        <li>
                          Statutory and approvals advisers ensure alignment with
                          likely planning and building requirements before
                          instruments go live.
                        </li>
                        <li>
                          Substantive design effort is deferred until the developer
                          approves the insight pack, to avoid re-work.
                        </li>
                      </ul>
                    }
                  >
                    <p className="card-text">
                      Performs a light-touch review of concepts and constraints.
                    </p>
                    <TimeTag label="3–5 days per advisory pass" />
                  </Card>
                </Reveal>

                <Reveal
                  order={13}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  {/* Arrow kept but without a process number */}
                  <ArrowLine color="green" />
                </Reveal>

                <Reveal
                  order={14}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="green"
                    title="Brief Gate (Design and Commercial Review)"
                    icon={<FileText />}
                    stepNo={14}
                    detail={
                      <p className="card-text">
                        Once the developer has accepted the insight pack and a draft
                        brief is generated, advisory, design, marketing or sales and
                        key consultants review it together, checking
                        constructability, commercial fit and operational
                        implications. This is the main opportunity to identify major
                        risks before design work accelerates.
                      </p>
                    }
                  >
                    <p className="card-text">
                      Joint review of the draft brief by design and commercial teams.
                    </p>
                    <TimeTag label="Up to 1 week" />
                  </Card>
                </Reveal>

                <Reveal
                  order={14}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="green"
                    title="Statutory Context (Approvals Authority)"
                    icon={<FileText />}
                    detail={
                      <p className="card-text">
                        Statutory instruments and approvals (for example planning
                        controls and NCC 2022 requirements) impose constraints on
                        parking, thermal performance and sustainability. These are
                        treated as configuration inputs for the platform and are
                        re-checked at each brief gate.
                      </p>
                    }
                  >
                    <p className="card-text">
                      Planning controls and NCC requirements set key constraints.
                    </p>
                  </Card>
                </Reveal>
              </div>

              {/* End users column */}
              <div className="col">
                <Reveal
                  order={9}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="purple"
                    title={
                      isBTR
                        ? "Future Residents and Operational Team"
                        : "Market Panels and Buyer Personas"
                    }
                    icon={<Users />}
                    stepNo={9}
                    supportKey="residents-input"
                    detail={
                      isBTR ? (
                        <ul className="card-list">
                          <li>
                            Respond on layouts, amenities, services and community
                            features.
                          </li>
                          <li>
                            Provide trade-offs between rent, comfort and facilities.
                          </li>
                          <li>
                            Operational teams contribute requirements for servicing,
                            maintenance and lifecycle performance.
                          </li>
                          <li>
                            Typical completes may be a small fraction of residents;
                            the platform therefore treats responses as one input to
                            be triangulated, rather than a complete census.
                          </li>
                        </ul>
                      ) : (
                        <ul className="card-list">
                          <li>
                            Respond on finishes, parking, price points, storage and
                            perceptions of value.
                          </li>
                          <li>
                            Express preferences as proxies for future buyers and
                            investors.
                          </li>
                          <li>
                            Sample sizes are modest relative to the sales universe,
                            so survey outputs are combined with digital funnel and
                            transaction data.
                          </li>
                        </ul>
                      )
                    }
                  >
                    <p className="card-text">
                      Provides end-user or market input on value, layouts and
                      amenities.
                    </p>
                    <TimeTag label="Fieldwork: 10–21 days" />
                  </Card>
                </Reveal>

                <Reveal
                  order={15}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  {/* Arrow kept but without a process number */}
                  <ArrowLine color="green" />
                </Reveal>

                <Reveal
                  order={16}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="purple"
                    title={
                      isBTR
                        ? "Validate Draft Brief (Residents and Operational Team)"
                        : "Validate Draft Brief (Market-facing)"
                    }
                    icon={<ListChecks />}
                    stepNo={17}
                    supportKey="validate-brief"
                    detail={
                      <p className="card-text">
                        Runs a short, structured validation of the draft brief using
                        accessible prompts and time-bounded response windows.
                        Feedback is captured as part of the evaluation record and
                        written back to the design feedback layer, strengthening the
                        evidence base for the final brief.
                      </p>
                    }
                  >
                    <p className="card-text">
                      Runs a short validation of the draft brief.
                    </p>
                  </Card>
                </Reveal>

                <Reveal
                  order={17}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  {/* Arrow kept but without a process number */}
                  <ArrowLine color="purple" />
                </Reveal>
              </div>
            </div>
          </div>

          {/* RIGHT: sticky side panel (unchanged information, same DB events) */}
          <div className="side-panel">
            <div className="side-card">
              <div className="side-header">
                <div className="side-header-main">
                  <Layers size={16} />
                  <span>Active Layers and Database I/O (Phase One)</span>
                </div>
                <div className="side-header-sub">Active: L1, L2, L3, L6</div>
              </div>

              {/* L1 */}
              <div className="side-section">
                <div className="layer-title">
                  <Layers size={12} /> L1 — Project Input and Configuration
                </div>
                <div className="io-row">
                  <div
                    className={
                      "io-pill io-pill-write" +
                      (isDbActive("l1_config_write", currentStep)
                        ? " io-pill-active"
                        : "")
                    }
                  >
                    <Upload size={12} />
                    <span className="io-pill-label">WRITE</span>
                    <span>Configuration (including delivery model)</span>
                  </div>
                  <div
                    className={
                      "io-pill io-pill-write" +
                      (isDbActive("l1_final_write", currentStep)
                        ? " io-pill-active"
                        : "")
                    }
                  >
                    <Upload size={12} />
                    <span className="io-pill-label">WRITE</span>
                    <span>Final Design Brief ({deliveryModel})</span>
                  </div>
                </div>
              </div>

              {/* L2 */}
              <div className="side-section">
                <div className="layer-title">
                  <Layers size={12} /> L2 — End-User and Operational Input /
                  Market Panels
                </div>
                <div className="io-row">
                  <div
                    className={
                      "io-pill io-pill-write" +
                      (isDbActive("l2_responses_write", currentStep)
                        ? " io-pill-active"
                        : "")
                    }
                  >
                    <Upload size={12} />
                    <span className="io-pill-label">WRITE</span>
                    <span>
                      {isBTR ? "Resident and operational" : "Market"} responses
                    </span>
                  </div>
                  <div
                    className={
                      "io-pill io-pill-read" +
                      (isDbActive("l2_threshold_read", currentStep)
                        ? " io-pill-active"
                        : "")
                    }
                  >
                    <Download size={12} />
                    <span className="io-pill-label">READ</span>
                    <span>Threshold and triangulation checks</span>
                  </div>
                </div>
              </div>

              {/* L3 */}
              <div className="side-section">
                <div className="layer-title">
                  <Layers size={12} /> L3 — Design Feedback and Evaluation
                </div>
                <div className="io-row">
                  <div
                    className={
                      "io-pill io-pill-write" +
                      (isDbActive("l3_insight_write", currentStep)
                        ? " io-pill-active"
                        : "")
                    }
                  >
                    <Upload size={12} />
                    <span className="io-pill-label">WRITE</span>
                    <span>Insight pack and priorities</span>
                  </div>
                  <div
                    className={
                      "io-pill io-pill-write" +
                      (isDbActive("l3_draft_write", currentStep)
                        ? " io-pill-active"
                        : "")
                    }
                  >
                    <Upload size={12} />
                    <span className="io-pill-label">WRITE</span>
                    <span>Draft brief (post-insight approval)</span>
                  </div>
                </div>
              </div>

              {/* L6 */}
              <div className="side-section">
                <div className="layer-title">
                  <Layers size={12} /> L6 — Knowledge Hub and Meta-Analytics
                </div>
                <div className="io-row">
                  <div
                    className={
                      "io-pill io-pill-read" +
                      (isDbActive("l6_reference_read", currentStep)
                        ? " io-pill-active"
                        : "")
                    }
                  >
                    <Download size={12} />
                    <span className="io-pill-label">READ</span>
                    <span>
                      Reference concepts and patterns ({deliveryModel})
                    </span>
                  </div>
                  <div
                    className={
                      "io-pill io-pill-update" +
                      (isDbActive("l6_learning_update", currentStep)
                        ? " io-pill-active"
                        : "")
                    }
                  >
                    <RefreshCcw size={12} />
                    <span className="io-pill-label">UPDATE</span>
                    <span>Learning from project and final brief</span>
                  </div>
                </div>
              </div>

              <div className="side-footnote">
                Layers 4, 5 and 7 remain passive in this stage and are
                activated in later stages.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
