const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const Handlebars = require("handlebars");
const HtmlToEscposConverter = require("./htmlToEscposConverter");

class ThermalPrinterService {
  constructor() {
    this.printer = null;
    this.converter = null;
    this.templates = new Map(); // Store multiple templates
    
    this.config = {
      type: PrinterTypes.EPSON,
      interface: 'tcp://192.168.1.100', // Configure this
      characterSet: 'SLOVENIA',
      removeSpecialCharacters: false,
      lineCharacter: "-",
      options: {
        timeout: 5000
      }
    };
    
    this.registerHandlebarsHelpers();
  }

  initialize() {
    this.printer = new ThermalPrinter(this.config);
    this.converter = new HtmlToEscposConverter(this.printer);
  }

  registerHandlebarsHelpers() {
    // Register i18n helper
    if (!Handlebars.helpers.i18n) {
      Handlebars.registerHelper("i18n", function(key, options) {
        return options.data.root.i18n(key);
      });
    }

    // Register formatCurrency helper
    if (!Handlebars.helpers.formatCurrency) {
      Handlebars.registerHelper("formatCurrency", function(value) {
        const num = parseFloat(value) || 0;
        return `${num.toFixed(2)}`;
      });
    }

    // Register eq helper
    if (!Handlebars.helpers.eq) {
      Handlebars.registerHelper("eq", function(a, b) {
        return a === b;
      });
    }

    // Register gt helper
    if (!Handlebars.helpers.gt) {
      Handlebars.registerHelper("gt", function(a, b) {
        return a > b;
      });
    }
  }

  /**
   * Register a new receipt template
   * @param {string} templateName - Unique template identifier
   * @param {string} htmlTemplate - Handlebars HTML template string
   */
  registerTemplate(templateName, htmlTemplate) {
    this.templates.set(templateName, htmlTemplate);
  }

  /**
   * Get a registered template
   * @param {string} templateName - Template identifier
   */
  getTemplate(templateName) {
    return this.templates.get(templateName);
  }

  async isConnected() {
    try {
      return await this.printer.isPrinterConnected();
    } catch (error) {
      console.error("Printer connection check failed:", error);
      return false;
    }
  }

  /**
   * Format receipt data (same as before)
   */
  formatReceiptData(saleData, t) {
    // Calculate points
    const pointsEarned = saleData.customer?.type === "loyalty" && 
                         saleData.customer?.creditBalance <= 0
      ? Math.floor(saleData.finalAmount / 100)
      : 0;

    // Calculate total paid
    const totalPaid = saleData.payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) 
      || parseFloat(saleData.amountPaid || 0);

    // Calculate savings
    const savings = saleData.saleItems?.reduce((sum, item) => {
      const regularPrice = parseFloat(item.regularPrice || item.price);
      const sellingPrice = parseFloat(item.price);
      const quantity = parseFloat(item.quantity || 1);
      return sum + ((regularPrice - sellingPrice) * quantity);
    }, 0) || 0;

    // Enhance items
    const enhancedItems = (saleData.saleItems || []).map(item => ({
      ...item,
      regularPrice: item.regularPrice || item.price,
      total: parseFloat(item.price) * parseFloat(item.quantity || 1)
    }));

    return {
      storeName: saleData.storeName || "",
      storeAddress: saleData.storeAddress || "",
      storeContact: saleData.storeContact || "",
      invoiceNo: saleData.invoiceNo || saleData.id || "",
      date: new Date(saleData.date).toLocaleString(),
      cashier: saleData.cashier || "",
      customer: saleData.customer || null,
      items: enhancedItems,
      totalAmount: saleData.totalAmount,
      discountAmount: saleData.discountAmount || 0,
      finalAmount: saleData.finalAmount || saleData.totalAmount,
      totalPaid: totalPaid,
      change: saleData.change || 0,
      savings: savings > 0 ? savings : null,
      pointsEarned: pointsEarned,
      i18n: t // Translation function for Handlebars
    };
  }

  /**
   * Print receipt using HTML template
   * @param {object} saleData - Sale data
   * @param {function} t - Translation function
   * @param {string} templateName - Template to use (default: 'standard')
   */
  async printReceipt(saleData, t, templateName = 'standard') {
    try {
      const isConnected = await this.isConnected();
      if (!isConnected) {
        throw new Error("Printer not connected");
      }

      // Get template
      const htmlTemplate = this.getTemplate(templateName);
      if (!htmlTemplate) {
        throw new Error(`Template '${templateName}' not found`);
      }

      // Format data
      const formattedData = this.formatReceiptData(saleData, t);

      // Convert HTML to ESC/POS and print
      await this.converter.convert(htmlTemplate, formattedData);
      
      return { success: true };
    } catch (error) {
      console.error("Thermal print error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ThermalPrinterService();