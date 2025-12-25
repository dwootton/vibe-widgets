import{j as t}from"./index-D_8R8ZUm.js";import{D as i}from"./DocMdxPage-BvlSajtn.js";import"./DocContent-D7aio9c8.js";const o={title:"Reactivity",description:"Connect widgets with reactive inputs and outputs."};function s(n){const e={code:"code",p:"p",pre:"pre",...n.components};return t.jsxs(t.Fragment,{children:[t.jsx(e.p,{children:"Outputs are reactive state handles that can be passed into other widgets."}),`
`,t.jsx(e.pre,{children:t.jsx(e.code,{className:"language-python",children:`scatter = vw.create(
    "scatter plot with brush selection tool",
    df,
    outputs=vw.outputs(selected_indices="indices of selected points")
)

histogram = vw.create(
    "histogram with highlighted bars for selected data",
    vw.inputs(df, selected_indices=scatter.outputs.selected_indices)
)
`})}),`
`,t.jsxs(e.p,{children:["When you select points in the scatter plot, the histogram updates via trait syncing. Outputs are exposed under ",t.jsx(e.code,{children:"widget.outputs.<name>"}),"."]})]})}function c(n={}){const{wrapper:e}=n.components||{};return e?t.jsx(e,{...n,children:t.jsx(s,{...n})}):s(n)}const p=()=>t.jsx(i,{Content:c,meta:o});export{p as default};
