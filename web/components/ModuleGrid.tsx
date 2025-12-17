import React from 'react';
import { motion } from 'framer-motion';
import { Network, Database, Layers, Wand2, Share2, Box } from 'lucide-react';
import { FeatureCardProps } from '../types';

const features: FeatureCardProps[] = [
    {
        title: "Speak Human",
        description: "Describe your viz in plain English. The AI writes production-ready React.",
        icon: <Wand2 className="w-6 h-6" />,
    },
    {
        title: "Linked Widgets",
        description: "Select points in one chart → instantly updates another.",
        icon: <Network className="w-6 h-6" />,
    },
    {
        title: "Universal Data",
        description: "Works with DataFrames, CSV, JSON, NetCDF, PDF tables, and more.",
        icon: <Database className="w-6 h-6" />,
    },
    {
        title: "Composition",
        description: "Create interactive dashboards where widgets communicate.",
        icon: <Layers className="w-6 h-6" />,
    },
    {
        title: "Smart Caching",
        description: "Generated widgets are automatically cached to disk.",
        icon: <Box className="w-6 h-6" />,
    },
    {
        title: "Multi-Model",
        description: "Choose between Claude, GPT, Gemini, or OpenRouter models.",
        icon: <Share2 className="w-6 h-6" />,
    }
];

const ModuleCard: React.FC<{ feature: FeatureCardProps, index: number }> = ({ feature, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
            className="bg-white border-2 border-slate rounded-lg p-6 shadow-hard hover:shadow-hard-lg hover:border-orange transition-all cursor-default group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-bone border-2 border-slate/10 rounded-full flex items-center justify-center group-hover:bg-orange group-hover:text-white group-hover:border-orange transition-colors">
                    {feature.icon}
                </div>
                <span className="font-mono text-xs text-slate/30">MOD-0{index + 1}</span>
            </div>
            
            <h3 className="text-xl font-bold font-display mb-2 group-hover:text-orange transition-colors">{feature.title}</h3>
            <p className="text-slate/70 font-sans leading-relaxed text-sm">
                {feature.description}
            </p>
        </motion.div>
    );
};

const ModuleGrid = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-20">
            <div className="mb-16">
                <h2 className="text-4xl font-display font-bold mb-4">Your Toolkit</h2>
                <div className="h-1 w-24 bg-orange" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, idx) => (
                    <ModuleCard key={idx} feature={feature} index={idx} />
                ))}
            </div>
        </div>
    );
};

export default ModuleGrid;