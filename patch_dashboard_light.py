import re

with open('src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix CartesianGrid stroke
grid_old = r"""<CartesianGrid strokeDasharray="3 3" vertical=\{false\} \nstroke="rgba\(255,255,255,0\.05\)" />"""
grid_new = """<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />"""
content = re.sub(grid_old, grid_new, content)

# Fix another CartesianGrid if exists (maybe it was on one line)
content = content.replace('stroke="rgba(255,255,255,0.05)"', 'stroke="var(--chart-grid)"')

# Fix AreaChart colors for main chart (from #10b981 to #8b5cf6 / Violet)
content = content.replace('stopColor="#10b981"', 'stopColor="#8b5cf6"')
content = content.replace('stroke="#10b981"', 'stroke="#8b5cf6"')
content = content.replace("fill: '#10b981'", "fill: '#8b5cf6'")

# Change title text style from white gradient to theme-aware
title_old = r"background: 'linear-gradient\(to right, white, #94a3b8\)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'"
title_new = "color: 'var(--text-primary)'"
content = content.replace(title_old, title_new)

# Fix hover bg for recent deals
hover_old = "hover:bg-white/[0.03]"
hover_new = ""
content = content.replace(hover_old, hover_new)

with open('src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dashboard.jsx patched")
