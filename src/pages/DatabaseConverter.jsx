import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeftRight, Upload, Copy, Download, 
  Zap, CheckCircle2, AlertCircle, Play, Database
} from 'lucide-react';

// --- Conversion Utilities ---
const parseSQLToJSON = (sql) => {
  try {
    const result = [];
    // Basic regex to find INSERT INTO statements
    const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i;
    const match = sql.match(insertRegex);
    
    if (!match) throw new Error("Could not parse. Ensure format is: INSERT INTO table (col1, col2) VALUES ('val1', 'val2');");
    
    const columns = match[2].split(',').map(c => c.trim().replace(/['"`]/g, ''));
    const valuesPart = sql.substring(sql.indexOf('VALUES', match.index) + 6);
    
    // Match sets of values inside parentheses
    const valueRegex = /\(([^)]+)\)/g;
    let valMatch;
    let found = false;

    while ((valMatch = valueRegex.exec(valuesPart)) !== null) {
      found = true;
      const rawVals = valMatch[1].split(',');
      const cleanVals = [];
      
      // Handle values carefully (commas inside strings are a common issue, this is a basic naive split)
      let currentVal = '';
      let inString = false;
      
      for (let i = 0; i < rawVals.length; i++) {
        const v = rawVals[i].trim();
        if ((v.startsWith("'") && !v.endsWith("'")) || (v.startsWith('"') && !v.endsWith('"'))) {
          inString = true;
          currentVal += v + ',';
        } else if (inString && (v.endsWith("'") || v.endsWith('"'))) {
          inString = false;
          currentVal += v;
          cleanVals.push(currentVal);
          currentVal = '';
        } else if (inString) {
          currentVal += v + ',';
        } else {
          cleanVals.push(v);
        }
      }

      const parsedVals = cleanVals.map(v => {
        let clean = v.trim();
        if ((clean.startsWith("'") && clean.endsWith("'")) || (clean.startsWith('"') && clean.endsWith('"'))) {
          return clean.slice(1, -1);
        }
        if (clean.toLowerCase() === 'null') return null;
        if (!isNaN(clean) && clean !== '') return Number(clean);
        return clean;
      });

      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = parsedVals[i] !== undefined ? parsedVals[i] : null;
      });
      result.push(obj);
    }
    
    if (!found) throw new Error("No values found to parse.");
    return JSON.stringify(result, null, 2);
  } catch (err) {
    throw new Error(err.message || "Invalid SQL format");
  }
};

const parseJSONToSQL = (jsonStr) => {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("JSON must be a non-empty array of objects");
    }

    const columns = Object.keys(data[0]);
    let sql = `INSERT INTO table_name (${columns.join(', ')}) VALUES\n`;
    
    const values = data.map(obj => {
      const vals = columns.map(col => {
        const val = obj[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return val;
      });
      return `  (${vals.join(', ')})`;
    });

    return sql + values.join(',\n') + ';';
  } catch (err) {
    throw new Error("Invalid JSON format. Expected an array of objects.");
  }
};

const DatabaseConverter = () => {
  // State
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [fromFormat, setFromFormat] = useState('sql');
  const [toFormat, setToFormat] = useState('json');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Tour State
  const [tourStep, setTourStep] = useState(0);
  const [tourPos, setTourPos] = useState({ top: -100, left: 0, opacity: 0 });

  // Refs for Tour targets
  const inputRef = useRef(null);
  const formatRef = useRef(null);
  const convertRef = useRef(null);
  const outputRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const tourData = [
    { step: 1, text: "Paste or upload your data here", ref: inputRef },
    { step: 2, text: "Choose conversion type", ref: formatRef },
    { step: 3, text: "Click to convert", ref: convertRef },
    { step: 4, text: "Download or copy result", ref: outputRef }
  ];

  // Auto-tour logic
  useEffect(() => {
    let timeouts = [];
    
    // Start tour after initial render
    timeouts.push(setTimeout(() => setTourStep(1), 800));
    timeouts.push(setTimeout(() => setTourStep(2), 3000));
    timeouts.push(setTimeout(() => setTourStep(3), 5200));
    timeouts.push(setTimeout(() => setTourStep(4), 7400));
    timeouts.push(setTimeout(() => setTourStep(0), 10000)); // Hide

    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Update tooltip position based on active step
  useEffect(() => {
    if (tourStep > 0 && tourStep <= tourData.length) {
      const targetRef = tourData[tourStep - 1].ref;
      if (targetRef.current && containerRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setTourPos({
          top: rect.bottom - containerRect.top + 12,
          left: rect.left - containerRect.left + (rect.width / 2),
          opacity: 1
        });
      }
    } else {
      setTourPos(prev => ({ ...prev, opacity: 0 }));
    }
  }, [tourStep]);

  // Handlers
  const handleSwap = () => {
    setFromFormat(toFormat);
    setToFormat(fromFormat);
    if (outputData && !error) {
      setInputData(outputData);
      setOutputData('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      setInputData(evt.target.result);
      setError(null);
      
      if (file.name.endsWith('.json')) {
        setFromFormat('json');
        setToFormat('sql');
      } else if (file.name.endsWith('.sql')) {
        setFromFormat('sql');
        setToFormat('json');
      }
    };
    reader.readAsText(file);
  };

  const handleConvert = () => {
    if (!inputData.trim()) {
      setError("Please provide some data to convert.");
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        let result = '';
        if (fromFormat === 'sql' && toFormat === 'json') {
          result = parseSQLToJSON(inputData);
        } else if (fromFormat === 'json' && toFormat === 'sql') {
          result = parseJSONToSQL(inputData);
        } else {
          result = inputData;
        }
        setOutputData(result);
      } catch (err) {
        setError(err.message);
        setOutputData('');
      } finally {
        setIsLoading(false);
      }
    }, 400);
  };

  const handleCopy = () => {
    if (!outputData) return;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(outputData);
    } else {
      let textArea = document.createElement("textarea");
      textArea.value = outputData;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (error) {
        console.error('Copy failed', error);
      }
      textArea.remove();
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputData) return;
    const blob = new Blob([outputData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_data.${toFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cardBgClass = 'bg-white/80 border-gray-200';
  const inputBgClass = 'bg-gray-50/50 focus:bg-white border-gray-300';
  const mutedTextClass = 'text-gray-500';

  return (
    <div className="w-full flex-grow flex flex-col h-full" ref={containerRef}>
        <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Database size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Database Converter</h1>
            <p className="text-gray-600">Convert SQL ↔ JSON instantly</p>
        </div>

        {/* Main Content Grid */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 relative min-h-[500px]">
          
          {/* Auto-Tour Tooltip */}
          <div 
            className={`absolute z-50 transform -translate-x-1/2 transition-all duration-700 ease-in-out ${tourPos.opacity ? 'scale-100' : 'scale-95 pointer-events-none'}`}
            style={{ top: tourPos.top, left: tourPos.left, opacity: tourPos.opacity }}
          >
            <div className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-xl relative flex items-center gap-2 whitespace-nowrap">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600 rotate-45"></div>
              <Zap className="w-4 h-4 text-indigo-200" />
              {tourStep > 0 && tourData[tourStep - 1]?.text}
            </div>
          </div>

          {/* Left Column: Input & Controls */}
          <div className="flex flex-col gap-6">
            
            {/* Input Section */}
            <div 
              ref={inputRef} 
              className={`flex-grow flex flex-col border rounded-2xl p-1 shadow-sm backdrop-blur-md transition-all ${cardBgClass} ${tourStep === 1 ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white' : ''}`}
            >
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-medium uppercase tracking-wider text-gray-600">Input Data</span>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-colors hover:bg-gray-100 bg-gray-50 text-gray-700 border border-gray-200`}
                >
                  <Upload className="w-3 h-3" /> Upload File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".json,.sql,.txt"
                />
              </div>
              <textarea
                value={inputData}
                onChange={(e) => { setInputData(e.target.value); setError(null); }}
                placeholder={fromFormat === 'sql' ? "Paste INSERT INTO statements here..." : "Paste JSON array here..."}
                className={`flex-grow w-full p-4 resize-none outline-none font-mono text-sm transition-colors rounded-b-xl min-h-[200px] text-gray-800 ${inputBgClass}`}
                spellCheck="false"
              />
            </div>

            {/* Controls Section */}
            <div 
              ref={formatRef}
              className={`border rounded-2xl p-4 shadow-sm backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center gap-4 transition-all ${cardBgClass} ${tourStep === 2 ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white' : ''}`}
            >
              <div className="flex-1 flex items-center gap-3 bg-gray-50/50 rounded-xl p-1 border border-gray-200">
                <select 
                  value={fromFormat} 
                  onChange={(e) => setFromFormat(e.target.value)}
                  className={`w-full bg-transparent outline-none p-2 text-sm font-medium cursor-pointer appearance-none text-center text-gray-700`}
                >
                  <option value="sql">SQL</option>
                  <option value="json">JSON</option>
                </select>
                
                <button 
                  onClick={handleSwap}
                  className={`p-2 rounded-lg shrink-0 transition-transform hover:scale-110 bg-white shadow-sm border border-gray-200 text-gray-600`}
                  title="Swap formats"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                
                <select 
                  value={toFormat} 
                  onChange={(e) => setToFormat(e.target.value)}
                  className={`w-full bg-transparent outline-none p-2 text-sm font-medium cursor-pointer appearance-none text-center text-gray-700`}
                >
                  <option value="json">JSON</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              <div ref={convertRef} className={`shrink-0 w-full sm:w-auto transition-all ${tourStep === 3 ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white rounded-xl' : ''}`}>
                <button
                  onClick={handleConvert}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Convert
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-red-600 text-sm flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div 
            ref={outputRef}
            className={`flex flex-col border rounded-2xl p-1 shadow-sm backdrop-blur-md transition-all ${cardBgClass} ${tourStep === 4 ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white' : ''}`}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium uppercase tracking-wider text-gray-600">Output</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  disabled={!outputData}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 bg-gray-50 text-gray-700 border border-gray-200`}
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={!outputData}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 bg-gray-50 text-gray-700 border border-gray-200`}
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
            <div className={`flex-grow w-full relative rounded-b-xl overflow-hidden min-h-[200px] ${inputBgClass}`}>
              {!outputData && !error && (
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${mutedTextClass}`}>
                  <p className="text-sm opacity-50 flex flex-col items-center gap-2">
                    <Zap className="w-8 h-8 opacity-20" />
                    Result will appear here
                  </p>
                </div>
              )}
              <textarea
                value={outputData}
                readOnly
                className="w-full h-full p-4 resize-none outline-none font-mono text-sm bg-transparent text-gray-800"
                spellCheck="false"
              />
            </div>
          </div>

        </div>
    </div>
  );
};

export default DatabaseConverter;
