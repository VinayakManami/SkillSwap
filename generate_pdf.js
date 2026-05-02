const fs = require('fs');
const puppeteer = require('puppeteer');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ html: true });

async function generatePDF() {
  const content = fs.readFileSync('SkillSwap_Final_Report.md', 'utf8');
  // Simple CSS to make it look like a report
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .page { padding: 2cm; }
        h1 { border-bottom: 2px solid #2563eb; color: #1e3a8a; padding-bottom: 5px; margin-top: 40px; page-break-before: always; }
        h1:first-child { page-break-before: auto; }
        h2 { color: #1d4ed8; margin-top: 30px; }
        h3 { color: #2563eb; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8fafc; font-weight: bold; }
        img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px 0; }
        code { background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
        pre { background-color: #1e293b; color: #f8fafc; padding: 15px; border-radius: 8px; overflow-x: auto; page-break-inside: avoid; }
        pre code { background-color: transparent; color: inherit; padding: 0; }
        .title-page { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
        .title-page h1 { border: none; font-size: 3em; color: #1e3a8a; margin-bottom: 10px; page-break-before: auto; }
        .title-page h2 { color: #64748b; font-weight: normal; }
      </style>
    </head>
    <body>
      <div class="page">
        ${md.render(content)}
      </div>
    </body>
    </html>
  `;

  // Fix image paths for puppeteer by converting them to base64 data URIs
  const absoluteHtml = html.replace(/src="report_images\/([^"]+)"/g, (match, filename) => {
    try {
      const imgPath = require('path').join(__dirname, 'report_images', filename);
      const base64 = fs.readFileSync(imgPath).toString('base64');
      return `src="data:image/png;base64,${base64}"`;
    } catch(e) {
      console.error('Failed to load image:', filename, e);
      return match;
    }
  });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setContent(absoluteHtml, { waitUntil: 'networkidle0' });
  
  console.log('Generating PDF...');
  await page.pdf({ 
    path: 'SkillSwap_Final_Report.pdf', 
    format: 'A4', 
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' } 
  });
  
  await browser.close();
  console.log('PDF generation complete: SkillSwap_Final_Report.pdf');
}

generatePDF().catch(console.error);
