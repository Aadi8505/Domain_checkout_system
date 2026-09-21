export class CheckoutController {
  constructor(checkoutService) {
    this.checkoutService = checkoutService;
  }

  reserve = async (req, res, next) => {
    try {
      const { domainName, customerEmail, years } = req.body;
      if (!domainName) {
        return res.status(400).json({ success: false, message: 'Domain name is required' });
      }

      const reservation = await this.checkoutService.reserveDomain({
        domainName,
        customerEmail,
        years: Number(years) || 1
      });

      return res.status(201).json({
        success: true,
        data: reservation
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  purchase = async (req, res, next) => {
    try {
      const { reservationId, domainName, years, customer, paymentDetails } = req.body;

      if (!domainName) {
        return res.status(400).json({ success: false, message: 'Domain name is required' });
      }
      if (!customer || !customer.email || !customer.name) {
        return res.status(400).json({
          success: false,
          message: 'Customer name and email are mandatory for WHOIS registration and ownership.'
        });
      }

      const orderReceipt = await this.checkoutService.processPurchase({
        reservationId,
        domainName,
        years: Number(years) || 1,
        customer,
        paymentDetails: paymentDetails || {}
      });

      return res.status(200).json({
        success: true,
        data: orderReceipt
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  getMyDomains = async (req, res, next) => {
    try {
      const email = req.query.email;
      const domains = await this.checkoutService.getDomainsByCustomer(email);
      return res.status(200).json({
        success: true,
        data: domains
      });
    } catch (error) {
      next(error);
    }
  };

  getAllPurchased = async (req, res, next) => {
    try {
      const domains = await this.checkoutService.getAllRegisteredDomains();
      return res.status(200).json({
        success: true,
        data: domains
      });
    } catch (error) {
      next(error);
    }
  };
}
