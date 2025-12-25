import React from 'react';
import DocContent from './DocContent';
import CodeBlock from './CodeBlock';
import { DOC_PAGE_MAP } from '../data/docsContent';

const renderHtml = (html: string) => (
    <span dangerouslySetInnerHTML={{ __html: html }} />
);

const DocPageRenderer = ({ pageId }: { pageId: string }) => {
    const page = DOC_PAGE_MAP[pageId];

    if (!page) {
        return (
            <DocContent title="Not Found">
                <p>This documentation section is under construction.</p>
            </DocContent>
        );
    }

    return (
        <DocContent title={page.title}>
            {page.blocks.map((block, index) => {
                if (block.type === 'lead') {
                    return (
                        <p key={`${page.id}-lead-${index}`} className="text-xl text-slate/70 mb-8">
                            {renderHtml(block.text)}
                        </p>
                    );
                }
                if (block.type === 'paragraph') {
                    return (
                        <p key={`${page.id}-p-${index}`}>
                            {renderHtml(block.text)}
                        </p>
                    );
                }
                if (block.type === 'heading') {
                    const HeadingTag = block.level === 3 ? 'h3' : 'h2';
                    return (
                        <HeadingTag key={`${page.id}-h-${index}`}>
                            {block.text}
                        </HeadingTag>
                    );
                }
                if (block.type === 'code') {
                    return (
                        <CodeBlock
                            key={`${page.id}-code-${index}`}
                            code={block.code}
                            language={block.language}
                        />
                    );
                }
                if (block.type === 'list') {
                    return (
                        <ul key={`${page.id}-list-${index}`}>
                            {block.items.map((item, itemIndex) => (
                                <li key={`${page.id}-list-${index}-${itemIndex}`}>{renderHtml(item)}</li>
                            ))}
                        </ul>
                    );
                }
                if (block.type === 'table') {
                    return (
                        <table key={`${page.id}-table-${index}`} className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="text-left border-b border-slate/10">
                                    {block.headers.map((header, headerIndex) => (
                                        <th
                                            key={`${page.id}-table-${index}-head-${headerIndex}`}
                                            className="py-2 pr-4 font-mono text-[10px] uppercase tracking-widest text-slate/40"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {block.rows.map((row, rowIndex) => (
                                    <tr
                                        key={`${page.id}-table-${index}-row-${rowIndex}`}
                                        className={rowIndex < block.rows.length - 1 ? 'border-b border-slate/10' : undefined}
                                    >
                                        {row.map((cell, cellIndex) => (
                                            <td key={`${page.id}-table-${index}-cell-${rowIndex}-${cellIndex}`} className="py-2 pr-4">
                                                {renderHtml(cell)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                }
                if (block.type === 'placeholder') {
                    return (
                        <div key={`${page.id}-placeholder-${index}`} className="bg-white border-2 border-slate rounded-xl p-4 shadow-hard-sm">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate/40">{block.label}</div>
                            {block.allowHtmlCaption ? (
                                <div className="mt-2 text-sm text-slate/60 font-mono" dangerouslySetInnerHTML={{ __html: block.caption }} />
                            ) : (
                                <div className="mt-2 text-sm text-slate/60 font-mono">{block.caption}</div>
                            )}
                        </div>
                    );
                }

                return null;
            })}
        </DocContent>
    );
};

export default DocPageRenderer;
