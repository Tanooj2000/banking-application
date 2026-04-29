const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const baseDir = 'C:\\Users\\SH20580875\\BankingAppPOC\\banking-application\\banking-application-frontend\\docs\\frontend\\pdf';

  const jobs = [
    {
      html: path.join(baseDir, 'frontend-documentation-guide.html'),
      pdf: path.join(baseDir, 'Frontend-Documentation-Guide.pdf'),
      title: 'Frontend Documentation Guide'
    },
    {
      html: path.join(baseDir, 'chatbot-addon-implementation-guide.html'),
      pdf: path.join(baseDir, 'Chatbot-Addon-Implementation-Guide.pdf'),
      title: 'Chatbot Add-On Implementation Guide'
    }
  ];

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  try {
    for (const job of jobs) {
      const page = await browser.newPage();
      const url = 'file:///' + job.html.replace(/\\/g, '/');
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.pdf({
        path: job.pdf,
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `<div style="width:100%;font-size:9px;padding:0 10mm;color:#666;display:flex;justify-content:space-between;"><span>${job.title}</span><span class="pageNumber"></span>/<span class="totalPages"></span></div>`
      });
      await page.close();
      console.log('CREATED:' + job.pdf);
    }
  } finally {
    await browser.close();
  }
})();
