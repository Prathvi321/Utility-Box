import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ServiceLayout from './layouts/ServiceLayout';
import Home from './pages/Home';
import TextToSpeech from './pages/TextToSpeech';
import WhatsAppGenerator from './pages/WhatsAppGenerator';
import PdfMerger from './pages/PdfMerger';
import PdfToImages from './pages/PdfToImages';
import QrGenerator from './pages/QrGenerator';
import ImageCompressor from './pages/ImageCompressor';
import ImageConverter from './pages/ImageConverter';
import ImageToPdf from './pages/ImageToPdf';
import ColorPicker from './pages/ColorPicker';
import WatermarkAdder from './pages/WatermarkAdder';
import RemoveBackground from './pages/RemoveBackground';
import InvoiceGenerator from './pages/InvoiceGenerator';
import FrameSnap from './pages/FrameSnap';
import DatabaseConverter from './pages/DatabaseConverter';
import DnsTracker from './pages/DnsTracker';
import { services } from './utils/serviceData';

// Placeholder component for unimplemented services
const PlaceholderService = ({ title }) => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <p>This service is being ported to React. Coming soon!</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
          </Route>

          <Route path="/invoice-generator" element={<InvoiceGenerator />} />

          <Route element={<ServiceLayout />}>
            <Route path="/text-to-speech" element={<TextToSpeech />} />
            <Route path="/whatsapp-generator" element={<WhatsAppGenerator />} />
            <Route path="/pdf-merger" element={<PdfMerger />} />
            <Route path="/pdf-to-images" element={<PdfToImages />} />
            <Route path="/qr-generator" element={<QrGenerator />} />
            <Route path="/image-compressor" element={<ImageCompressor />} />
            <Route path="/image-converter" element={<ImageConverter />} />
            <Route path="/image-to-pdf" element={<ImageToPdf />} />
            <Route path="/color-picker" element={<ColorPicker />} />
            <Route path="/watermark-adder" element={<WatermarkAdder />} />
            <Route path="/remove-background" element={<RemoveBackground />} />
            <Route path="/framesnap" element={<FrameSnap />} />
            <Route path="/database-converter" element={<DatabaseConverter />} />
            <Route path="/dns-tracker" element={<DnsTracker />} />

            {services.filter(s =>
              s.id !== 'text-to-speech' &&
              s.id !== 'whatsapp-generator' &&
              s.id !== 'pdf-merger' &&
              s.id !== 'pdf-to-images' &&
              s.id !== 'qr-generator' &&
              s.id !== 'image-compressor' &&
              s.id !== 'image-converter' &&
              s.id !== 'image-to-pdf' &&
              s.id !== 'color-picker' &&
              s.id !== 'watermark-adder' &&
              s.id !== 'remove-background' &&
              s.id !== 'invoice-generator' &&
              s.id !== 'framesnap' &&
              s.id !== 'database-converter' &&
              s.id !== 'dns-tracker'
            ).map(service => (
              <Route
                key={service.id}
                path={`/${service.id}`}
                element={<PlaceholderService title={service.title} />}
              />
            ))}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
