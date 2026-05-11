import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Type, Image as ImageIcon, Download, Copy, Save, Trash2, AlignLeft, AlignCenter, AlignRight, LayoutTemplate, X, ImagePlus, UploadCloud, Layers } from 'lucide-react';
import { useStore } from '../store';

interface Element {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  content?: string;
  src?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  width?: number;
  height?: number;
}

interface DesignStudioCanvasProps {
  onSaveTemplate: (base64Image: string, name: string) => void;
}

const DesignStudioCanvas: React.FC<DesignStudioCanvasProps> = ({ onSaveTemplate }) => {
  const { notify } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [background, setBackground] = useState<string>('#ffffff');
  const [templateName, setTemplateName] = useState('New Certificate Template');
  const [exporting, setExporting] = useState(false);

  const handleAddText = () => {
    const newEl: Element = {
      id: Date.now().toString(),
      type: 'text',
      x: 50,
      y: 50,
      content: 'Double click to edit text',
      fontSize: 24,
      fontWeight: 'normal',
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      color: '#000000',
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newEl: Element = {
        id: Date.now().toString(),
        type: 'image',
        x: 100,
        y: 100,
        src: reader.result as string,
        width: 200,
      };
      setElements([...elements, newEl]);
      setSelectedId(newEl.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSetBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBackground(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: Date.now().toString(), x: el.x + 20, y: el.y + 20 };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const exportAsImage = async () => {
    if (!canvasRef.current) return null;
    setSelectedId(null); // Deselect before export
    setExporting(true);
    await new Promise(r => setTimeout(r, 100)); // wait for re-render
    
    try {
      const canvas = await html2canvas(canvasRef.current, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      setExporting(false);
      return dataUrl;
    } catch (err) {
      console.error('Export error:', err);
      notify('Failed to export canvas', 'error');
      setExporting(false);
      return null;
    }
  };

  const handleDownloadImage = async () => {
    const dataUrl = await exportAsImage();
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${templateName}.png`;
      a.click();
      notify('Image exported successfully', 'success');
    }
  };

  const handleDownloadPDF = async () => {
    const dataUrl = await exportAsImage();
    if (dataUrl) {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 600] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 800, 600);
      pdf.save(`${templateName}.pdf`);
      notify('PDF exported successfully', 'success');
    }
  };

  const handleSaveToSystem = async () => {
    const dataUrl = await exportAsImage();
    if (dataUrl) {
      onSaveTemplate(dataUrl, templateName);
    }
  };

  const selectedEl = elements.find(e => e.id === selectedId);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col lg:flex-row min-h-[800px]">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col z-20">
        <div className="p-6 border-b border-slate-100">
          <input 
            type="text" 
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            className="w-full text-base font-black text-slate-900 border-none p-0 focus:ring-0 uppercase tracking-widest placeholder-slate-300"
            placeholder="Template Name"
          />
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          {/* Add Elements */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Elements</h4>
             <div className="grid grid-cols-2 gap-3">
               <button onClick={handleAddText} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl text-slate-600 transition-all group">
                 <Type size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                 <span className="text-[9px] font-bold uppercase tracking-widest">Text</span>
               </button>
               <label className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl text-slate-600 transition-all cursor-pointer group">
                 <ImageIcon size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                 <span className="text-[9px] font-bold uppercase tracking-widest">Image</span>
                 <input type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
               </label>
             </div>
          </div>

          {/* Background */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background</h4>
             <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all cursor-pointer">
                <ImagePlus size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Upload BG Image</span>
                <input type="file" accept="image/*" onChange={handleSetBackground} className="hidden" />
             </label>
             <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">Solid Color:</span>
                <input type="color" value={background.startsWith('#') ? background : '#ffffff'} onChange={e => setBackground(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
             </div>
          </div>

          {/* Properties Panel */}
          {selectedEl && (
            <div className="space-y-5 pt-6 border-t border-slate-100">
               <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Element Properties</h4>
                 <div className="flex items-center gap-1">
                   <button onClick={() => duplicateElement(selectedEl.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md" title="Duplicate"><Copy size={14} /></button>
                   <button onClick={() => deleteElement(selectedEl.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md" title="Delete"><Trash2 size={14} /></button>
                 </div>
               </div>

               {selectedEl.type === 'text' && (
                 <>
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Text Content</label>
                     <textarea 
                       value={selectedEl.content} 
                       onChange={e => updateElement(selectedEl.id, { content: e.target.value })}
                       className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/20 resize-none h-20"
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Size (px)</label>
                       <input type="number" value={selectedEl.fontSize} onChange={e => updateElement(selectedEl.id, { fontSize: Number(e.target.value) })} className="w-full p-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Color</label>
                       <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl">
                         <input type="color" value={selectedEl.color} onChange={e => updateElement(selectedEl.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                         <span className="text-xs font-bold text-slate-600">{selectedEl.color}</span>
                       </div>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alignment</label>
                     <div className="flex bg-slate-50 rounded-xl p-1">
                       <button onClick={() => updateElement(selectedEl.id, { textAlign: 'left' })} className={`flex-1 p-2 flex justify-center rounded-lg ${selectedEl.textAlign === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignLeft size={16} /></button>
                       <button onClick={() => updateElement(selectedEl.id, { textAlign: 'center' })} className={`flex-1 p-2 flex justify-center rounded-lg ${selectedEl.textAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignCenter size={16} /></button>
                       <button onClick={() => updateElement(selectedEl.id, { textAlign: 'right' })} className={`flex-1 p-2 flex justify-center rounded-lg ${selectedEl.textAlign === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignRight size={16} /></button>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Font Weight</label>
                     <select value={selectedEl.fontWeight} onChange={e => updateElement(selectedEl.id, { fontWeight: e.target.value })} className="w-full p-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-0">
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="bold">Bold</option>
                        <option value="900">Black</option>
                     </select>
                   </div>
                 </>
               )}
               {selectedEl.type === 'image' && (
                 <div className="space-y-2">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Width (px)</label>
                   <input type="number" value={selectedEl.width} onChange={e => updateElement(selectedEl.id, { width: Number(e.target.value) })} className="w-full p-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold" />
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
          <button onClick={handleSaveToSystem} disabled={exporting} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            {exporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            Save to Dashboard
          </button>
          <div className="flex gap-3">
            <button onClick={handleDownloadImage} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-slate-300 transition-all flex items-center justify-center gap-2">
              <Download size={14} /> PNG
            </button>
            <button onClick={handleDownloadPDF} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-slate-300 transition-all flex items-center justify-center gap-2">
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-slate-100/50 p-8 flex items-center justify-center overflow-auto relative">
        <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400">
           <Layers size={14} className="text-indigo-600" /> Live Preview
        </div>
        
        {/* The Canvas itself */}
        <div 
          ref={canvasRef}
          className="relative bg-white shadow-2xl overflow-hidden transition-all"
          style={{
            width: '800px',
            height: '600px',
            backgroundImage: background.startsWith('data:') || background.startsWith('http') ? `url(${background})` : 'none',
            backgroundColor: background.startsWith('#') ? background : '#ffffff',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={() => setSelectedId(null)}
        >
          {elements.map(el => (
            <motion.div
              key={el.id}
              drag
              dragMomentum={false}
              onDragEnd={(e, info) => {
                updateElement(el.id, { x: el.x + info.offset.x, y: el.y + info.offset.y });
              }}
              style={{ x: el.x, y: el.y, position: 'absolute' }}
              onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
              className={`cursor-move ${selectedId === el.id && !exporting ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
            >
              {el.type === 'text' ? (
                <div 
                  style={{
                    fontSize: `${el.fontSize}px`,
                    fontWeight: el.fontWeight,
                    fontFamily: el.fontFamily,
                    color: el.color,
                    textAlign: el.textAlign,
                    whiteSpace: 'pre-wrap',
                    minWidth: '50px',
                    minHeight: '20px'
                  }}
                >
                  {el.content}
                </div>
              ) : (
                <img 
                  src={el.src} 
                  alt="" 
                  style={{ width: `${el.width}px`, height: 'auto', pointerEvents: 'none' }} 
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignStudioCanvas;
