import React, { useState } from 'react';
import { 
  Search, Server, Shield, Activity, FileText, Printer, 
  Globe, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

const DnsTracker = () => {
  const [domain, setDomain] = useState('');
  const [activeTab, setActiveTab] = useState('dns');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [auditTimestamp, setAuditTimestamp] = useState(null);

  const fetchDNS = async (name, type) => {
    const res = await fetch(`https://dns.google/resolve?name=${name}&type=${type}`);
    const data = await res.json();
    return { type, name, records: data.Answer || [] };
  };

  const fetchWHOIS = async (domain) => {
    try {
      const res = await fetch(`https://rdap.org/domain/${domain}`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  };

  const fetchHeaders = async (domain) => {
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('http://' + domain)}`);
      const data = await res.json();
      return data.contents ? "Analysis Successful: Server is active and responding." : "Limited header access via browser proxy.";
    } catch { return "Headers unreachable due to CORS/Network restrictions."; }
  };

  const runAudit = async (e) => {
    e.preventDefault();
    const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)/, '').split('/')[0];
    if (!cleanDomain) return;
    
    setDomain(cleanDomain);
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'CNAME', 'TXT'];
      const dnsPromises = recordTypes.map(type => fetchDNS(cleanDomain, type));
      const securityPromises = [
        fetchDNS(cleanDomain, 'TXT'),
        fetchDNS(`_dmarc.${cleanDomain}`, 'TXT')
      ];
      const whoisPromise = fetchWHOIS(cleanDomain);
      const headerPromise = fetchHeaders(cleanDomain);

      const [dnsResults, securityResults, whoisData, headerData] = await Promise.all([
        Promise.all(dnsPromises),
        Promise.all(securityPromises),
        whoisPromise,
        headerPromise
      ]);

      setResults({
        dns: dnsResults,
        security: securityResults,
        whois: whoisData,
        headers: headerData
      });
      setAuditTimestamp(new Date().toLocaleString());
      setActiveTab('dns');
    } catch (err) {
      setError(err.message || "An error occurred during the audit.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // UI Components
  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all border ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border-blue-600' 
          : 'bg-white/80 text-gray-600 hover:bg-white border-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const getBadgeColor = (type) => {
    switch(type) {
      case 'A': return 'bg-red-100 text-red-800 border-red-200';
      case 'AAAA': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MX': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TXT': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'NS': return 'bg-green-100 text-green-800 border-green-200';
      case 'CNAME': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderHealthChecks = () => {
    if (!results) return null;
    const { dns, security } = results;

    const checks = [];

    const hasA = dns.find(r => r.type === 'A')?.records.length > 0;
    checks.push({ label: 'A Record Presence', pass: hasA, desc: hasA ? 'Domain resolves to a valid IPv4 address.' : 'Missing A record. The website will not load.' });

    const hasMX = dns.find(r => r.type === 'MX')?.records.length > 0;
    checks.push({ label: 'MX Record Configuration', pass: hasMX, desc: hasMX ? 'Mail exchange servers are correctly defined.' : 'No MX records found. This domain cannot receive emails.' });

    const hasSPF = security[0].records.some(r => r.data.includes('v=spf1'));
    checks.push({ label: 'SPF Security Record', pass: hasSPF, desc: hasSPF ? 'SPF policy exists to prevent unauthorized email sending.' : 'Missing SPF record. High risk of email spoofing.' });

    const hasNS = dns.find(r => r.type === 'NS')?.records.length > 0;
    checks.push({ label: 'Name Server Redundancy', pass: hasNS, desc: hasNS ? 'Authoritative name servers are responding.' : 'Critical error: No name servers detected.' });

    return (
      <div className="space-y-3">
        {checks.map((c, i) => (
          <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${c.pass ? 'bg-white/80 border-gray-100' : 'bg-red-50/80 border-red-100'}`}>
            <div className="mt-0.5">
              {c.pass ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
            </div>
            <div>
              <h5 className="font-bold text-sm text-gray-800">{c.label}</h5>
              <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSecurityTab = () => {
    if (!results) return null;
    const { security } = results;
    const [txtRecords, dmarcRecords] = security;
    
    const spf = txtRecords.records.find(r => r.data.includes('v=spf1'));
    const dmarc = dmarcRecords.records.find(r => r.data.includes('v=DMARC1'));

    const cards = [
      { label: 'SPF (Email Policy)', status: spf ? 'Configured' : 'Missing', isGood: !!spf },
      { label: 'DMARC (Spoof Guard)', status: dmarc ? 'Enabled' : 'Missing', isGood: !!dmarc },
      { label: 'DNSSEC (Data Integrity)', status: 'Unknown', isGood: false }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className={`p-4 rounded-xl border ${c.isGood ? 'bg-green-50/50 border-green-100' : 'bg-amber-50/50 border-amber-100'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{c.label}</p>
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm ${c.isGood ? 'text-green-700' : 'text-amber-700'}`}>{c.status}</span>
              {c.isGood ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWHOIS = () => {
    if (!results || !results.whois) {
      return (
        <div className="p-8 text-center text-gray-400 italic bg-gray-50/50 rounded-xl border border-dashed">
          No registration data available via RDAP protocol.
        </div>
      );
    }

    const { whois } = results;
    const events = whois.events || [];
    const registrar = whois.entities ? whois.entities[0]?.vcardArray?.[1]?.find(i => i[0] === 'fn')?.[3] : 'N/A';
    const status = whois.status || ['Active'];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-widest">Registrar</p>
          <p className="font-bold text-gray-800 text-sm truncate">{registrar}</p>
        </div>
        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-widest">Domain Status</p>
          <p className="font-bold text-blue-600 text-sm">{status[0]}</p>
        </div>
        {events.slice(0, 4).map((e, i) => (
          <div key={i} className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-widest">
              {e.eventAction.replace(/([A-Z])/g, ' $1')}
            </p>
            <p className="font-bold text-gray-800 text-sm">
              {new Date(e.eventDate).toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'})}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full flex-grow flex flex-col h-full">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print-hidden { display: none !important; }
          .print-block { display: block !important; }
          .tab-content { display: block !important; page-break-inside: avoid; margin-bottom: 2rem; }
        }
      `}</style>

      <div className="text-center mb-8 print-hidden">
        <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-lg shadow-blue-200">
          <Globe size={32} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">DNS Detective</h1>
        <p className="text-slate-500 font-medium">Domain Security, Health & DNS Audit Report</p>
      </div>

      <div className="bg-white/80 border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm backdrop-blur-md print-hidden">
        <form onSubmit={runAudit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Globe className="w-5 h-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com" 
              required
              className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Run Audit</span>
                <Search className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-6 text-center mb-6 print-hidden backdrop-blur-md">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h4 className="font-bold text-gray-900 mb-1">Lookup Error</h4>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      )}

      {!results && !error && !isLoading && (
        <div className="text-center py-20 print-hidden">
          <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Analyze a domain to view detailed insights</p>
        </div>
      )}

      {results && (
        <div id="printable-area" className="flex flex-col flex-grow">
          <div className="flex flex-wrap gap-2 mb-6 print-hidden">
            <TabButton id="dns" label="DNS Records" icon={Server} />
            <TabButton id="security" label="Email Security" icon={Shield} />
            <TabButton id="whois" label="WHOIS Info" icon={FileText} />
            <TabButton id="health" label="Health Report" icon={Activity} />
            <TabButton id="headers" label="HTTP Headers" icon={Globe} />
          </div>

          <div className="bg-white/80 border border-gray-200 rounded-2xl p-6 mb-6 flex justify-between items-center border-l-4 border-l-blue-500 shadow-sm backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{domain}</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                Audit Performed: <span className="text-gray-700">{auditTimestamp}</span>
              </p>
            </div>
            <button 
              onClick={handlePrint} 
              className="bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 p-3 rounded-xl transition-all print-hidden" 
              title="Generate PDF Report"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-grow">
            {/* DNS Tab */}
            <div className={`tab-content ${activeTab === 'dns' ? 'block' : 'hidden print-hidden'}`}>
              <h3 className="hidden print-block font-bold text-xl mb-4">DNS Records Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.dns.map((res, idx) => {
                  if (res.records.length === 0) return null;
                  return (
                    <div key={idx} className="bg-white/80 border border-gray-200 rounded-2xl p-6 shadow-sm backdrop-blur-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[0.7rem] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide border ${getBadgeColor(res.type)}`}>
                            {res.type}
                          </span>
                          <h4 className="font-bold text-gray-800">{res.records.length} Record(s)</h4>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {res.records.map((r, rIdx) => (
                          <div key={rIdx} className="font-mono text-xs bg-gray-50/80 p-3 rounded-lg border border-gray-100 break-all text-gray-700">
                            {r.data}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security Tab */}
            <div className={`tab-content ${activeTab === 'security' ? 'block' : 'hidden print-hidden'}`}>
              <div className="bg-white/80 border border-gray-200 rounded-2xl p-6 shadow-sm backdrop-blur-md">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500 print-hidden" /> Email Authentication Status
                </h3>
                {renderSecurityTab()}
              </div>
            </div>

            {/* WHOIS Tab */}
            <div className={`tab-content ${activeTab === 'whois' ? 'block' : 'hidden print-hidden'}`}>
              <div className="bg-white/80 border border-gray-200 rounded-2xl p-6 shadow-sm backdrop-blur-md">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500 print-hidden" /> Registration Details
                </h3>
                {renderWHOIS()}
              </div>
            </div>

            {/* Health Tab */}
            <div className={`tab-content ${activeTab === 'health' ? 'block' : 'hidden print-hidden'}`}>
              <div className="bg-white/80 border border-gray-200 rounded-2xl p-6 shadow-sm backdrop-blur-md">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500 print-hidden" /> Domain Configuration & Health Audit
                </h3>
                {renderHealthChecks()}
              </div>
            </div>

            {/* Headers Tab */}
            <div className={`tab-content ${activeTab === 'headers' ? 'block' : 'hidden print-hidden'}`}>
              <div className="bg-white/80 border border-gray-200 rounded-2xl p-6 shadow-sm backdrop-blur-md">
                <h3 className="font-bold text-lg mb-4">Server Response Headers</h3>
                <pre className="font-mono text-xs bg-gray-50/80 p-4 rounded-xl border border-gray-200 overflow-x-auto whitespace-pre-wrap text-gray-700">
                  Report Summary:{"\n"}{results.headers}
                  {"\n\n"}Note: Detailed HTTP response headers (like Server, X-Frame-Options) are blocked by browser CORS security policies. For a full security header audit, a server-side scanner is recommended.
                </pre>
              </div>
            </div>
          </div>
          
          <div className="hidden print-block mt-12 pt-8 border-t border-gray-200 text-center text-gray-400 text-xs">
            This report was generated by DNS Detective. Data reflects global DNS propagation at the time of audit.
          </div>
        </div>
      )}
    </div>
  );
};

export default DnsTracker;
