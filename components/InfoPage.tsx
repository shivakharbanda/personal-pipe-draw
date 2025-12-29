import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Zap, Shield, ArrowLeft } from 'lucide-react';
import Layout from './Layout';

interface InfoPageProps {
  onNavigateBack: () => void;
}

const InfoPage: React.FC<InfoPageProps> = ({ onNavigateBack }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={onNavigateBack}
          className="mb-8 flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Analysis</span>
        </button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 border border-blue-600/30 rounded-full text-blue-600 font-bold text-sm uppercase tracking-wider mb-6">
            🚀 Enterprise AI Solution for Engineering Excellence
          </div>
          <h1 className="text-5xl font-black text-neutral-900 mb-6 leading-tight">
            Transform P&ID Validation:<br />
            <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              From 4 Hours to Under 5 Minutes
            </span>
          </h1>
          <p className="text-xl text-neutral-700 max-w-4xl mx-auto leading-relaxed mb-12">
            Fluor's GenAI-powered P&ID Error Detection system revolutionizes engineering drawing validation.
            Automatically detect errors, validate ASME/API/ISA compliance, and generate corrected drawings—
            saving <strong>5,900 engineering hours</strong> and <strong>$450,000 annually</strong>.
          </p>

          {/* Hero Stats - 4 Cards */}
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">98%</div>
              <div className="text-sm font-semibold text-neutral-900 mb-1">Time Reduction</div>
              <div className="text-xs text-neutral-600">4-6 hours → 1-5 minutes</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">92%</div>
              <div className="text-sm font-semibold text-neutral-900 mb-1">Detection Accuracy</div>
              <div className="text-xs text-neutral-600">With &lt;4% false positives</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">$450K</div>
              <div className="text-sm font-semibold text-neutral-900 mb-1">Annual Savings</div>
              <div className="text-xs text-neutral-600">Based on 1,000 drawings/year</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">100%</div>
              <div className="text-sm font-semibold text-neutral-900 mb-1">Safety Coverage</div>
              <div className="text-xs text-neutral-600">All critical issues caught</div>
            </div>
          </div>
        </div>

        {/* Business Problem Section */}
        <section className="bg-white rounded-lg p-8 mb-8 border border-neutral-300 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Business Problem: Manual P&ID Review Bottleneck</h2>
          <p className="text-neutral-700 mb-8">
            Engineering teams face severe challenges with manual P&ID validation, resulting in safety risks, cost overruns, and project delays.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Critical Challenges */}
            <div className="bg-red-50 p-6 rounded-lg border border-red-600/30">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} />
                Critical Challenges
              </h3>
              <ul className="space-y-3 text-neutral-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">✗</span>
                  <div>
                    <strong>Time-Intensive Process:</strong> Engineers spend 4-6 hours manually reviewing each P&ID
                    <span className="ml-2 inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">4-6 hrs/drawing</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">✗</span>
                  <div>
                    <strong>High Error Rate:</strong> 15% of errors are missed during manual validation
                    <span className="ml-2 inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">15% miss rate</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">✗</span>
                  <div>
                    <strong>Expensive Review:</strong> Each drawing costs $500-800 to validate manually
                    <span className="ml-2 inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">$500-800/drawing</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">✗</span>
                  <div><strong>Safety Violations:</strong> Missing relief valves, inadequate venting, wrong materials</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">✗</span>
                  <div><strong>Code Non-Compliance:</strong> ASME, API, ISA standard violations</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">✗</span>
                  <div>
                    <strong>Resource Constraint:</strong> Senior engineers spend 60%+ time on routine validation
                    <span className="ml-2 inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">60% time drain</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Business Impact */}
            <div className="bg-amber-50 p-6 rounded-lg border border-amber-600/30">
              <h3 className="text-lg font-semibold text-amber-700 mb-4 flex items-center gap-2">
                💰 Business Impact
              </h3>
              <ul className="space-y-3 text-neutral-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">⚠</span>
                  <div>
                    <strong>Schedule Delays:</strong> Rework during construction adds 2-4 weeks per major issue
                    <span className="ml-2 inline-block bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">+2-4 weeks</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">⚠</span>
                  <div>
                    <strong>Cost Overruns:</strong> Change orders average $50K-200K per significant error
                    <span className="ml-2 inline-block bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">$50K-200K</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">⚠</span>
                  <div><strong>Safety Incidents:</strong> Design flaws can lead to regulatory violations and shutdowns</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">⚠</span>
                  <div><strong>Competitive Impact:</strong> Delays affect bid competitiveness and project margins</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">⚠</span>
                  <div><strong>Scalability Issues:</strong> Cannot process drawings fast enough for large projects</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">⚠</span>
                  <div><strong>Knowledge Dependency:</strong> Reliance on senior engineer availability and expertise</div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Solution Architecture Section */}
        <section className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-8 mb-8 border border-blue-600/20">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4 text-center">GenAI Solution Architecture</h2>
          <p className="text-center text-neutral-700 mb-8">
            4-Step Automated Pipeline Powered by Computer Vision, LLM, and Rules Engine
          </p>

          {/* 4-Step Pipeline */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-3xl">📤</span>
                <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
              </div>
              <h3 className="text-sm font-bold text-blue-600 mb-2 uppercase">Upload & Preprocess</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Image enhancement, noise reduction, contrast adjustment, and standardization to 300 DPI format
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm text-center">
              <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-3xl">🔍</span>
                <div className="absolute -top-1 -right-1 bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
              </div>
              <h3 className="text-sm font-bold text-teal-600 mb-2 uppercase">AI Recognition</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                YOLOv8 detects 120+ symbol types (96.8% accuracy), Tesseract OCR extracts text, NetworkX builds connectivity graph
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm text-center">
              <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-3xl">⚠️</span>
                <div className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
              </div>
              <h3 className="text-sm font-bold text-amber-600 mb-2 uppercase">Error Detection</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Rules engine validates 1,000+ ASME/API/ISA standards, Claude Sonnet 4 handles complex context-aware validation
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm text-center">
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-3xl">✨</span>
                <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
              </div>
              <h3 className="text-sm font-bold text-green-600 mb-2 uppercase">Auto-Correction</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Generate corrected drawings using ezdxf/AutoCAD API, create professional redlines and comprehensive PDF reports
              </p>
            </div>
          </div>

          {/* Tech Stack Grid */}
          <div className="bg-white rounded-lg p-6 border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 text-center">Technology Stack</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">PyTorch</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">YOLOv8</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">Tesseract</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">Gemini</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">Claude 4</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">OpenCV</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">NetworkX</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">Neo4j</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">FastAPI</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">PostgreSQL</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">ezdxf</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">AutoCAD API</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">Docker</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">Kubernetes</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">AWS</div>
              <div className="bg-blue-50 border border-blue-600/20 px-3 py-2 rounded-lg text-center text-sm font-semibold text-blue-700">Prometheus</div>
            </div>
          </div>
        </section>

        {/* Technical Deep Dive (Collapsible) */}
        <section className="bg-white rounded-lg p-8 mb-8 border border-neutral-300 shadow-sm">
          <button
            onClick={() => toggleSection('technical')}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-2xl font-bold text-neutral-900">Technical Deep Dive</h2>
            {expandedSection === 'technical' ? (
              <ChevronUp className="text-blue-600" size={24} />
            ) : (
              <ChevronDown className="text-blue-600" size={24} />
            )}
          </button>

          {expandedSection === 'technical' && (
            <div className="mt-6 space-y-6">
              {/* Component Recognition */}
              <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">
                  Component Recognition Pipeline
                </h3>
                <div className="space-y-3 text-neutral-700 text-sm">
                  <p>
                    <strong className="text-neutral-900">Symbol Detection:</strong> Uses advanced
                    computer vision to identify 120+ component types including valves, pumps,
                    vessels, and instruments.
                  </p>
                  <p>
                    <strong className="text-neutral-900">OCR Extraction:</strong> Reads equipment
                    tags, line numbers, and specifications with 94%+ accuracy.
                  </p>
                  <p>
                    <strong className="text-neutral-900">Connection Mapping:</strong> Builds a
                    process flow graph to understand piping connections and flow paths.
                  </p>
                </div>
              </div>

              {/* Error Detection */}
              <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">
                  Error Detection Methods
                </h3>
                <div className="space-y-3 text-neutral-700 text-sm">
                  <p>
                    <strong className="text-neutral-900">Code Violations:</strong> Validates against
                    ASME, API, and ISA standards using a rules engine.
                  </p>
                  <p>
                    <strong className="text-neutral-900">Design Inconsistencies:</strong> Graph
                    analysis detects flow conflicts, pressure mismatches, and logic errors.
                  </p>
                  <p>
                    <strong className="text-neutral-900">Safety Checks:</strong> Identifies missing
                    safety equipment like relief valves, emergency shutdowns, and venting.
                  </p>
                  <p>
                    <strong className="text-neutral-900">AI Reasoning:</strong> LLM-based validation
                    for complex, context-dependent engineering decisions.
                  </p>
                </div>
              </div>

              {/* Drawing Generation */}
              <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">
                  Drawing Generation
                </h3>
                <div className="space-y-3 text-neutral-700 text-sm">
                  <p>
                    <strong className="text-neutral-900">Hybrid Approach:</strong> Combines
                    programmatic modifications with AI image generation for accuracy and
                    natural appearance.
                  </p>
                  <p>
                    <strong className="text-neutral-900">Auto-Correction:</strong> Adds missing
                    components, updates specifications, and routes piping automatically.
                  </p>
                  <p>
                    <strong className="text-neutral-900">Style Preservation:</strong> Maintains
                    original drawing aesthetics and engineering standards.
                  </p>
                </div>
              </div>

              {/* Standards Compliance */}
              <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">
                  Engineering Standards Supported
                </h3>
                <div className="grid md:grid-cols-3 gap-3 text-neutral-700 text-sm">
                  <div>
                    <strong className="text-neutral-900">ASME</strong>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• BPVC Section VIII</li>
                      <li>• B31.3 Process Piping</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-neutral-900">API</strong>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• API 610 (Pumps)</li>
                      <li>• API 650 (Tanks)</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-neutral-900">ISA</strong>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• ISA-5.1 (Instrumentation)</li>
                      <li>• ISA-84 (Safety Systems)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Use Case */}
        <section className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-8 border border-blue-600/20">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Industrial Engineering Use Case</h2>
          <p className="text-neutral-700 mb-4">
            Originally developed for Fluor Engineering, this solution addresses the critical
            need for rapid, accurate validation of complex piping systems in:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">▸</span>
                <span>Oil & Gas refineries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">▸</span>
                <span>Chemical processing plants</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">▸</span>
                <span>Power generation facilities</span>
              </li>
            </ul>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">▸</span>
                <span>Pharmaceutical manufacturing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">▸</span>
                <span>Water treatment systems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">▸</span>
                <span>Industrial HVAC systems</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default InfoPage;
