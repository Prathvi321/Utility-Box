import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Printer, Download, RotateCcw, Store, User, FileText, Plus, Trash2, Settings2, Receipt } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function InvoiceGenerator() {
    const [storeName, setStoreName] = useState('');
    const [storeGstin, setStoreGstin] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [storeContact, setStoreContact] = useState('');

    const [custName, setCustName] = useState('');
    const [custGstin, setCustGstin] = useState('');
    const [custAddr, setCustAddr] = useState('');

    const [items, setItems] = useState([
        { id: Date.now(), desc: 'Sample Product', qty: 1, rate: 1000, gst: 18 }
    ]);

    const [toastMsg, setToastMsg] = useState('');
    const [showToast, setShowToast] = useState(false);

    const [invDate] = useState(new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    }));
    const [invNo] = useState('INV-' + Math.floor(10000 + Math.random() * 90000));

    const invoiceRef = useRef(null);

    useEffect(() => {
        const raw = localStorage.getItem('gst_invoice_settings');
        if (raw) {
            const data = JSON.parse(raw);
            setStoreName(data.name || '');
            setStoreGstin(data.gstin || '');
            setStoreAddress(data.address || '');
            setStoreContact(data.contact || '');
        }
    }, []);

    const triggerToast = (msg) => {
        setToastMsg(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    const updateStoreSettings = (field, value) => {
        const newData = {
            name: field === 'name' ? value : storeName,
            gstin: field === 'gstin' ? value : storeGstin,
            address: field === 'address' ? value : storeAddress,
            contact: field === 'contact' ? value : storeContact
        };

        if (field === 'name') setStoreName(value);
        if (field === 'gstin') setStoreGstin(value);
        if (field === 'address') setStoreAddress(value);
        if (field === 'contact') setStoreContact(value);

        localStorage.setItem('gst_invoice_settings', JSON.stringify(newData));
    };

    const addRow = () => {
        setItems([...items, { id: Date.now(), desc: '', qty: 1, rate: 0, gst: 18 }]);
    };

    const removeItem = (id) => {
        if (items.length <= 1) return;
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    [field]: field === 'desc' ? value : (parseFloat(value) || 0)
                };
            }
            return item;
        }));
    };

    const resetApp = () => {
        if (window.confirm("This will clear the current customer and item list. Continue?")) {
            setCustName('');
            setCustGstin('');
            setCustAddr('');
            setItems([{ id: Date.now(), desc: '', qty: 1, rate: 0, gst: 18 }]);
            triggerToast("Reset successful");
        }
    };

    const exportAsPNG = async () => {
        triggerToast("Generating image...");
        if (!invoiceRef.current) return;
        const canvas = await html2canvas(invoiceRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            windowWidth: 1056
        });
        const link = document.createElement('a');
        link.download = `Invoice_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        triggerToast("Invoice Saved Successfully!");
    };

    const handlePrint = () => {
        window.print();
    };

    const numberToWords = (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        let nObj = num;
        if ((nObj = nObj.toString()).length > 9) return 'Overflow';
        const n = ('000000000' + nObj).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str || 'Zero';
    };

    const calculateTotals = () => {
        let subTotal = 0;
        let totalTax = 0;
        items.forEach(item => {
            const rowTotal = item.qty * item.rate;
            const rowTax = (rowTotal * item.gst) / 100;
            subTotal += rowTotal;
            totalTax += rowTax;
        });
        return { subTotal, totalTax, grandTotal: subTotal + totalTax };
    };

    const { subTotal, totalTax, grandTotal } = calculateTotals();

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Configuration */}
            <div className="w-full lg:w-[500px] flex-shrink-0 flex flex-col print:hidden">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner py-1 border border-white">
                        <Receipt size={36} className="text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Invoice <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Generator</span></h1>
                    <p className="text-lg text-gray-600 font-medium">Create professional, GST-compliant invoices in seconds.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-6 lg:p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col relative overflow-hidden custom-scrollbar max-h-[800px] lg:max-h-full overflow-y-auto">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col space-y-8">

                        {/* Business Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                <Store size={14} /> Business Details
                            </h3>
                            <div className="grid gap-4 bg-white/50 p-5 rounded-2xl border border-gray-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">Business Name</label>
                                        <input type="text" value={storeName} onChange={(e) => updateStoreSettings('name', e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none text-sm font-medium transition-all" placeholder="Your Company Ltd" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">GSTIN</label>
                                        <input type="text" value={storeGstin} onChange={(e) => updateStoreSettings('gstin', e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none text-sm font-medium font-mono uppercase transition-all" placeholder="27XXXXX0000X1Z" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700">Address</label>
                                    <textarea value={storeAddress} onChange={(e) => updateStoreSettings('address', e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none text-sm font-medium resize-none transition-all" rows="2" placeholder="123 Business Avenue, City, State, ZIP"></textarea>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700">Contact</label>
                                    <input type="text" value={storeContact} onChange={(e) => updateStoreSettings('contact', e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none text-sm font-medium transition-all" placeholder="Phone or Email" />
                                </div>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                <User size={14} /> Customer Details
                            </h3>
                            <div className="grid gap-4 bg-white/50 p-5 rounded-2xl border border-gray-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">Client Name</label>
                                        <input type="text" value={custName} onChange={(e) => setCustName(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none text-sm font-medium transition-all" placeholder="Customer Name" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">Client GSTIN</label>
                                        <input type="text" value={custGstin} onChange={(e) => setCustGstin(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none text-sm font-medium font-mono uppercase transition-all" placeholder="Optional" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700">Client Address</label>
                                    <textarea value={custAddr} onChange={(e) => setCustAddr(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none text-sm font-medium resize-none transition-all" rows="2" placeholder="Customer billing address"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                <FileText size={14} /> Invoice Items
                            </h3>
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.id} className="bg-white/50 p-4 pt-5 rounded-xl border border-gray-100 relative group">
                                        <div className="absolute -left-2 -top-2 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10 shadow-sm border-2 border-white">
                                            {index + 1}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                            <div className="sm:col-span-5 space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Item Description</label>
                                                <input type="text" value={item.desc} onChange={(e) => updateItem(item.id, 'desc', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium" placeholder="E.g. Web Development" />
                                            </div>
                                            <div className="sm:col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Qty</label>
                                                <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium text-center" min="1" />
                                            </div>
                                            <div className="sm:col-span-3 space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Rate (₹)</label>
                                                <input type="number" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium text-right" />
                                            </div>
                                            <div className="sm:col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">GST</label>
                                                <select value={item.gst} onChange={(e) => updateItem(item.id, 'gst', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium cursor-pointer">
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18">18%</option>
                                                    <option value="28">28%</option>
                                                </select>
                                            </div>
                                        </div>
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(item.id)} className="absolute -right-2 -top-2 w-6 h-6 bg-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center text-xs z-10 shadow-sm border-2 border-white transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button onClick={addRow} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Right Pane: Invoice Preview */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-4 sm:p-6 lg:p-10 flex flex-col relative overflow-hidden custom-scrollbar max-h-[100%] lg:max-h-full overflow-y-auto w-full lg:w-auto mt-8 lg:mt-0">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-2 shrink-0 print:hidden">
                    <h3 className="text-2xl font-bold text-gray-900">Preview</h3>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={resetApp} className="px-4 py-2 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-2">
                            <RotateCcw size={16} /> Reset
                        </button>
                        <button onClick={handlePrint} className="px-4 py-2 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2">
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={exportAsPNG} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-slate-900/20">
                            <Download size={16} /> Export PNG
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div className="flex-1 w-full flex items-start justify-start lg:justify-center overflow-x-auto pb-8 print:p-0 print:m-0 print:block">
                    {/* INVOICE CARD */}
                    <div ref={invoiceRef} className="bg-white p-8 md:p-12 w-[800px] shrink-0 min-h-[1056px] flex flex-col shadow-2xl rounded-2xl print:shadow-none print:m-0 print:border-none print:p-0 border border-gray-100 mx-auto">

                        {/* Invoice Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-blue-600 uppercase tracking-tight">{storeName || 'YOUR STORE'}</h2>
                                <p className="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">{storeAddress || 'Business address not provided.'}</p>
                                <div className="mt-4 flex flex-col gap-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax Identification</p>
                                    <p className="text-sm font-semibold text-slate-700">GSTIN: <span className="text-blue-600 font-mono">{storeGstin || 'NOT ENTERED'}</span></p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-5xl font-black text-slate-100 uppercase mb-4 select-none">INVOICE</h1>
                                <div className="text-sm space-y-1 inline-block text-left border-l-2 border-slate-100 pl-4">
                                    <p><span className="font-bold text-slate-700">Invoice No:</span> <span className="font-mono">{invNo}</span></p>
                                    <p><span className="font-bold text-slate-700">Date:</span> <span>{invDate}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To:</h4>
                                <p className="font-bold text-xl text-slate-800">{custName || 'Walking Customer'}</p>
                                <p className="text-slate-500 text-sm mt-1 whitespace-pre-line leading-relaxed">{custAddr || 'Address Details'}</p>
                                {custGstin && <p className="text-xs font-mono text-slate-500 mt-2 font-bold uppercase border border-slate-200 inline-block px-2 py-1 rounded">GSTIN: {custGstin}</p>}
                            </div>
                            <div className="text-right flex flex-col justify-end items-end">
                                <div className="inline-block">
                                    <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">Original Copy</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="flex-grow">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-slate-800">
                                        <th className="py-4 font-bold text-slate-700 uppercase text-[10px] tracking-widest">Description</th>
                                        <th className="py-4 font-bold text-slate-700 uppercase text-[10px] tracking-widest text-center w-20">Qty</th>
                                        <th className="py-4 font-bold text-slate-700 uppercase text-[10px] tracking-widest text-right w-32">Rate</th>
                                        <th className="py-4 font-bold text-slate-700 uppercase text-[10px] tracking-widest text-center w-20">GST %</th>
                                        <th className="py-4 font-bold text-slate-700 uppercase text-[10px] tracking-widest text-right w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => {
                                        const rowTotal = item.qty * item.rate;
                                        const rowTax = (rowTotal * item.gst) / 100;
                                        const rowGrand = rowTotal + rowTax;
                                        return (
                                            <tr key={item.id} className="border-b border-slate-100 group">
                                                <td className="py-4 flex flex-col justify-center min-h-[56px]">
                                                    <span className="font-medium text-slate-700 text-sm">{item.desc || '\u00A0'}</span>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className="text-center text-sm">{item.qty || 0}</span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <span className="text-right text-sm">₹{(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className="text-center text-sm">{item.gst}%</span>
                                                </td>
                                                <td className="py-4 text-right font-bold text-slate-800 text-sm font-mono">
                                                    ₹{rowGrand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="mt-12 border-t-4 border-slate-100 pt-8">
                            <div className="flex justify-between items-start gap-6">
                                {/* Left: Words */}
                                <div className="flex-1">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total in Words</h4>
                                    <p className="text-sm font-medium text-slate-600 italic">{numberToWords(Math.round(grandTotal))} Rupees Only</p>
                                </div>

                                {/* Right: Numerical Totals */}
                                <div className="w-full sm:w-72 space-y-2 shrink-0">
                                    <div className="flex justify-between text-slate-500 text-sm px-4">
                                        <span>Taxable Subtotal</span>
                                        <span className="font-mono font-medium tracking-tight">₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 text-sm px-4">
                                        <span>Combined GST (Tax)</span>
                                        <span className="font-mono font-medium tracking-tight">₹ {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl mt-4 border border-slate-100">
                                        <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">Grand Total</span>
                                        <span className="text-2xl font-black text-blue-600 font-mono tracking-tighter">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-end text-[10px]">
                            <div className="text-slate-400 italic">
                                <p>This is a computer generated invoice. No signature required.</p>
                                {storeContact && <p className="mt-1 font-semibold text-slate-500">Contact: {storeContact}</p>}
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="h-12 w-48 border-b-2 border-dashed border-slate-200 mb-2"></div>
                                <p className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Authorized Signatory</p>
                                <p className="text-slate-400 uppercase tracking-widest mt-1 text-[10px]">For {storeName || 'Your Store'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Toast */}
            <div className={`fixed bottom-5 right-5 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl transform transition-transform duration-300 z-50 pointer-events-none ${showToast ? 'translate-y-0' : 'translate-y-20 opacity-0'}`}>
                {toastMsg}
            </div>
        </div>
    );
}
