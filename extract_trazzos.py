import os
from docx import Document

trazzos_path = r'C:\Users\keine\.gemini\antigravity\scratch\trazzos'
output_file = r'C:\Users\keine\.gemini\antigravity\scratch\crm-saas\trazzos_training.txt'

files = [
    "ENTREGABLE  entrenamiento trearq IA CRM.docx",
    "ENTREGABLE entrenamiento IA CRM.docx",
    "ENTREGABLE tecnico IA CRM.docx",
    "Entrenamiento respuestas trazzos.docx"
]

with open(output_file, 'w', encoding='utf-8') as f:
    for filename in files:
        file_path = os.path.join(trazzos_path, filename)
        if os.path.exists(file_path):
            f.write(f"\n{'='*50}\nFILE: {filename}\n{'='*50}\n")
            try:
                doc = Document(file_path)
                for para in doc.paragraphs:
                    f.write(para.text + '\n')
            except Exception as e:
                f.write(f"Error reading {filename}: {str(e)}\n")
        else:
            f.write(f"File not found: {filename}\n")

print(f"Extracted training data to {output_file}")
