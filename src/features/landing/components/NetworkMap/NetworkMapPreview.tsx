import React from 'react';
import Link from 'next/link';

export const NetworkMapPreview = () => {
  return (
    <div className="w-full max-w-md mx-auto transition-all duration-300 hover:translate-y-[-4px]">
      {/* Card with optimized shape and borders */}
      <div className="rounded-xl bg-white shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-shadow duration-300">
        {/* Card Header - Simplified and touch-friendly */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-emerald-600"
            >
              <path
                d="M2 12L7 2L13 5L18 2L22 12L18 22L13 19L7 22L2 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <h3 className="font-medium text-gray-800 text-sm sm:text-base">
              Transit Network
            </h3>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            Islamabad
          </div>
        </div>

        {/* Map Visualization - Cleaner and more modern */}
        <div className="bg-slate-50">
          <div
            className="relative w-full"
            aria-label="Transit map visualization"
          >
            <svg
              width="100%"
              height="300"
              viewBox="0 0 500 400"
              className="block"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Transit map of Islamabad showing metro and bus routes"
            >
              {/* Simplified definitions */}
              <defs>
                <filter
                  id="softShadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="1"
                    stdDeviation="1"
                    floodOpacity="0.08"
                  />
                </filter>
                <linearGradient
                  id="waterGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="100%" stopColor="#f0f9ff" />
                </linearGradient>
              </defs>

              {/* Clean background */}
              <rect width="500" height="400" fill="#f8fafc" />

              {/* Minimalist grid */}
              <pattern
                id="grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              </pattern>
              <rect width="500" height="400" fill="url(#grid)" />

              {/* Simplified water feature */}
              <circle cx="430" cy="160" r="45" fill="url(#waterGradient)" />
              <text
                x="430"
                y="160"
                fill="#0c4a6e"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
              >
                Rawal Lake
              </text>

              {/* Transit Lines - Simplified with modern styling */}
              {/* Red Line - Metro Line 1 */}
              <path
                d="M30,50 L120,50 Q180,50 200,100 Q220,130 270,170 Q290,200 310,230 Q350,250 390,250 L450,250"
                stroke="#e11d48"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.85"
              >
                <title>Metro Line 1 (Red Line)</title>
              </path>

              {/* Blue Line - Metro Line 2 */}
              <path
                d="M30,220 L100,220 L180,220 Q230,220 270,170 Q300,130 330,100 Q350,80 380,60 L440,30"
                stroke="#1d4ed8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.85"
              >
                <title>Metro Line 2 (Blue Line)</title>
              </path>

              {/* Green Line - Metro Line 3 */}
              <path
                d="M90,320 Q140,310 180,280 Q210,260 230,230 Q250,200 270,170 Q290,140 310,120 Q340,90 380,70 L450,50"
                stroke="#059669"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.85"
              >
                <title>Metro Line 3 (Green Line)</title>
              </path>

              {/* Orange Line - Express Route */}
              <path
                d="M30,130 Q80,140 130,150 L180,160 Q240,160 270,170 Q320,180 370,180 Q410,170 450,140"
                stroke="#ea580c"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.85"
              >
                <title>Express Route (Orange Line)</title>
              </path>

              {/* Simplified feeder route */}
              <path
                d="M70,250 L130,250 Q180,250 220,260 Q250,270 270,280 Q300,300 340,320 L400,340"
                stroke="#4FD1C5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="5,8"
                opacity="0.85"
              >
                <title>Feeder Routes - Bus Connections</title>
              </path>

              {/* Transfer Stations - Simplified visual */}
              <g className="transfer-stations">
                <circle
                  cx="270"
                  cy="170"
                  r="7"
                  fill="white"
                  stroke="#334155"
                  strokeWidth="2"
                >
                  <title>PIMS - Major Transfer Station</title>
                </circle>

                <circle
                  cx="230"
                  cy="230"
                  r="5"
                  fill="white"
                  stroke="#334155"
                  strokeWidth="1.5"
                >
                  <title>Sohan Transfer Station</title>
                </circle>

                <circle
                  cx="310"
                  cy="230"
                  r="5"
                  fill="white"
                  stroke="#334155"
                  strokeWidth="1.5"
                >
                  <title>Bharakau Transfer Station</title>
                </circle>

                <circle
                  cx="380"
                  cy="70"
                  r="5"
                  fill="white"
                  stroke="#334155"
                  strokeWidth="1.5"
                >
                  <title>Airport Junction Transfer Station</title>
                </circle>
              </g>

              {/* Regular Stations - Reduced and simplified */}
              <g className="stations">
                {/* Selected important stations only */}
                <circle
                  cx="120"
                  cy="50"
                  r="3.5"
                  fill="white"
                  stroke="#e11d48"
                  strokeWidth="1.5"
                >
                  <title>Secretariat Station</title>
                </circle>
                <circle
                  cx="450"
                  cy="250"
                  r="3.5"
                  fill="white"
                  stroke="#e11d48"
                  strokeWidth="1.5"
                >
                  <title>Saddar Station</title>
                </circle>
                <circle
                  cx="440"
                  cy="30"
                  r="3.5"
                  fill="white"
                  stroke="#1d4ed8"
                  strokeWidth="1.5"
                >
                  <title>North Terminal</title>
                </circle>
                <circle
                  cx="90"
                  cy="320"
                  r="3.5"
                  fill="white"
                  stroke="#059669"
                  strokeWidth="1.5"
                >
                  <title>South Terminal</title>
                </circle>
                <circle
                  cx="450"
                  cy="50"
                  r="3.5"
                  fill="white"
                  stroke="#059669"
                  strokeWidth="1.5"
                >
                  <title>Northeast Terminal</title>
                </circle>
                <circle
                  cx="450"
                  cy="140"
                  r="3.5"
                  fill="white"
                  stroke="#ea580c"
                  strokeWidth="1.5"
                >
                  <title>Express Terminal</title>
                </circle>
              </g>

              {/* Simplified station labels */}
              <g className="station-labels">
                {/* Only label the most important stations */}
                <g transform="translate(270, 170)" className="major-station">
                  <text
                    x="0"
                    y="-14"
                    fill="#0f172a"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    PIMS
                  </text>
                </g>

                <text
                  x="120"
                  y="40"
                  fill="#0f172a"
                  fontSize="9"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  Secretariat
                </text>

                <text
                  x="450"
                  y="265"
                  fill="#0f172a"
                  fontSize="9"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  Saddar
                </text>

                <text
                  x="380"
                  y="60"
                  fill="#0f172a"
                  fontSize="9"
                  fontWeight="500"
                  textAnchor="start"
                >
                  Airport
                </text>
              </g>

              {/* Minimalist compass */}
              <g transform="translate(450, 40)">
                <circle
                  cx="0"
                  cy="0"
                  r="12"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                <path
                  d="M0,-8 L0,8 M-8,0 L8,0"
                  stroke="#94a3b8"
                  strokeWidth="0.8"
                />
                <path
                  d="M0,-8 L2,-2 L0,0 L-2,-2 Z"
                  fill="#64748b"
                  stroke="none"
                />
                <text
                  x="0"
                  y="-14"
                  fill="#64748b"
                  fontSize="7"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  N
                </text>
              </g>

              {/* "You are here" marker - Simplified */}
              <g transform="translate(270, 170)">
                <circle cx="0" cy="0" r="3" fill="#ef4444" opacity="0.8" />
              </g>
            </svg>
          </div>

          {/* Legend with semantic colors and proper spacing - mobile optimized */}
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 bg-white">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#e11d48] opacity-85"></div>
                <span className="text-xs text-gray-600">Red</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#1d4ed8] opacity-85"></div>
                <span className="text-xs text-gray-600">Blue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#059669] opacity-85"></div>
                <span className="text-xs text-gray-600">Green</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#ea580c] opacity-85"></div>
                <span className="text-xs text-gray-600">Orange</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#0d9488] opacity-85"></div>
                <span className="text-xs text-gray-600">Feeder</span>
              </div>
            </div>
          </div>

          {/* Card Footer - CTA only */}
          <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-center">
            <Link href="/map" className="w-full">
              <button className="w-full py-2 px-4 flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors duration-150">
                View Complete Map
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 12H19M19 12L12 5M19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
