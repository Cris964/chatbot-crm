import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

old_css = r"""\.nav-item \{
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  margin: 4px 12px;
  border-radius: var\(--radius-md\);
  color: var\(--text-secondary\);
  font-weight: 500;
  transition: all var\(--transition-fast\);
\}

\.nav-item:hover \{
  background: var\(--bg-hover\);
  color: var\(--text-primary\);
  transform: translateX\(4px\);
\}

\.nav-item\.active \{
  background: linear-gradient\(95deg, rgba\(99, 102, 241, 0\.15\), rgba\(99, 102, 241, 0\.05\)\);
  color: #a5b4fc;
  box-shadow: inset 0 0 0 1px rgba\(99, 102, 241, 0\.2\);
\}"""

new_css = """.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  margin: 6px 12px;
  border-radius: 12px;
  color: var(--text-secondary);
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.nav-item > * {
  z-index: 1;
}

.nav-item:hover {
  background: rgba(255,255,255,0.02);
  color: var(--text-primary);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.05);
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(16, 185, 129, 0.15));
  color: #fff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2), inset 0 0 0 1px rgba(99, 102, 241, 0.4);
  border: 1px solid transparent;
}"""

content = re.sub(old_css, new_css, content)

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)
print("index.css patched")
