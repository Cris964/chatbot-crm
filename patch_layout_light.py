import re

with open('src/components/Layout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Lucide Imports
import_old = r"Package, ShieldCheck, Megaphone, AlertCircle, CreditCard\n} from 'lucide-react'"
import_new = "Package, ShieldCheck, Megaphone, AlertCircle, CreditCard, Sun, Moon\n} from 'lucide-react'"
content = content.replace(import_old, import_new)

# 2. Add Theme State
state_old = "const [mobileOpen, setMobileOpen] = useState(false)"
state_new = "const [mobileOpen, setMobileOpen] = useState(false)\n  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')"
content = content.replace(state_old, state_new)

# 3. Add Theme useEffect
effect_old = "useEffect(() => {\n    setMobileOpen(false)\n  }, [location.pathname])"
effect_new = "useEffect(() => {\n    setMobileOpen(false)\n  }, [location.pathname])\n\n  useEffect(() => {\n    document.documentElement.setAttribute('data-theme', theme)\n    localStorage.setItem('theme', theme)\n  }, [theme])"
content = content.replace(effect_old, effect_new)

# 4. Add Toggle Button
button_old = r"""            <button className="header-action-btn" style={{ background: 'rgba\(99, 102, 241, 0\.1\)', color: 'var\(--primary-400\)' }} onClick=\{\(\) => setShowAIModal\(true\)\}>"""
button_new = """            <button className="header-action-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="header-action-btn" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)' }} onClick={() => setShowAIModal(true)}>"""
content = re.sub(button_old, button_new, content)

with open('src/components/Layout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Layout.jsx patched with theme toggle")
