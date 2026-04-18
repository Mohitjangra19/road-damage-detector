import React, { useState, useRef, useEffect } from 'react';

function App() {
    const [modelStatus, setModelStatus] = useState('Idle');
    const [videoSrc, setVideoSrc] = useState(null);
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [confidence, setConfidence] = useState(0);
    const [errorClasses, setErrorClasses] = useState({});
    const [consoleLogs, setConsoleLogs] = useState([]);
    const [showLabels, setShowLabels] = useState(true);
    const videoRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
        setModelStatus('Ready');
        setConfidence(92);
        setErrorClasses({
            'Alligator Cracking': 5,
            'Longitudinal Cracking': 3,
            'Pothole': 2,
            'Transverse Cracking': 2,
        });
        setConsoleLogs([
            'Model initialized successfully',
            'Frame 452: Pothole detected (98% confidence).',
            'Frame 453: Alligator Cracking detected (95% confidence).',
            'Frame 454: Transverse Cracking detected (92% confidence).',
        ]);
        setBoundingBoxes([
            { x: 100, y: 150, width: 50, height: 30, class: 'Pothole', confidence: 98 },
            { x: 200, y: 200, width: 80, height: 40, class: 'Alligator Cracking', confidence: 95 },
            { x: 150, y: 250, width: 120, height: 25, class: 'Transverse Cracking', confidence: 92 },
        ]);
    }, []);

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setModelStatus('Processing');
        }
    };

    const toggleLabels = () => {
        setShowLabels((current) => !current);
    };

    const exportJSON = () => {
        const data = {
            boundingBoxes,
            errorClasses,
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

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <header className="bg-gray-800 p-4">
                <h1 className="text-xl font-bold">AI Model Training & Testing Workbench</h1>
                <div className="text-sm">
                    Model Status: <span className="text-green-400">{modelStatus}</span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 relative bg-black">
                    {videoSrc ? (
                        <>
                            <video
                                ref={videoRef}
                                src={videoSrc}
                                controls
                                className="w-full h-full object-contain"
                            />
                            {showLabels && (
                                <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none">
                                    {boundingBoxes.map((box, index) => (
                                        <rect
                                            key={index}
                                            x={box.x}
                                            y={box.y}
                                            width={box.width}
                                            height={box.height}
                                            fill="none"
                                            stroke="red"
                                            strokeWidth="2"
                                        />
                                    ))}
                                </svg>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Upload a video to start inference
                        </div>
                    )}
                </div>

                <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-4">Model Confidence</h2>
                    <div className="mb-4">
                        <div className="text-sm">Overall Confidence: {confidence}%</div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div
                                className="bg-green-400 h-2.5 rounded-full"
                                style={{ width: `${confidence}%` }}
                            />
                        </div>
                    </div>
                    <h3 className="text-md font-semibold mb-2">Error Classes</h3>
                    <ul>
                        {Object.entries(errorClasses).map(([className, count]) => (
                            <li key={className} className="flex justify-between">
                                <span>{className}</span>
                                <span>{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-gray-800 p-4 flex space-x-4">
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="text-sm"
                />
                <button onClick={toggleLabels} className="bg-blue-600 px-4 py-2 rounded">
                    {showLabels ? 'Hide Labels' : 'Show Labels'}
                </button>
                <button onClick={exportJSON} className="bg-green-600 px-4 py-2 rounded">
                    Export JSON
                </button>
            </div>

            <div className="bg-gray-800 p-4 h-32 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-2">Console</h2>
                <div className="text-sm font-mono">
                    {consoleLogs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;