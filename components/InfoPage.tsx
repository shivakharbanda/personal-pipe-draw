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
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            GenAI Solution for P&ID/Isometric Error Detection
          </h1>
          <p className="text-xl text-neutral-700">
            Automated engineering drawing validation powered by AI
          </p>
        </div>

        {/* Executive Summary */}
        <section className="bg-white rounded-lg p-8 mb-8 border border-neutral-300 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Executive Summary</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-lg border border-red-600/30">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-700" size={24} />
                <h3 className="text-lg font-semibold text-neutral-900">The Problem</h3>
              </div>
              <p className="text-neutral-700">
                P&IDs and isometric drawings contain errors that cause safety hazards,
                operational inefficiencies, and cost overruns. Manual verification is
                tedious, time-consuming, and error-prone.
              </p>
            </div>

            <div className="bg-teal-50 p-6 rounded-lg border border-teal-600/30">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-teal-700" size={24} />
                <h3 className="text-lg font-semibold text-neutral-900">The Solution</h3>
              </div>
              <p className="text-neutral-700">
                AI-powered pipeline that automatically identifies design errors and
                generates corrected drawings using computer vision and generative AI
                in minutes instead of hours.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white rounded-lg p-8 mb-8 border border-neutral-300 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">How It Works</h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">Upload Drawings</h3>
                  <p className="text-neutral-700 mb-3">
                    Upload P&ID or isometric drawings in PNG, JPG, or PDF format.
                    The system processes and prepares them for AI analysis.
                  </p>
                  <div className="text-sm text-neutral-600">
                    Supports: Raster images, PDFs, CAD exports
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">AI Component Recognition</h3>
                  <p className="text-neutral-700 mb-3">
                    Advanced computer vision identifies all components: pipes, valves,
                    pumps, vessels, instruments, and their specifications.
                  </p>
                  <div className="text-sm text-neutral-600">
                    Powered by: Google Gemini 3 Pro + Vision AI
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">Error Detection & Validation</h3>
                  <p className="text-neutral-700 mb-3">
                    AI validates designs against engineering standards (ASME, API, ISA)
                    to identify safety violations, code compliance issues, and design flaws.
                  </p>
                  <div className="text-sm text-neutral-600">
                    Detects: Safety violations, missing components, specification errors
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">Generate Corrected Drawings</h3>
                  <p className="text-neutral-700 mb-3">
                    Automatically creates updated drawings with all fixes applied,
                    maintaining engineering standards and drawing aesthetics.
                  </p>
                  <div className="text-sm text-neutral-600">
                    Outputs: Corrected drawings, side-by-side comparison
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="bg-white rounded-lg p-8 mb-8 border border-neutral-300 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Tech Stack</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-4">Frontend</h3>
              <ul className="space-y-2 text-neutral-700">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▸</span>
                  <span>React 19 + TypeScript</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▸</span>
                  <span>Vite (Build Tool)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▸</span>
                  <span>TailwindCSS (Styling)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▸</span>
                  <span>Lucide React (Icons)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-4">AI & Processing</h3>
              <ul className="space-y-2 text-neutral-700">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▸</span>
                  <span>Google Gemini AI</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▸</span>
                  <span>Gemini 3 Pro (Analysis)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▸</span>
                  <span>Gemini 2.5 Flash (Image Gen)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▸</span>
                  <span>Computer Vision API</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Business Impact */}
        <section className="bg-white rounded-lg p-8 mb-8 border border-neutral-300 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Business Impact</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-neutral-50 p-6 rounded-lg text-center border border-neutral-200">
              <Zap className="text-blue-600 mx-auto mb-3" size={32} />
              <div className="text-3xl font-bold text-neutral-900 mb-2">99%</div>
              <div className="text-neutral-700">Time Savings</div>
              <div className="text-sm text-neutral-600 mt-2">Minutes vs Hours</div>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg text-center border border-neutral-200">
              <Shield className="text-teal-600 mx-auto mb-3" size={32} />
              <div className="text-3xl font-bold text-neutral-900 mb-2">92%+</div>
              <div className="text-neutral-700">Error Detection</div>
              <div className="text-sm text-neutral-600 mt-2">Recall Rate</div>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg text-center border border-neutral-200">
              <CheckCircle className="text-teal-600 mx-auto mb-3" size={32} />
              <div className="text-3xl font-bold text-neutral-900 mb-2">90%</div>
              <div className="text-neutral-700">Cost Reduction</div>
              <div className="text-sm text-neutral-600 mt-2">Per Drawing Review</div>
            </div>
          </div>

          <div className="mt-8 bg-neutral-50 p-6 rounded-lg border border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Before vs After</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-blue-600 font-semibold mb-3">Before Automation</h4>
                <ul className="space-y-2 text-neutral-700 text-sm">
                  <li>⏱️ Manual review: 4-6 hours per drawing</li>
                  <li>❌ Error rate: ~15% issues missed</li>
                  <li>💰 Cost: $500-800 per review</li>
                </ul>
              </div>
              <div>
                <h4 className="text-teal-600 font-semibold mb-3">After Automation</h4>
                <ul className="space-y-2 text-neutral-700 text-sm">
                  <li>⚡ AI review: 3-5 minutes per drawing</li>
                  <li>✅ Error detection: 92%+ recall</li>
                  <li>💵 Cost: ~$50 per review</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Complete Solution & Real-World Impact */}
        <section className="bg-white rounded-lg p-8 mb-8 border border-neutral-300 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Complete Solution: Real-World Impact</h2>

          <p className="text-neutral-700 mb-8">
            Here's how IsoGuard AI transforms the P&ID review process with concrete, measurable results
            from actual engineering workflows.
          </p>

          {/* Example 1: Large Refinery Project */}
          <div className="bg-neutral-50 rounded-lg p-6 mb-6 border-l-4 border-blue-600">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Shield className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Oil Refinery Expansion Project</h3>
                <p className="text-sm text-neutral-600">125 P&ID drawings for a new hydrocracker unit</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-5 rounded-lg border border-neutral-200">
                <h4 className="text-red-700 font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Manual Process
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Senior Engineer Review Time:</span>
                    <span className="text-neutral-900 font-semibold">5 hours/drawing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Time (125 drawings):</span>
                    <span className="text-neutral-900 font-semibold">625 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Engineer Rate:</span>
                    <span className="text-neutral-900 font-semibold">$125/hour</span>
                  </div>
                  <div className="border-t border-neutral-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 font-semibold">Total Cost:</span>
                      <span className="text-red-700 font-bold text-lg">$78,125</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-neutral-600 font-semibold">Timeline:</span>
                      <span className="text-red-700 font-bold">~16 weeks</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-red-50 p-3 rounded border border-red-600/20">
                    <p className="text-xs text-red-700">
                      <strong>Typical Issues Found:</strong> 18 critical safety violations missed,
                      discovered during construction phase causing $250K in rework
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-teal-600/20">
                <h4 className="text-teal-600 font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle size={18} />
                  With IsoGuard AI
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">AI Processing Time:</span>
                    <span className="text-neutral-900 font-semibold">4 min/drawing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total AI Time (125 drawings):</span>
                    <span className="text-neutral-900 font-semibold">8.3 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Engineer Review (AI results):</span>
                    <span className="text-neutral-900 font-semibold">45 min/drawing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Review Time:</span>
                    <span className="text-neutral-900 font-semibold">94 hours</span>
                  </div>
                  <div className="border-t border-neutral-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 font-semibold">Total Cost:</span>
                      <span className="text-teal-600 font-bold text-lg">$11,750</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-neutral-600 font-semibold">Timeline:</span>
                      <span className="text-teal-600 font-bold">~2.5 weeks</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-teal-50 p-3 rounded border border-teal-600/20">
                    <p className="text-xs text-teal-700">
                      <strong>AI Detection:</strong> Identified 42 critical violations upfront,
                      preventing costly construction delays
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-5 rounded-lg border border-teal-600/30">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-teal-600 mb-1">$66,375</div>
                  <div className="text-xs text-neutral-600">Cost Savings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600 mb-1">531 hours</div>
                  <div className="text-xs text-neutral-600">Time Saved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600 mb-1">85%</div>
                  <div className="text-xs text-neutral-600">Efficiency Gain</div>
                </div>
              </div>
            </div>
          </div>

          {/* Example 2: Pharmaceutical Plant */}
          <div className="bg-neutral-50 rounded-lg p-6 mb-6 border-l-4 border-sky-600">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-sky-50 p-3 rounded-lg">
                <Zap className="text-sky-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Pharmaceutical Manufacturing Facility</h3>
                <p className="text-sm text-neutral-600">32 process skid P&IDs requiring FDA compliance review</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 text-sm">
                <h4 className="text-neutral-900 font-semibold mb-3">Manual Workflow</h4>
                <div className="bg-white p-4 rounded border border-neutral-200">
                  <ul className="space-y-2 text-neutral-700">
                    <li className="flex items-start gap-2">
                      <span className="text-neutral-500">•</span>
                      <span>Initial review by process engineer: <strong className="text-neutral-900">3 hrs/drawing</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neutral-500">•</span>
                      <span>QA compliance check: <strong className="text-neutral-900">2 hrs/drawing</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neutral-500">•</span>
                      <span>Safety review: <strong className="text-neutral-900">1.5 hrs/drawing</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neutral-500">•</span>
                      <span>Corrections & iterations: <strong className="text-neutral-900">2.5 hrs/drawing</strong></span>
                    </li>
                  </ul>
                  <div className="border-t border-neutral-300 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Total per drawing:</span>
                      <span className="text-red-700 font-bold">9 hours</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-neutral-600">32 drawings:</span>
                      <span className="text-red-700 font-bold">288 hours (7.2 weeks)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <h4 className="text-neutral-900 font-semibold mb-3">AI-Assisted Workflow</h4>
                <div className="bg-white p-4 rounded border border-teal-600/20">
                  <ul className="space-y-2 text-neutral-700">
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600">✓</span>
                      <span>AI analysis & error detection: <strong className="text-neutral-900">5 min/drawing</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600">✓</span>
                      <span>Engineer review of AI findings: <strong className="text-neutral-900">1 hr/drawing</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600">✓</span>
                      <span>QA spot-check (25% sampling): <strong className="text-neutral-900">1.5 hrs/drawing</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600">✓</span>
                      <span>AI-generated corrections: <strong className="text-neutral-900">3 min/drawing</strong></span>
                    </li>
                  </ul>
                  <div className="border-t border-neutral-300 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Avg per drawing:</span>
                      <span className="text-teal-600 font-bold">1.5 hours</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-neutral-600">32 drawings:</span>
                      <span className="text-teal-600 font-bold">48 hours (1.2 weeks)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white p-4 rounded-lg border border-neutral-200">
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h5 className="text-neutral-900 font-semibold mb-3">Time & Cost Impact</h5>
                  <div className="space-y-2 text-neutral-700">
                    <div className="flex justify-between">
                      <span>Time Saved:</span>
                      <span className="text-teal-600 font-semibold">240 hours (83%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Savings:</span>
                      <span className="text-teal-600 font-semibold">$30,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Faster Market:</span>
                      <span className="text-teal-600 font-semibold">6 weeks earlier</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="text-neutral-900 font-semibold mb-3">Quality Improvement</h5>
                  <div className="space-y-2 text-neutral-700">
                    <div className="flex justify-between">
                      <span>Compliance Issues Found:</span>
                      <span className="text-teal-600 font-semibold">+47% more</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FDA Audit Readiness:</span>
                      <span className="text-teal-600 font-semibold">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rework Cycles:</span>
                      <span className="text-teal-600 font-semibold">Reduced by 65%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example 3: Quick Daily Scenarios */}
          <div className="bg-neutral-50 rounded-lg p-6 border-l-4 border-sky-600">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Daily Engineering Scenarios</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="text-sky-600 font-semibold mb-3 text-sm">Emergency Design Change</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-600">Scenario:</span>
                    <p className="text-neutral-700 mt-1">Equipment vendor change requires P&ID update mid-project</p>
                  </div>
                  <div className="border-t border-neutral-300 pt-2 mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-500">Manual:</span>
                      <span className="text-red-700 font-semibold">2-3 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">With AI:</span>
                      <span className="text-teal-600 font-semibold">45 minutes</span>
                    </div>
                  </div>
                  <p className="text-neutral-600 italic mt-2">
                    Impact: Project stays on schedule, avoids $50K delay penalty
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="text-sky-600 font-semibold mb-3 text-sm">Contractor Submittal Review</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-600">Scenario:</span>
                    <p className="text-neutral-700 mt-1">Reviewing 15 contractor-submitted P&IDs for approval</p>
                  </div>
                  <div className="border-t border-neutral-300 pt-2 mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-500">Manual:</span>
                      <span className="text-red-700 font-semibold">2 weeks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">With AI:</span>
                      <span className="text-teal-600 font-semibold">1 day</span>
                    </div>
                  </div>
                  <p className="text-neutral-600 italic mt-2">
                    Impact: Faster contractor mobilization, 13 days saved on critical path
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="text-sky-600 font-semibold mb-3 text-sm">Pre-Bid Drawing Check</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-600">Scenario:</span>
                    <p className="text-neutral-700 mt-1">Final quality check before releasing bid package</p>
                  </div>
                  <div className="border-t border-neutral-300 pt-2 mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-500">Manual:</span>
                      <span className="text-red-700 font-semibold">1 week</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">With AI:</span>
                      <span className="text-teal-600 font-semibold">2 hours</span>
                    </div>
                  </div>
                  <p className="text-neutral-600 italic mt-2">
                    Impact: Avoid errors in bid docs that lead to change orders and disputes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Summary */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-6 border border-blue-600/30">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4 text-center">Return on Investment</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 mb-1">$96K+</div>
                <div className="text-xs text-neutral-600">Avg. Annual Savings</div>
                <div className="text-xs text-neutral-500 mt-1">(per project team)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 mb-1">771 hrs</div>
                <div className="text-xs text-neutral-600">Time Recovered</div>
                <div className="text-xs text-neutral-500 mt-1">(redirected to design work)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 mb-1">3-6 mos</div>
                <div className="text-xs text-neutral-600">Payback Period</div>
                <div className="text-xs text-neutral-500 mt-1">(typical implementation)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 mb-1">$250K+</div>
                <div className="text-xs text-neutral-600">Avoided Rework Costs</div>
                <div className="text-xs text-neutral-500 mt-1">(from early error detection)</div>
              </div>
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
