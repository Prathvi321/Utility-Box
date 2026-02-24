import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, Download, RotateCcw } from 'lucide-react';
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

    const [showSettings, setShowSettings] = useState(false);
    const [toastMsg, setToastMsg] = useState('Saved to Local Storage');
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
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 print:hidden">
                    <Link
                        to="/"
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 shadow-sm transition-colors duration-200"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Services
                    </Link>
                </div>
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                            GST Invoice <span className="text-blue-600">Pro</span>
                        </h1>
                        <p className="text-slate-500">Professional GST billing simplified</p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 shadow-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            Business Profile
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left Panel: Inputs (No Print) */}
                    <div className="lg:col-span-1 space-y-6 print:hidden">
                        {/* Settings Panel */}
                        <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 ${showSettings ? 'block' : 'hidden'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-slate-800">Your Business</h3>
                                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Shop Name</label>
                                    <input type="text" value={storeName} onChange={(e) => updateStoreSettings('name', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter Business Name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">GSTIN Number</label>
                                    <input type="text" value={storeGstin} onChange={(e) => updateStoreSettings('gstin', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="27XXXXX0000X1ZX" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Address</label>
                                    <textarea value={storeAddress} onChange={(e) => updateStoreSettings('address', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" rows="2" placeholder="Full Address"></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Contact Info</label>
                                    <input type="text" value={storeContact} onChange={(e) => updateStoreSettings('contact', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Email or Phone" />
                                </div>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-4 text-slate-800">Customer Details</h3>
                            <div className="space-y-4">
                                <input type="text" value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Customer Name" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                                <input type="text" value={custGstin} onChange={(e) => setCustGstin(e.target.value)} placeholder="Customer GSTIN (Optional)" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                                <textarea value={custAddr} onChange={(e) => setCustAddr(e.target.value)} placeholder="Customer Address" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" rows="2"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Invoice Preview */}
                    <div className="lg:col-span-3">
                        <div ref={invoiceRef} className="invoice-card print:shadow-none print:m-0 print:p-0 print:w-full print:border-none bg-white p-8 md:p-12 rounded-xl min-h-[1056px] flex flex-col border border-slate-100">

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
                                    <h1 className="text-5xl font-black text-slate-200 uppercase mb-4 select-none">INVOICE</h1>
                                    <div className="text-sm space-y-1 inline-block text-left border-l-2 border-slate-100 pl-4">
                                        <p><span className="font-bold text-slate-700">Invoice No:</span> #{invNo}</p>
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
                                    <p className="text-xs font-mono text-slate-400 mt-2 font-bold uppercase">{custGstin}</p>
                                </div>
                                <div className="text-right flex flex-col justify-end">
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
                                            <th className="py-4 print:hidden w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => {
                                            const rowTotal = item.qty * item.rate;
                                            const rowTax = (rowTotal * item.gst) / 100;
                                            const rowGrand = rowTotal + rowTax;
                                            return (
                                                <tr key={item.id} className="border-b border-slate-100 group">
                                                    <td className="py-4">
                                                        <input type="text" value={item.desc} onChange={(e) => updateItem(item.id, 'desc', e.target.value)} placeholder="Item Description" className="w-full bg-transparent print:hidden font-medium text-slate-700 p-1 rounded invoice-item-input" />
                                                        <span className="hidden print:block font-medium text-slate-700 text-sm">{item.desc || '—'}</span>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} className="w-16 bg-transparent text-center print:hidden p-1 rounded invoice-item-input" />
                                                        <span className="hidden print:block text-center text-sm">{item.qty}</span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <input type="number" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} className="w-24 bg-transparent text-right print:hidden p-1 rounded invoice-item-input" />
                                                        <span className="hidden print:block text-right text-sm">₹{item.rate.toLocaleString('en-IN')}</span>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <select value={item.gst} onChange={(e) => updateItem(item.id, 'gst', e.target.value)} className="bg-transparent text-center print:hidden cursor-pointer text-sm">
                                                            <option value="0">0%</option>
                                                            <option value="5">5%</option>
                                                            <option value="12">12%</option>
                                                            <option value="18">18%</option>
                                                            <option value="28">28%</option>
                                                        </select>
                                                        <span className="hidden print:block text-center text-sm">{item.gst}%</span>
                                                    </td>
                                                    <td className="py-4 text-right font-bold text-slate-800 text-sm font-mono">
                                                        ₹{rowGrand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-4 text-right print:hidden">
                                                        <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 p-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <button onClick={addRow} className="mt-6 print:hidden text-blue-600 font-bold text-sm flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Add New Item
                                </button>
                            </div>

                            {/* Totals Section */}
                            <div className="mt-12 border-t-4 border-slate-100 pt-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                    {/* Left: Words */}
                                    <div className="max-w-md">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total in Words</h4>
                                        <p className="text-sm font-medium text-slate-600 italic">{numberToWords(Math.round(grandTotal))} Rupees Only</p>
                                    </div>

                                    {/* Right: Numerical Totals */}
                                    <div className="w-full md:w-80 space-y-2">
                                        <div className="flex justify-between text-slate-500 text-sm">
                                            <span>Taxable Subtotal</span>
                                            <span className="font-mono font-medium tracking-tight">₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 text-sm">
                                            <span>Combined GST (Tax)</span>
                                            <span className="font-mono font-medium tracking-tight">₹ {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 pb-1 mt-2 border-t-2 border-slate-900">
                                            <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">Grand Total</span>
                                            <span className="text-2xl font-black text-blue-600 font-mono tracking-tighter">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-16 pt-8 border-t border-slate-50 flex justify-between items-center text-[10px]">
                                <div className="text-slate-400 italic">
                                    <p>This is a computer generated invoice. No signature required.</p>
                                    {storeContact && <p className="mt-1 font-semibold text-slate-500">Contact: {storeContact}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800 uppercase tracking-widest mb-1">Authorized Signatory</p>
                                    <div className="h-10 w-32 border-b border-slate-200 ml-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4 print:hidden px-4 py-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <button onClick={resetApp} className="w-full sm:w-auto bg-white text-rose-600 border border-rose-200 font-semibold py-3 px-8 rounded-xl hover:bg-rose-50 transition flex items-center justify-center gap-2">
                        <RotateCcw className="w-5 h-5" />
                        Reset Current Bill
                    </button>
                    <button onClick={handlePrint} className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2">
                        <Printer className="w-5 h-5" />
                        Print Invoice
                    </button>
                    <button onClick={exportAsPNG} className="w-full sm:w-auto bg-emerald-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-emerald-700 transition shadow-lg flex items-center justify-center gap-2">
                        <Download className="w-5 h-5" />
                        Save as PNG
                    </button>
                </div>
            </div>

            {/* Feedback Toast */}
            <div className={`fixed bottom-5 right-5 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl transform transition-transform duration-300 pointer-events-none z-50 ${showToast ? 'translate-y-0' : 'translate-y-20 opacity-0'}`}>
                {toastMsg}
            </div>
        </div>
    );
}
