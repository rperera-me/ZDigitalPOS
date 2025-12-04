const { JSDOM } = require('jsdom');
const Handlebars = require('handlebars');

class HtmlToEscposConverter {
  constructor(printer) {
    this.printer = printer;
    this.paperWidth = 32; // 32 characters for 80mm paper
  }

  /**
   * Convert HTML template to ESC/POS commands
   * @param {string} htmlTemplate - Handlebars HTML template
   * @param {object} data - Data to populate template
   */
  async convert(htmlTemplate, data) {
    // 1. Compile and render Handlebars template
    const template = Handlebars.compile(htmlTemplate);
    const renderedHtml = template(data);

    // 2. Parse HTML
    const dom = new JSDOM(renderedHtml);
    const document = dom.window.document;

    // 3. Clear printer buffer
    this.printer.clear();

    // 4. Process DOM tree
    this.processNode(document.body);

    // 5. Add cut command
    this.printer.newLine();
    this.printer.newLine();
    this.printer.cut();

    // 6. Execute print
    await this.printer.execute();
  }

  /**
   * Recursively process DOM nodes
   */
  processNode(node) {
    if (!node) return;

    const nodeName = node.nodeName.toLowerCase();

    // Handle different HTML elements
    switch (nodeName) {
      case 'div':
        this.processDiv(node);
        break;
      case 'p':
        this.processParagraph(node);
        break;
      case 'h1':
      case 'h2':
      case 'h3':
        this.processHeading(node);
        break;
      case 'table':
        this.processTable(node);
        break;
      case 'img':
        this.processImage(node);
        break;
      case 'hr':
        this.printer.drawLine();
        break;
      case 'strong':
      case 'b':
        this.printer.bold(true);
        this.processChildren(node);
        this.printer.bold(false);
        break;
      case 'span':
        this.processSpan(node);
        break;
      case '#text':
        this.processText(node);
        break;
      default:
        // Process children for unknown elements
        this.processChildren(node);
    }
  }

  processDiv(node) {
    const classes = node.className || '';

    // Handle special divs based on class
    if (classes.includes('receipt-header')) {
      this.printer.alignCenter();
      this.processChildren(node);
      this.printer.alignLeft();
      this.printer.drawLine();
    } else if (classes.includes('receipt-info')) {
      this.processChildren(node);
      this.printer.drawLine();
    } else if (classes.includes('totals-section')) {
      this.processChildren(node);
    } else if (classes.includes('total-row')) {
      this.processTotalRow(node);
    } else if (classes.includes('savings-section')) {
      this.printer.alignCenter();
      this.printer.bold(true);
      this.processChildren(node);
      this.printer.bold(false);
      this.printer.alignLeft();
    } else if (classes.includes('loyalty-info')) {
      this.printer.drawLine();
      this.printer.alignCenter();
      this.processChildren(node);
      this.printer.alignLeft();
    } else if (classes.includes('thank-you')) {
      this.printer.drawLine();
      this.printer.alignCenter();
      this.printer.bold(true);
      this.processChildren(node);
      this.printer.bold(false);
      this.printer.alignLeft();
    } else if (classes.includes('footer')) {
      this.printer.alignCenter();
      this.printer.setTextSize(0, 0);
      this.processChildren(node);
      this.printer.setTextNormal();
      this.printer.alignLeft();
    } else {
      this.processChildren(node);
    }
  }

  processParagraph(node) {
    const text = this.getTextContent(node);
    if (text.trim()) {
      this.printer.println(text.trim());
    }
  }

  processHeading(node) {
    const level = parseInt(node.nodeName.charAt(1));
    const text = this.getTextContent(node);
    
    this.printer.bold(true);
    if (level <= 2) {
      this.printer.setTextSize(1, 1);
    }
    this.printer.println(text.trim());
    this.printer.setTextNormal();
    this.printer.bold(false);
  }

  processTable(node) {
    const thead = node.querySelector('thead');
    const tbody = node.querySelector('tbody');

    // Process table header
    if (thead) {
      this.printer.bold(true);
      const headerRow = thead.querySelector('tr');
      if (headerRow) {
        this.processTableRow(headerRow, true);
      }
      this.printer.bold(false);
      this.printer.drawLine();
    }

    // Process table body
    if (tbody) {
      const rows = tbody.querySelectorAll('tr');
      rows.forEach((row, index) => {
        const classes = row.className || '';
        
        if (classes.includes('item-separator')) {
          this.printer.println('- - - - - - - - - - - - - - - -');
        } else if (classes.includes('item-name-row')) {
          // Full width item name
          const cell = row.querySelector('td');
          if (cell) {
            this.printer.println(this.getTextContent(cell).trim());
          }
        } else if (classes.includes('item-details-row')) {
          // Item details in columns
          this.processTableRow(row, false);
        } else {
          // Check if first cell has colspan
          const firstCell = row.querySelector('td');
          if (firstCell && firstCell.getAttribute('colspan')) {
            // Full width row (item name)
            this.printer.println(this.getTextContent(firstCell).trim());
          } else {
            // Regular row with columns
            this.processTableRow(row, false);
          }
        }
      });
    }

    this.printer.drawLine();
  }

  processTableRow(row, isHeader) {
    const cells = row.querySelectorAll(isHeader ? 'th' : 'td');
    if (cells.length === 0) return;

    const columns = [];
    
    cells.forEach(cell => {
      const text = this.getTextContent(cell).trim();
      const align = this.getAlignment(cell);
      const width = 1 / cells.length; // Equal width distribution
      
      columns.push({
        text: text,
        align: align.toUpperCase(),
        width: width
      });
    });

    if (columns.length > 0) {
      this.printer.tableCustom(columns);
    }
  }

  processTotalRow(node) {
    const classes = node.className || '';
    const spans = node.querySelectorAll('span');
    
    if (spans.length === 2) {
      const label = this.getTextContent(spans[0]).trim();
      const amount = this.getTextContent(spans[1]).trim();
      
      if (classes.includes('final-total')) {
        this.printer.bold(true);
        this.printer.setTextSize(1, 1);
      }
      
      // Create two-column layout
      const padding = this.paperWidth - label.length - amount.length;
      const line = label + ' '.repeat(Math.max(1, padding)) + amount;
      this.printer.println(line);
      
      if (classes.includes('final-total')) {
        this.printer.setTextNormal();
        this.printer.bold(false);
      }
    }
  }

  processSpan(node) {
    const classes = node.className || '';
    
    if (classes.includes('amount')) {
      // Already handled in processTotalRow
      return;
    }
    
    this.processChildren(node);
  }

  processImage(node) {
    // Skip images for thermal printers
    // Or implement image printing if needed
    const alt = node.getAttribute('alt') || '';
    if (alt) {
      this.printer.println(`[${alt}]`);
    }
  }

  processText(node) {
    const text = node.textContent;
    if (text && text.trim()) {
      // Don't print standalone text nodes, they're handled by parent elements
    }
  }

  processChildren(node) {
    node.childNodes.forEach(child => {
      this.processNode(child);
    });
  }

  getTextContent(node) {
    // Get text content, handling nested elements
    let text = '';
    node.childNodes.forEach(child => {
      if (child.nodeType === 3) { // Text node
        text += child.textContent;
      } else if (child.nodeName.toLowerCase() === 'strong' || 
                 child.nodeName.toLowerCase() === 'b') {
        text += child.textContent;
      } else {
        text += this.getTextContent(child);
      }
    });
    return text;
  }

  getAlignment(element) {
    const style = element.getAttribute('style') || '';
    const textAlign = element.style?.textAlign;
    
    if (textAlign) {
      return textAlign;
    }
    
    if (style.includes('text-align:left')) return 'left';
    if (style.includes('text-align:right')) return 'right';
    if (style.includes('text-align:center')) return 'center';
    
    return 'left';
  }
}

module.exports = HtmlToEscposConverter;