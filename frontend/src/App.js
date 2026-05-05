import React, { useState, useRef, useEffect, useMemo } from 'react';

import logo from './logo.png';

function App() {
    const [modelStatus, setModelStatus] = useState('Idle');
    const [mediaSrc, setMediaSrc] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [confidence, setConfidence] = useState(0);
    const [consoleLogs, setConsoleLogs] = useState([]);
    const [showLabels, setShowLabels] = useState(true);
    const [hoveredClass, setHoveredClass] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [videoSpeed, setVideoSpeed] = useState(1);
    
    const mediaRef = useRef(null);
    const svgRef = useRef(null);
    
    // Video synchronization refs
    const isAnalyzingRef = useRef(false);
    const nextTriggerTime = useRef(7);

    // Derived states
    const activeClasses = useMemo(() => {
        return boundingBoxes.reduce((acc, box) => {
            acc[box.class] = (acc[box.class] || 0) + 1;
            return acc;
        }, {});
    }, [boundingBoxes]);

    const severityScore = useMemo(() => {
        if (boundingBoxes.length === 0) return 0;
        let score = 0;
        boundingBoxes.forEach(box => {
            if (box.class === 'Pothole') score += 25;
            else if (box.class.includes('Alligator')) score += 15;
            else if (box.class.includes('Transverse')) score += 10;
            else score += 5;
        });
        return Math.min(100, score);
    }, [boundingBoxes]);

    useEffect(() => {
        setModelStatus('Awaiting Media');
    }, []);

    // Live Video Processing logic 
    useEffect(() => {
        const video = mediaRef.current;
        if (!video || mediaType !== 'video') return;

        const handleTimeUpdate = () => {
            // Live evaluation without pausing (simulating continuous realtime scanning)
            if (video.currentTime >= nextTriggerTime.current) {
                // Update boxes every 1.5 to 3 seconds while playing without pausing
                nextTriggerTime.current = video.currentTime + (Math.random() * 1.5 + 1.5); 
                
                // Synchronously update boxes to keep video playing smoothly
                generateRandomBoundingBoxes(video.currentTime);
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [mediaSrc, mediaType]);

    const generateRandomBoundingBoxes = (videoTime = null) => {
        // Randomize what is found to make it dynamic
        const numBoxes = Math.floor(Math.random() * 4) + 1; 
        const boxes = [];
        const classes = [
            { name: 'Pothole', color: '#ef4444' },
            { name: 'Alligator Cracking', color: '#3b82f6' },
            { name: 'Transverse Cracking', color: '#10b981' },
            { name: 'Longitudinal Cracking', color: '#f59e0b' }
        ];

        for (let i = 0; i < numBoxes; i++) {
            const cls = classes[Math.floor(Math.random() * classes.length)];
            boxes.push({
                x: `${Math.floor(Math.random() * 60) + 10}%`,
                y: `${Math.floor(Math.random() * 60) + 10}%`,
                width: `${Math.floor(Math.random() * 20) + 8}%`,
                height: `${Math.floor(Math.random() * 20) + 8}%`,
                class: cls.name,
                confidence: Math.floor(Math.random() * 40) + 60, // 60 to 99
                color: cls.color
            });
        }
        
        setConfidence(Math.floor(Math.random() * 15) + 80); // 80 to 95
        setBoundingBoxes(boxes);
        
        const timestamp = videoTime !== null ? `[Video Time: ${videoTime.toFixed(1)}s]` : `[Image Scan]`;
        setConsoleLogs(logs => [
            ...logs,
            `Inference Complete: Detected ${numBoxes} defects ${timestamp}`
        ]);
        
        setTelemetry({ // Vehicle speed replaced by interactive Video Speed controller
            coordinates: `34°03'${(Math.random()*60).toFixed(1)}"${Math.random()>0.5?'N':'S'} 118°15'${(Math.random()*60).toFixed(1)}"${Math.random()>0.5?'W':'E'}`,
            location: "Highway Checkpoint Alpha",
            weather: Math.random() > 0.5 ? "Clear, 72°F" : "Overcast, 68°F",
            scanTime: `${Math.floor(Math.random()*150) + 50} ms/frame`
        });
    };

    const processImageMock = () => {
        setModelStatus('Processing...');
        setConsoleLogs(logs => [...logs, 'Starting AI image inference...']);
        setTimeout(() => {
            setModelStatus('Analysis Complete');
            generateRandomBoundingBoxes();
        }, 1500);
    };

    const handleMediaUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setMediaSrc(url);
            
            const isVid = file.type.startsWith('video/');
            setMediaType(isVid ? 'video' : 'image');
            
            // Clean up state
            setBoundingBoxes([]);
            setConfidence(0);
            setHoveredClass(null);
            setTelemetry(null);
            isAnalyzingRef.current = false;
            
            if (isVid) {
                nextTriggerTime.current = 1; // Start first scan almost immediately 
                setModelStatus('Playing');
                setConsoleLogs(['Video loaded. Continuous real-time AI scanning active.']);
            } else {
                processImageMock();
            }
        }
    };

    const toggleLabels = () => {
        setShowLabels((current) => !current);
    };

    const exportJSON = () => {
        const data = {
            boundingBoxes,
            activeClasses,
            severityScore,
            telemetry,
            consoleLogs,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'detection-data.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSpeedChange = (e) => {
        const speed = parseFloat(e.target.value);
        setVideoSpeed(speed);
        if (mediaRef.current && mediaType === 'video') {
            mediaRef.current.playbackRate = speed;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-gray-200 flex flex-col font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-md border-b border-white/10 p-5 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-hidden">
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain animate-[pulse_2s_ease-in-out_infinite]" />
                    </div>
                    <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 uppercase">
                        ROAD DAMAGE <span className="font-light text-gray-400 text-lg">DETECTOR</span>
                    </h1>
                </div>
                <div className="flex items-center space-x-3 bg-black/40 px-5 py-2.5 rounded-full border border-white/10 shadow-inner">
                    <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Status</span>
                    <span className="flex items-center space-x-2 text-sm font-semibold">
                        <span className={`w-2.5 h-2.5 rounded-full ${modelStatus === 'Analysis Complete' ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : modelStatus === 'Processing...' ? 'bg-yellow-400 shadow-[0_0_10px_#facc15] animate-pulse' : modelStatus === 'Playing' ? 'bg-blue-400 shadow-[0_0_10px_#60a5fa]' : 'bg-gray-500'}`}></span>
                        <span className={modelStatus === 'Analysis Complete' ? 'text-green-400' : modelStatus === 'Processing...' ? 'text-yellow-400' : modelStatus === 'Playing' ? 'text-blue-400' : 'text-gray-400'}>{modelStatus}</span>
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex flex-1 overflow-hidden p-6 gap-6 relative">
                {/* Background effects */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Media Section */}
                <section className="flex-[2] relative rounded-2xl border border-white/10 bg-black/40 flex flex-col overflow-hidden backdrop-blur-sm shadow-2xl z-0">
                    <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
                        {mediaSrc ? (
                            <div className="relative max-w-full max-h-full inline-flex rounded-lg overflow-hidden border border-white/10 bg-black/60 shadow-lg">
                                {mediaType === 'video' ? (
                                    <video
                                        ref={mediaRef}
                                        src={mediaSrc}
                                        controls
                                        autoPlay
                                        loop
                                        className="max-w-full max-h-full object-contain"
                                        onPlay={() => { if(!isAnalyzingRef.current) setModelStatus('Playing'); }}
                                        onPause={() => { if(!isAnalyzingRef.current) setModelStatus('Paused'); }}
                                    />
                                ) : (
                                    <img
                                        ref={mediaRef}
                                        src={mediaSrc}
                                        alt="Uploaded road"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                )}
                                {showLabels && (mediaType === 'image' || (mediaType === 'video' && modelStatus !== 'Playing' && modelStatus !== 'Processing...')) && (
                                    <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                                        <defs>
                                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                                <feGaussianBlur stdDeviation="3" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>
                                        {boundingBoxes.map((box, index) => {
                                            const isHovered = hoveredClass === box.class;
                                            const opacityClasses = hoveredClass && !isHovered ? 'opacity-20' : 'opacity-100';
                                            return (
                                                <g 
                                                    key={index}
                                                    className={`transition-opacity duration-300 pointer-events-auto cursor-crosshair ${opacityClasses}`}
                                                    onMouseEnter={() => setHoveredClass(box.class)}
                                                    onMouseLeave={() => setHoveredClass(null)}
                                                >
                                                    <rect
                                                        x={box.x}
                                                        y={box.y}
                                                        width={box.width}
                                                        height={box.height}
                                                        fill={`${box.color}15`}
                                                        stroke={box.color || "#00ffcc"}
                                                        strokeWidth={isHovered ? "4" : "2.5"}
                                                        filter="url(#glow)"
                                                        rx="4"
                                                    />
                                                    <rect
                                                        x={box.x}
                                                        y={`calc(${box.y} - 28px)`}
                                                        width="190"
                                                        height="24"
                                                        fill="rgba(0,0,0,0.8)"
                                                        rx="4"
                                                        stroke={box.color}
                                                        strokeWidth="1"
                                                    />
                                                    <text
                                                        x={`calc(${box.x} + 8px)`}
                                                        y={`calc(${box.y} - 11px)`}
                                                        fill={box.color || "#00ffcc"}
                                                        fontSize="12"
                                                        fontFamily="sans-serif"
                                                        fontWeight="800"
                                                        style={{ letterSpacing: '0.5px' }}
                                                        filter="url(#glow)"
                                                    >
                                                        {box.class.toUpperCase()} • {box.confidence}%
                                                    </text>
                                                </g>
                                            )
                                        })}
                                    </svg>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-500 space-y-6">
                                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.02)]">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-lg tracking-wide font-light">Upload a media file to begin AI analysis</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="flex-1 flex flex-col gap-6 max-w-sm z-0">
                    {/* Controls */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden group hover:border-white/20 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <h2 className="text-xs uppercase tracking-widest text-cyan-400 mb-5 font-bold flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Operation Controls
                        </h2>
                        <div className="space-y-4 relative z-10">
                            <label className="flex items-center justify-center w-full cursor-pointer bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-6 py-4 rounded-xl font-bold tracking-wide transition-all duration-300 shadow-[0_4px_20px_rgba(34,211,238,0.25)] hover:shadow-[0_6px_25px_rgba(34,211,238,0.4)] active:scale-[0.98]">
                                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload Photo / Video
                                <input
                                    type="file"
                                    accept="video/*, image/*"
                                    onChange={handleMediaUpload}
                                    className="hidden"
                                />
                            </label>

                            <div className="flex gap-3">
                                <button
                                    onClick={toggleLabels}
                                    disabled={!mediaSrc}
                                    className={`flex-1 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 border ${!mediaSrc ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/5 text-gray-500' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white shadow-lg active:scale-[0.98] hover:border-cyan-500/30'}`}
                                >
                                    {showLabels ? 'Hide Overlay' : 'Show Overlay'}
                                </button>
                                <button
                                    onClick={exportJSON}
                                    disabled={!mediaSrc}
                                    className={`flex-1 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 border ${!mediaSrc ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/5 text-gray-500' : 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 shadow-lg active:scale-[0.98]'}`}
                                >
                                    Export Data
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex-1 flex flex-col hover:border-white/20 transition-all duration-300">
                        <h2 className="text-xs uppercase tracking-widest text-cyan-400 mb-6 font-bold flex items-center">
                           <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                           </svg>
                           Intelligence Report
                        </h2>
                        
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                                <span className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">System Trust</span>
                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">{confidence}%</span>
                            </div>
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5 relative overflow-hidden group flex flex-col justify-center">
                                <div className={`absolute inset-0 bg-red-500/10 opacity-0 transition-opacity ${severityScore > 50 ? 'group-hover:opacity-100' : ''}`}></div>
                                <span className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Severity Risk</span>
                                <span className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${severityScore > 75 ? 'from-red-500 to-orange-500' : severityScore > 40 ? 'from-orange-400 to-yellow-400' : 'from-green-400 to-emerald-400'}`}>{severityScore} <span className="text-sm font-medium text-gray-500">/100</span></span>
                            </div>
                        </div>

                        {telemetry && (
                            <div className="mb-6 bg-black/20 rounded-xl border border-white/5 p-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                </div>
                                <h3 className="text-[10px] uppercase tracking-widest text-cyan-500 mb-4 font-bold flex items-center">
                                    <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    Location &amp; Telemetry
                                </h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-xs relative z-10">
                                    <div>
                                        <span className="block text-gray-500 font-semibold mb-1">GPS Coord</span>
                                        <span className="text-gray-200 font-mono tracking-tighter shadow-sm">{telemetry.coordinates}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 font-semibold mb-1">Location</span>
                                        <span className="text-gray-200 shadow-sm">{telemetry.location}</span>
                                    </div>
                                    <div className="z-20 relative">
                                        <span className="block text-gray-500 font-semibold mb-1 cursor-pointer">Video Speed</span>
                                        <select 
                                            className="bg-black/80 border border-white/20 text-cyan-400 rounded px-1.5 py-0.5 outline-none font-bold shadow-sm text-[11px] w-full cursor-pointer hover:border-cyan-500/50 appearance-none transition-colors"
                                            value={videoSpeed}
                                            onChange={handleSpeedChange}
                                            disabled={mediaType !== 'video'}
                                            style={{backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.2rem center', backgroundSize: '1em'}}
                                        >
                                            <option value={0.5}>0.5x Slow</option>
                                            <option value={1}>1.0x Normal</option>
                                            <option value={1.5}>1.5x Fast</option>
                                            <option value={2}>2.0x Fast</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 font-semibold mb-1">Inference Time</span>
                                        <span className="text-emerald-400 font-bold shadow-sm">{telemetry.scanTime}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Detected Anomalies ({boundingBoxes.length})</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                            {Object.keys(activeClasses).length > 0 ? (
                                Object.entries(activeClasses).map(([className, count]) => {
                                    const isHovered = hoveredClass === className;
                                    return (
                                        <div 
                                            key={className} 
                                            onMouseEnter={() => setHoveredClass(className)}
                                            onMouseLeave={() => setHoveredClass(null)}
                                            className={`flex justify-between items-center p-3 rounded-xl border border-white/5 transition-all duration-300 cursor-pointer ${isHovered ? 'bg-white/10 border-white/30 scale-[1.02]' : 'bg-white/[0.02] hover:bg-white/[0.04]'} ${className === 'Transverse Cracking' ? 'border-l-[3px] border-l-emerald-500' : className === 'Pothole' ? 'border-l-[3px] border-l-red-500' : className === 'Longitudinal Cracking' ? 'border-l-[3px] border-l-orange-500' : 'border-l-[3px] border-l-blue-500'}`}
                                        >
                                            <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                                                {className}
                                                {className === 'Transverse Cracking' && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">Target</span>
                                                )}
                                            </span>
                                            <span className="bg-white/10 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-inner">
                                                {count}
                                            </span>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-8 font-light italic">No data meets current format</div>
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* Console */}
            <div className="h-44 bg-[#050508] border-t border-white/10 p-5 font-mono text-[13px] overflow-y-auto flex flex-col relative text-gray-400 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)]">
                <div className="sticky top-0 bg-[#050508]/90 backdrop-blur pb-3 mb-3 border-b border-white/5 z-10 flex justify-between items-center">
                    <span className="text-cyan-500 font-bold tracking-widest text-xs flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        SYSTEM LOGS
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase">Live</span>
                        <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    </span>
                </div>
                {consoleLogs.length === 0 && <span className="text-gray-600/50 italic">System is currently resting...</span>}
                {consoleLogs.map((log, index) => (
                    <div key={index} className="mb-1.5 flex hover:text-gray-200 transition-colors">
                        <span className="text-gray-600 mr-4 select-none">[{new Date().toLocaleTimeString()}]</span>
                        <span className={log.includes('successfully') || log.includes('detected') || log.includes('Detected') ? 'text-green-400' : log.includes('Transverse') ? 'text-emerald-400' : log.includes('Pothole') ? 'text-red-400' : log.includes('Alligator') ? 'text-blue-400' : 'text-gray-300'}>{log}</span>
                    </div>
                ))}
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.01);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </div>
    );
}

export default App;