import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Package, Play, ArrowDown, Database, Upload, Download, CheckCircle } from 'lucide-react';

const NotebookCell = ({ index, title, code, output, isActive, icon }: any) => {
    return (
        <motion.div 
            className={`flex flex-col md:flex-row gap-6 p-6 rounded-lg border-2 transition-all duration-500 ${isActive ? 'border-orange bg-white shadow-hard' : 'border-slate/10 bg-white/50 grayscale opacity-70'}`}
        >
            <div className="flex-1 font-mono text-sm">
                <div className="flex items-center gap-2 mb-3 text-slate/50">
                    <div className="w-6 h-6 rounded bg-slate/10 flex items-center justify-center text-[10px] font-bold">In [{index}]:</div>
                    <div className="h-px bg-slate/10 flex-1" />
                    {icon}
                </div>
                <div className="bg-slate/5 p-4 rounded border border-slate/10 relative overflow-hidden group">
                    <pre className="text-slate whitespace-pre-wrap">{code}</pre>
                    {isActive && <motion.div layoutId="cursor" className="absolute top-4 right-4 w-2 h-4 bg-orange animate-pulse" />}
                </div>
            </div>
            
            {/* Simulated Output Area */}
            {output && (
                 <div className="flex-1 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-3 text-slate/50">
                        <div className="w-6 h-6 rounded bg-orange/10 text-orange flex items-center justify-center text-[10px] font-bold">Out[{index}]:</div>
                        <div className="h-px bg-slate/10 flex-1" />
                    </div>
                    <div className="p-4 border-l-2 border-slate/20 min-h-[100px] flex flex-col justify-center">
                        {output}
                    </div>
                 </div>
            )}
        </motion.div>
    );
};

const NotebookGuide = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <div ref={containerRef} className="bg-bone min-h-[200vh] relative py-20">
            <div className="container mx-auto px-4 md:px-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left Column: Sticky Explainer */}
                    <div className="lg:w-1/3">
                        <div className="sticky top-32 space-y-8">
                             <div className="w-16 h-16 bg-orange text-white rounded-xl shadow-hard flex items-center justify-center">
                                <Database className="w-8 h-8" />
                             </div>
                             <h2 className="text-5xl font-display font-bold">The Lab Notebook</h2>
                             <p className="text-xl text-slate/60 font-sans leading-relaxed">
                                VibeWidget is designed to feel like a natural extension of your python notebook workflow. It treats visualization as a conversation.
                             </p>
                             <div className="space-y-4 pt-8">
                                <div className="flex items-center gap-4 text-sm font-mono text-slate/50">
                                    <span className="w-6 h-6 rounded-full border border-slate/20 flex items-center justify-center">1</span>
                                    <span>Installation & Setup</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-mono text-slate/50">
                                    <span className="w-6 h-6 rounded-full border border-slate/20 flex items-center justify-center">2</span>
                                    <span>Generation</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-mono text-slate/50">
                                    <span className="w-6 h-6 rounded-full border border-slate/20 flex items-center justify-center">3</span>
                                    <span>Refinement (Revise)</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-mono text-slate/50">
                                    <span className="w-6 h-6 rounded-full border border-slate/20 flex items-center justify-center">4</span>
                                    <span>Collaboration</span>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Right Column: Scrolling Notebook Cells */}
                    <div className="lg:w-2/3 space-y-32 pb-32">
                        <NotebookCell 
                            index={1}
                            isActive={true}
                            icon={<Package className="w-4 h-4" />}
                            title="Installation"
                            code="!pip install vibe-widget"
                            output={
                                <div className="text-slate/60 text-xs">
                                    Requirement already satisfied: vibe-widget in /usr/local/lib/python3.10<br/>
                                    <span className="text-green-600 font-bold">Successfully installed vibe-widget-0.1.4</span>
                                </div>
                            }
                        />

                        <NotebookCell 
                            index={2}
                            isActive={true}
                            icon={<Play className="w-4 h-4" />}
                            title="Generate"
                            code={`import vibe_widget as vw\n\n# Create a widget from data\nvw.create(\n  "scatter plot of sales vs profit",\n  data=df\n)`}
                            output={
                                <div className="bg-white border-2 border-slate rounded p-2 shadow-sm">
                                    <div className="h-32 bg-orange/5 flex items-end justify-around pb-2 px-2 gap-1">
                                        {[40, 60, 30, 80, 50].map((h, i) => (
                                            <div key={i} className="w-full bg-orange rounded-t-sm" style={{height: `${h}%`}} />
                                        ))}
                                    </div>
                                    <div className="text-center text-xs font-mono mt-2 text-slate/50">Interactive Chart Generated</div>
                                </div>
                            }
                        />

                        <NotebookCell 
                            index={3}
                            isActive={true}
                            icon={<Upload className="w-4 h-4" />}
                            title="Revise"
                            code={`# Iterative refinement\nvw.revise(\n  "change color scheme to teal and add tooltips",\n  widget_id="wid_123"\n)`}
                            output={
                                <div className="bg-white border-2 border-slate rounded p-2 shadow-sm">
                                    <div className="h-32 bg-teal-5 flex items-end justify-around pb-2 px-2 gap-1">
                                        {[40, 60, 30, 80, 50].map((h, i) => (
                                            <div key={i} className="w-full bg-teal-500 rounded-t-sm" style={{height: `${h}%`}} />
                                        ))}
                                    </div>
                                    <div className="text-center text-xs font-mono mt-2 text-slate/50">Updated Chart (v2)</div>
                                </div>
                            }
                        />
                        
                         <NotebookCell 
                            index={4}
                            isActive={true}
                            icon={<Download className="w-4 h-4" />}
                            title="Share"
                            code={`# Export as standalone HTML\nvw.export("sales_dashboard.html")`}
                            output={
                                <div className="text-slate/60 text-xs flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Saved to ./sales_dashboard.html</span>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotebookGuide;