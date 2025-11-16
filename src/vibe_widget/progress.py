import anywidget
import traitlets


class ProgressWidget(anywidget.AnyWidget):
    _esm = """
    function render({ model, el }) {
      el.innerHTML = `
        <style>
          .activity-log {
            max-height: 200px;
            overflow-y: auto;
            font-family: inherit;
            font-size: 0.9em;
            line-height: 1.5;
            background-color: #000;
            color: #fff;
            padding: 10px;
            border-radius: 4px;
          }
          .activity-log div {
            padding: 2px 0;
          }
        </style>
        <div class="activity-log" id="activityLog"></div>
      `;
      
      const activityLog = el.querySelector('#activityLog');
      
      function updateActivityLog() {
        const timelineItems = model.get('timeline_items');
        const microBubbles = model.get('micro_bubbles');
        const actionTiles = model.get('action_tiles');
        const status = model.get('status');
        
        if (status === 'complete') {
          el.innerHTML = '';
          return;
        }
        
        activityLog.innerHTML = '';
        
        if (timelineItems && timelineItems.length > 0) {
          timelineItems.forEach(item => {
            const div = document.createElement('div');
            const statusIcon = item.complete ? '✓' : '○';
            div.textContent = `${statusIcon} ${item.title} - ${item.description}`;
            activityLog.appendChild(div);
          });
        }
        
        if (microBubbles && microBubbles.length > 0) {
          microBubbles.forEach(bubble => {
            const div = document.createElement('div');
            const cleanMessage = bubble.message.replace(/[📦⚙️📊🎨📏📐🔄🎯✨👆]/g, '').trim();
            div.textContent = `  ${cleanMessage}`;
            activityLog.appendChild(div);
          });
        }
        
        if (actionTiles && actionTiles.length > 0) {
          actionTiles.forEach(action => {
            const div = document.createElement('div');
            const cleanMessage = action.message.replace(/[📦⚙️📊🎨📏📐🔄🎯✨👆]/g, '').trim();
            div.textContent = `  ${cleanMessage}`;
            activityLog.appendChild(div);
          });
        }
        
        activityLog.scrollTop = activityLog.scrollHeight;
      }
      
      updateActivityLog();
      model.on('change:timeline_items', updateActivityLog);
      model.on('change:micro_bubbles', updateActivityLog);
      model.on('change:action_tiles', updateActivityLog);
      model.on('change:status', updateActivityLog);
    }
    
    export default { render };
    """
    
    micro_bubbles = traitlets.List([]).tag(sync=True)
    action_tiles = traitlets.List([]).tag(sync=True)
    progress = traitlets.Float(0.0).tag(sync=True)
    stream_text = traitlets.Unicode("").tag(sync=True)
    status = traitlets.Unicode("running").tag(sync=True)
    log_visible = traitlets.Bool(False).tag(sync=True)
    timeline_items = traitlets.List([]).tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(
            micro_bubbles=[],
            action_tiles=[],
            progress=0,
            stream_text="",
            status="running",
            log_visible=False,
            timeline_items=[],
            **kwargs
        )
        
    def add_micro_bubble(self, message: str):
        """Add an ephemeral status bubble."""
        bubbles = list(self.micro_bubbles)
        bubbles.append({"message": message, "new": True})
        self.micro_bubbles = bubbles
        
        # Reset 'new' flag after a tick
        import threading
        def reset_new():
            import time
            time.sleep(0.1)
            bubbles_reset = list(self.micro_bubbles)
            if bubbles_reset:
                bubbles_reset[-1]["new"] = False
                self.micro_bubbles = bubbles_reset
        threading.Thread(target=reset_new).start()
    
    def add_action_tile(self, icon: str, message: str):
        """Add a permanent action tile."""
        tiles = list(self.action_tiles)
        tiles.append({"icon": icon, "message": message})
        self.action_tiles = tiles
    
    def add_timeline_item(self, title: str, description: str, icon: str = "○", complete: bool = False):
        """Add an item to the timeline."""
        items = list(self.timeline_items)
        items.append({
            "title": title,
            "description": description,
            "icon": icon,
            "complete": complete
        })
        self.timeline_items = items
    
    def update_progress(self, percentage: float):
        """Update the progress bar."""
        self.progress = min(100, max(0, percentage))
    
    def add_stream(self, text: str):
        """Add text to the console stream."""
        self.stream_text += text
    
    def complete(self):
        """Mark as complete and show log toggle."""
        self.status = "complete"
        self.progress = 100
        self.log_visible = True
    
    def error(self, message: str):
        """Mark as error."""
        self.status = "error"
        self.stream_text += f"\n\nError: {message}"
