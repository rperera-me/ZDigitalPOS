const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const HtmlToEscposConverter = require("./htmlToEscposConverter");

class ThermalPrinterService {
  constructor() {
    this.printer = null;
    this.converter = null;

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
  }

  initialize() {
    this.printer = new ThermalPrinter(this.config);
    this.converter = new HtmlToEscposConverter(this.printer);
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
   * Print a pre-rendered HTML receipt string.
   * The React side (ReceiptView) renders the receipt to HTML; we receive that
   * HTML here and convert it to ESC/POS commands for the thermal printer.
   * @param {string} renderedHtml - Fully rendered receipt HTML from ReceiptView
   */
  async printRenderedHtml(renderedHtml) {
    try {
      const isConnected = await this.isConnected();
      if (!isConnected) {
        throw new Error("Printer not connected");
      }

      await this.converter.convert(renderedHtml);
      return { success: true };
    } catch (error) {
      console.error("Thermal print error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ThermalPrinterService();
