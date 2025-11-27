# Vibe Widget

![Python Version](https://img.shields.io/badge/python-3.9%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Multi-Provider](https://img.shields.io/badge/LLM-Multi%20Provider-blueviolet)
![PyPI - Version](https://img.shields.io/pypi/v/vibe-widget)
![PyPI - Downloads](https://img.shields.io/pypi/dm/vibe-widget)



## What is Vibe Widget?
```python
                                                                                               
                                                                                               
                                ...::-==+**######*++=-::...                                    
                            ..:-+*###*###################*+=:..                                
                         ..-******#########*****###############=..                             
                      ..-*********                       #########=:.                          
                   ..-+******#                               #######*-..                       
                 ..-****                                           ####=.                      
                .:*#**  ##**                                 ####    %###-.                    
               .+***   ##****#                             #######     ###*:.                  
             .-***    ##*****###                         ##########      ##%+.                 
            .=*#*     ##*#########                     ############%      %%%*:.               
           .+**#     ###############                 *##############       %%#*:.              
         ..+***     ################################################%       %#%#:.             
         .+#**      ###############################################%%        %%%#:.            
        .-*##      ##########################################%##%%%%%%        %%%+.            
       .:*#*       ########################################%%%%%%%%%%%         %%#-.           
       .=#*    #### ######################################%%%%%%%%%%%# %%%%%    %%*.           
    ..:=**##*##########################################%%%%%%%%%%%%%%# %%%%%%%%%%%%+-.         
  ..=******##*########################################%%%%%%%%%%%%%%%% %%%%%%%%%%%%%%%=.       
 .:**##****###=:+#################################%%%%%%%%%%%%%%%%%%%% %%%%% %%%%%%%%%%%:.     
.:+*:*######*==+*###############################%#%%%%%%%%%%%%%%%%%%%% %%%%%%%%%   %% %%#-.    
.=**:*#*--*+-*=:################*--*###########%%%%%%%#=-*%%%%%%%%%%%% %%%% %%%%%%%%%%%%%*.    
.+#*:+-=*****+:.*##############=....-########%%%%%%%%#....-#%%%%%%%%%% %%%%% %%%  %%%%%%%#:    
.+#*:*++=.+-.+++*##############=....=######%%%%%%%%%%#....-#%%%%%%%%%% %%%%%%%%%%%%%%%%%%#:.   
.=#*:=.==.+-+=+**-*##############++*##%%%%*...-#%%%%%%#*+*%%%%%%%%%%%% %%%%%%%%%%%% %%#%%*.    
 :**:++++++++=###+=######################%#-..=%%#%%%%%%%%%%%%%%%%%%%% %%%%% #%%%%%%  #%#-.    
 .:*#########=-=-:+####################--#%+.:#%+.*%%%%%%%%%%%%%%%%%%% %%%%%#%%%%%%%%%%%-.     
   .=#########*###=.+################%%#+..-**..=#%%%%%%%%%%%%%%%%%%%% %%%%%%%%%%%%%%%+.       
     .-*############%############%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% %%%%% %%%%%##=..        
       ..-##   #### ###########%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% %%%%%   #%+..           
        .:*## %   ##########%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%   %% %%%-.            
         .-###%###########%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% %%*.             
          .+## ##########%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% %%#.              
          ..+## %######%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% %%#:.              
            .+## %%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% %%#-.               
             .+### %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#:.                
              .-### %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% #%%*..                 
                :*%%% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  %%#-.                   
                 .-#%%% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% #%%+.                     
                   .-#%%% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% #%%%+:                       
                     .:#%%%   %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%=..                        
                       .:=#%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%*-..                          
                          ..-*%%%%%%   %%%%%%%%%%%%%   %%%%%%%=:..                             
                              ..:*#%%%%%%%%%%%%%%%%%%%%%%#=...                                 
                                  ....:=+++******++=-:....                                     
                                         ..  .                                                 
           %%%                                    %%                                           
           %%%%%%%%                              %%%%      %%%%                     %%%        
  %%    %%  %% %%%%%%%      %%%    %%    %    %%  %%    %%%%%%%   %%%  %%    %%%   %%%%%%      
 %%%%  %%%%%%% %%%%%%%%%  %%%%%%%%%%%% %%%%  %%%%%%%% %%%%%%%%% %%%%%%%%%  %%%%%%%%%%%%%%%     
  %%%%%%%% %%% %%%%  %%%%%%%%%%%%% %%% %%%%% %%% %%%% %%%  %%%% %%%   %%% %%%%%%%%% %%%%       
   %%%%%%  %%% %%%%  %%%%%%%%%%%%% %%%%%%%%%%%%  %%%% %%%  %%%% %%%% %%%% %%%%%%%%% %%%%       
    %%%%   %%% %%%%%%%%%  %%%%%%%%  %%%%% %%%%   %%%% %%%%%%%%%  %%%%%%%%  %%%%%%%% %%%%%%%    
     %%     %   %% %%%      %%%%      %%   %%     %%    %%% %%   %%  %%%%    %%%%     %%%%     
                                                                %%%%%%%%                       
                                                                                               
                                                                                               
```
yep

---

## Why Vibe Widget?

**→ Speak Human, Get Code**
Describe your viz in plain English. The AI writes production-ready React. You get interactive widgets. Everyone's happy.

**→ Widgets That Talk to Each Other**  
Select points in one chart → instantly updates another. Paint terrain → watch it render in 3D. It's like your visualizations are texting each other.

**→ Eat Any Data Format**  
Pandas DataFrames? Obviously. But also: CSV, JSON, NetCDF, XML, PDF tables, seismic data (ISF), scraped web pages, live streams. If it's data, we'll visualize it.

**→ Actually Custom Stuff**  
Not limited to "bar chart but blue this time." Want a 3D solar system? An interactive game board? A terrain painter? Just ask. The AI builds it from scratch.

**→ Smart Caching**  
Same description + data = instant load from cache. Different description = new widget, stored separately. It's like git for visualizations.

---

## Installation

```bash
pip install vibe-widget
```

Or with `uv`:
```bash
uv pip install vibe-widget
```

Set your API key (pick your AI flavor):
```bash
export ANTHROPIC_API_KEY='your-key'    # for Claude
export OPENAI_API_KEY='your-key'       # for GPT
export GEMINI_API_KEY='your-key'       # for Gemini
```

---

## Quickstart (Seriously, It's This Easy)

```python
import pandas as pd
import vibe_widget as vw

# Pick your AI (optional, defaults to Claude)
vw.config(model="gemini")  # or "openai" or "anthropic"

# Got data?
df = pd.read_csv('sales_data.csv')

# Describe what you want
widget = vw.create(
    "bar chart of sales by region, sorted high to low, with tooltips",
    df
)
```

The AI will analyze your data, write React code, validate it, fix any bugs, and render it. You just chill.

---

## Real Examples

**Basic Viz**
```python
df = pd.DataFrame({
    'planet': ['Mercury', 'Venus', 'Earth', 'Mars'],
    'distance': [0.39, 0.72, 1.0, 1.52],
    'mass': [0.055, 0.815, 1.0, 0.107]
})

widget = vw.create(
    "3D scatter plot: distance vs mass, size by mass, make it spinny",
    df
)
```

**Scrape the Web**
```python
widget = vw.create(
    "show Hacker News stories as cards, let me sort by score",
    "https://news.ycombinator.com"
)
```

**Extract PDF Tables**
```python
widget = vw.create(
    "interactive table from this PDF with sorting",
    "report.pdf"
)
```

**Climate Data (NetCDF)**
```python
widget = vw.create(
    "heatmap of sea surface temps, zoomable",
    "ocean_data.nc"
)
```

**Linked Widgets (The Cool Part)**
```python
# Widget 1: Scatter with selection
scatter = vw.create(
    "scatter plot with brush selection",
    df,
    exports={"selected": "indices of selected points"}
)

# Widget 2: Histogram that reacts
histogram = vw.create(
    "histogram highlighting selected points from scatter",
    df,
    imports={"selected": scatter}
)

# Select in scatter → histogram updates instantly ✨
```

More examples: terrain editors, solar system explorers, game state visualizers → check [`examples/cross_widget_interactions.ipynb`](examples/cross_widget_interactions.ipynb)

---

## The Important Bits

**Data Handling**  
→ Auto-detects formats and types  
→ Samples huge datasets (>100k rows) smartly  
→ Supports CSV, JSON, NetCDF, XML, ISF, PDF, web scraping  

**Code Generation**  
→ LLM writes React components  
→ Validates and auto-fixes errors  
→ Iterates until it works  

**Widget Communication**  
→ Export/import system for state sharing  
→ Automatic sync between widgets  
→ Built on Jupyter widgets (ipywidgets)  

**Caching**  
→ Same input = instant cache hit  
→ Organized in `.vibewidget/` folder  
→ Track all your widget versions  

---

## API (The Only Function You Need)

```python
widget = vw.create(
    description="natural language description of your viz",
    data=df,                        # DataFrame, file path, or URL
    model="anthropic",              # "anthropic", "openai", or "gemini"
    exports={"trait": "description"},   # what this widget shares
    imports={"trait": other_widget},    # what this widget receives
)
```

**Description Tips**  
Be specific: "3D scatter with rotation" beats "show the data"  
Mention interactions: "with hover tooltips", "clickable legend"  
Style it: "dark theme", "sorted by value", "highlight outliers"  

**Data Sources**  
→ Pandas DataFrame (the classic)  
→ File paths: `.csv`, `.json`, `.nc`, `.xml`, `.isf`, `.pdf`  
→ URLs (we'll scrape it)  
→ `None` (for widgets driven purely by imports)  

**Model Selection**  
```python
vw.config(model="gemini", mode="standard")   # fast & cheap
vw.config(model="openai", mode="premium")    # powerful & pricey

# or per-widget
widget = vw.create("...", df, model="claude-3-5-sonnet")

# see all options
print(vw.models())
```

---

## Examples & Notebooks

→ [`examples/pdf_and_web_extraction.ipynb`](examples/pdf_and_web_extraction.ipynb) - PDFs and web scraping  
→ [`examples/cross_widget_interactions.ipynb`](examples/cross_widget_interactions.ipynb) - Linked visualizations  
→ [`tests/test_agentic_demo.ipynb`](tests/test_agentic_demo.ipynb) - Full test suite  

---

## How It Works

```
You type English
    ↓
DataProcessor figures out your data
    ↓
AI writes React code
    ↓
Tools validate & fix bugs
    ↓
WidgetStore caches it
    ↓
You get a working visualization
```

---

## Contributing

Want to make this better? Hell yeah.

```bash
git clone https://github.com/yourusername/vibe-widget.git
cd vibe-widget
pip install -e ".[dev]"
pytest
```

---

## License

MIT - do whatever you want with it

---

## Props To

→ Claude, GPT, and Gemini for the AI magic  
→ anywidget & ipywidgets for the Jupyter integration  
→ Traitlets for state management  
→ Crawl4AI for web scraping  
→ Camelot for PDF extraction  

---

**[⭐ Star on GitHub](https://github.com/yourusername/vibe-widget) | [📖 Docs](https://www.dylanwootton.com/vibe-widgets/index.html) | [🐛 Report Bug](https://github.com/yourusername/vibe-widget/issues)**

---

*Made with ✨vibes✨ and probably too much coffee*