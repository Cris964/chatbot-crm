const fs = require('fs');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle, ShadingType } = docx;

async function createDoc() {
    const bannerPath = 'C:\\Users\\eliza\\.gemini\\antigravity\\brain\\a97c1c96-bf51-4307-8702-c91c1b1920d6\\nexus_banner_1785784088333.jpg';
    let bannerBuffer;
    try {
        bannerBuffer = fs.readFileSync(bannerPath);
    } catch (e) {
        console.error("No image found, proceeding without it.", e);
        bannerBuffer = null;
    }

    const children = [];

    // Add Banner if exists
    if (bannerBuffer) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new ImageRun({
                    data: bannerBuffer,
                    transformation: {
                        width: 400,
                        height: 150,
                    },
                }),
            ],
            spacing: { after: 400 },
        }));
    }

    // Title
    children.push(new Paragraph({
        text: "DOCUMENTO DE ENTREGA OFICIAL",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    }));

    children.push(new Paragraph({
        text: "SISTEMA NEXUS CRM IA - ACTIVO MORRALES",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
    }));

    // Introduction
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Fecha de Entrega: ", bold: true }),
            new TextRun({ text: new Date().toLocaleDateString('es-CO') })
        ],
        spacing: { after: 200 }
    }));

    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Es un placer para el equipo de Nexus hacer la entrega oficial de su nueva plataforma inteligente de gestión comercial. Este sistema ha sido configurado y personalizado exclusivamente para cumplir con las necesidades operativas y comerciales de " }),
            new TextRun({ text: "Activo Morrales", bold: true }),
            new TextRun({ text: "." })
        ],
        spacing: { after: 400 },
        alignment: AlignmentType.JUSTIFIED,
    }));

    // Accesos
    children.push(new Paragraph({
        text: "1. CREDENCIALES DE ACCESO",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
    }));
    
    children.push(new Paragraph({
        text: "La plataforma es 100% en la nube. A continuación, se detallan los accesos para su asesora comercial:",
        spacing: { after: 200 }
    }));

    children.push(new Paragraph({
        children: [
            new TextRun({ text: "URL de Acceso: ", bold: true }),
            new TextRun({ text: "https://nexuscrmia.vercel.app/" })
        ],
        bullet: { level: 0 },
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Usuario (Asesora Daniela): ", bold: true }),
            new TextRun({ text: "daniela@activomorrales.com" })
        ],
        bullet: { level: 0 },
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Contraseña temporal: ", bold: true }),
            new TextRun({ text: "Activo2026*" })
        ],
        bullet: { level: 0 },
        spacing: { after: 400 }
    }));

    // Alcance y Funcionalidades
    children.push(new Paragraph({
        text: "2. ALCANCE Y FUNCIONALIDADES INTEGRADAS",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
    }));

    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Recepción y Atención Inteligente: ", bold: true }),
            new TextRun({ text: "La IA atiende 24/7 de forma inmediata, califica el interés del lead y filtra intenciones de compra." })
        ],
        bullet: { level: 0 }
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Enrutamiento Estratégico (Ventas por Mayor): ", bold: true }),
            new TextRun({ text: "Se configuró una regla estricta para que, si el cliente menciona ventas al por mayor, el bot asigne el chat inmediatamente a la asesora humana, priorizando el cierre de alto valor." })
        ],
        bullet: { level: 0 }
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Listas de Difusión y Remarketing: ", bold: true }),
            new TextRun({ text: "El CRM permite crear listas de difusión para estrategias de remarketing. Ya se encuentra cargado el mensaje promocional aprobado para incentivar recompras masivas a un solo clic." })
        ],
        bullet: { level: 0 }
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Métricas Comerciales (Dashboard): ", bold: true }),
            new TextRun({ text: "Métricas en tiempo real mostrando cuántos chats atiende la IA, cuántos la asesora y el impacto directo en las ventas y conversiones." })
        ],
        bullet: { level: 0 },
        spacing: { after: 400 }
    }));

    // Fase de Pruebas y Pagos
    children.push(new Paragraph({
        text: "3. GARANTÍA Y FASE DE PRUEBAS",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
    }));

    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Nexus CRM ofrece un periodo de garantía de " }),
            new TextRun({ text: "25 días calendario", bold: true }),
            new TextRun({ text: " a partir de esta entrega. Durante este tiempo:" })
        ],
        spacing: { after: 200 }
    }));
    children.push(new Paragraph({
        text: "Se podrán solicitar ajustes finos en el comportamiento de la IA y reglas de asignación.",
        bullet: { level: 0 }
    }));
    children.push(new Paragraph({
        text: "La empresa podrá familiarizarse plenamente con el sistema en un entorno real.",
        bullet: { level: 0 }
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Al finalizar estos 25 días, iniciará formalmente el cobro de la ", bold: true }),
            new TextRun({ text: "Administración Mensual", bold: true }),
            new TextRun({ text: " acordada." })
        ],
        bullet: { level: 0 },
        spacing: { after: 400 }
    }));

    // Soporte
    children.push(new Paragraph({
        text: "4. SOPORTE TÉCNICO",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
    }));

    children.push(new Paragraph({
        text: "Nuestra alianza no termina aquí. Contarán con soporte directo por parte del equipo de Nexus para cualquier eventualidad, asegurando que su operación nunca se detenga y escale con el tiempo.",
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 800 }
    }));

    // Firmas
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "____________________________________", bold: true })
        ],
        alignment: AlignmentType.CENTER,
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "Cristian Caicedo", bold: true, size: 28 })
        ],
        alignment: AlignmentType.CENTER,
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: "CEO, Nexus CRM IA", color: "666666" })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
    }));

    const doc = new Document({
        creator: "Nexus CRM IA",
        title: "Documento de Entrega - Activo Morrales",
        sections: [{
            properties: {},
            children: children,
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync('C:\\Users\\eliza\\Desktop\\Documento_Entrega_Activos_Nexus.docx', buffer);
    console.log("Document generated on Desktop!");
}

createDoc().catch(console.error);
