import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace variables block
old_vars_pattern = r":root \{.*?\n\}"
new_vars = """:root {
  /* Primary palette */
  --primary-50: #eef2ff;
  --primary-100: #e0e7ff;
  --primary-200: #c7d2fe;
  --primary-300: #a5b4fc;
  --primary-400: #818cf8;
  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  --primary-800: #3730a3;
  --primary-900: #312e81;

  /* Accent */
  --accent-cyan: #06b6d4;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  --accent-violet: #8b5cf6;
  --accent-pink: #ec4899;

  /* Theme variables (Dark Mode - Default) */
  --bg-primary: #13111C;
  --bg-secondary: #1A1924;
  --bg-tertiary: #212130;
  --bg-elevated: #28283B;
  --bg-hover: rgba(255, 255, 255, 0.05);
  --bg-active: rgba(255, 255, 255, 0.1);

  /* Borders & Glass */
  --glass-bg: #212130;
  --glass-border: rgba(255, 255, 255, 0.05);
  --border-default: rgba(255, 255, 255, 0.08);

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
  
  /* Charts & UI */
  --chart-grid: rgba(255, 255, 255, 0.05);
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.4);

  /* Sizing */
  --sidebar-width: 280px;
  --sidebar-collapsed: 80px;
  --header-height: 72px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 32px;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

[data-theme='light'] {
  /* Theme variables (Light Mode) */
  --bg-primary: #F3F4F6;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #FFFFFF;
  --bg-elevated: #FFFFFF;
  --bg-hover: rgba(0, 0, 0, 0.03);
  --bg-active: rgba(0, 0, 0, 0.06);

  /* Borders & Glass */
  --glass-bg: #FFFFFF;
  --glass-border: rgba(0, 0, 0, 0.05);
  --border-default: rgba(0, 0, 0, 0.08);

  /* Text */
  --text-primary: #111827;
  --text-secondary: #4B5563;
  --text-tertiary: #9CA3AF;
  
  /* Charts & UI */
  --chart-grid: rgba(0, 0, 0, 0.05);
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.05);
}"""

content = re.sub(old_vars_pattern, new_vars, content, flags=re.DOTALL)

# Update `.card` style to replace backdrop-filter with shadow
old_card_pattern = r"\.card \{.*?\n\}"
new_card = """.card {
  background: var(--glass-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}"""

content = re.sub(old_card_pattern, new_card, content, flags=re.DOTALL)

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("index.css patched with light mode")
