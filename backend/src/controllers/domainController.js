import { config } from '../config/index.js';

export class DomainController {
  constructor(domainService) {
    this.domainService = domainService;
  }

  search = async (req, res, next) => {
    try {
      const query = req.query.q || req.query.query || '';
      const result = await this.domainService.search(query);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req, res, next) => {
    try {
      const { domainName } = req.params;
      const result = await this.domainService.getDomainStatus(domainName);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getConfig = async (req, res, next) => {
    try {
      // Dynamic config sent to client - zero hardcoding in frontend
      return res.status(200).json({
        success: true,
        data: {
          currency: config.currency,
          currencySymbol: config.currencySymbol,
          taxRate: config.taxRate,
          reservationTTLSeconds: config.reservationTTLSeconds,
          supportedTlds: config.supportedTlds
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
