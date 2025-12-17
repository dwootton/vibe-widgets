import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import DynamicWidget from './DynamicWidget';
import { EXAMPLES } from '../data/examples';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const GalleryItem = ({ example, index, mode }: { example: typeof EXAMPLES[0], index: number, mode: 'horizontal' | 'grid' }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`
                bg-white border-2 border-slate rounded-xl p-6 shadow-hard flex flex-col gap-4
                ${mode === 'horizontal' ? 'min-w-[400px] md:min-w-[500px]' : 'w-full'}
            `}
        >
            <div className="h-[250px] bg-bone border border-slate/10 rounded-lg overflow-hidden relative shadow-inner">
                 <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
                 <div className="h-full w-full overflow-hidden">
                    <DynamicWidget code={example.code} />
                 </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-orange uppercase bg-orange/10 px-2 py-0.5 rounded">React</span>
                    <span className="text-xs font-mono text-slate/40 uppercase">V.0.{index+1}</span>
                </div>
                <h3 className="text-xl font-display font-bold">{example.label}</h3>
                <p className="font-mono text-xs text-slate/60 line-clamp-2">"{example.prompt}"</p>
            </div>
        </motion.div>
    );
};

interface WidgetGalleryProps {
    mode: 'horizontal' | 'grid';
}

const WidgetGallery = ({ mode }: WidgetGalleryProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: scrollRef });
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -500 : 500;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (mode === 'horizontal') {
        return (
            <div className="relative group/gallery">
                {/* Scroll Buttons */}
                <button 
                    onClick={() => scroll('left')} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white border-2 border-slate rounded-full shadow-hard flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:scale-110"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => scroll('right')} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white border-2 border-slate rounded-full shadow-hard flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:scale-110"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                <div ref={scrollRef} className="w-full overflow-x-auto overflow-y-hidden pb-12 scrollbar-hide px-4 md:px-12 flex gap-8 snap-x">
                     {EXAMPLES.map((ex, i) => (
                        <div key={ex.id} className="snap-center">
                            <GalleryItem example={ex} index={i} mode="horizontal" />
                        </div>
                     ))}
                     <div className="min-w-[300px] flex items-center justify-center snap-center">
                         <Link to="/gallery" className="group flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full border-2 border-slate flex items-center justify-center group-hover:bg-orange group-hover:border-orange group-hover:text-white transition-all">
                                <ArrowRight className="w-6 h-6" />
                            </div>
                            <span className="font-display font-bold text-xl">View All</span>
                         </Link>
                     </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-12 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {EXAMPLES.map((ex, i) => (
                    <GalleryItem key={ex.id} example={ex} index={i} mode="grid" />
                ))}
            </div>
        </div>
    );
};

export default WidgetGallery;