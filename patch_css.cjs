const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace('--bg-primary: #0F0E17;', '--bg-primary: #12111A;');
css = css.replace('--bg-secondary: #161522;', '--bg-secondary: #1A1924;');
css = css.replace('--bg-tertiary: #1E1D2D;', '--bg-tertiary: #232231;');
css = css.replace('--glass-border: rgba(255, 255, 255, 0.08);', '--glass-border: rgba(255, 255, 255, 0.04);');

css += `
/* UI Refinements */
.chat-msg-bubble {
  border-radius: 12px !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  padding: 10px 14px !important;
  max-width: 75% !important;
}
.msg-client {
  border-bottom-left-radius: 4px !important;
  background: var(--bg-tertiary) !important;
  border: 1px solid var(--glass-border) !important;
}
.msg-agent {
  border-bottom-right-radius: 4px !important;
  background: var(--primary-700) !important;
  border: 1px solid var(--primary-600) !important;
}
.inbox-list {
  padding: 8px !important;
}
.inbox-item {
  border-radius: 10px !important;
  margin-bottom: 4px !important;
  border: none !important;
  transition: all 0.2s ease !important;
}
.inbox-item:hover {
  background: rgba(255,255,255,0.03) !important;
}
.inbox-item.active {
  background: rgba(99, 102, 241, 0.15) !important;
}
.card, .modal-content {
  border: 1px solid var(--glass-border) !important;
  box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
}
.btn {
  border-radius: 8px !important;
}
.form-control, .input, .form-input {
  border-radius: 8px !important;
  border: 1px solid var(--glass-border) !important;
  background: rgba(255,255,255,0.02) !important;
}
.form-control:focus, .input:focus, .form-input:focus {
  border-color: var(--primary-500) !important;
  background: rgba(255,255,255,0.05) !important;
}
`;

fs.writeFileSync('src/index.css', css);
console.log('CSS patched');
